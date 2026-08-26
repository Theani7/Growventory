import bcrypt from 'bcryptjs';
import { RequestHandler } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';
import { generateToken } from '../utils/generateToken';
import { notifyAdminsAndSupervisors } from './notificationController';

// Helper — read a system setting
const getSetting = async (key: string, defaultValue = ''): Promise<string> => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      [key]
    );
    return rows.length ? rows[0].setting_value : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Register new user.
// New users land in a "pending" state: role_id = NULL, is_active = 0.
// Admin must approve from the Users page before they can log in.
// Optional: `auto_approve_registrations` setting (default false) — if true, new users
// are auto-assigned the `staff` role and activated immediately.
const register: RequestHandler = async (req, res) => {
  try {
    // Note: any role_id from the request body is intentionally ignored — clients can never
    // self-assign a role. Roles are assigned only by an admin during approval.
    const { username, email, password, full_name, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check if email or username already exists
    const [existingUsers] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already registered.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Decide approval policy
    const autoApprove = (await getSetting('auto_approve_registrations', 'false')) === 'true';

    let role_id = null;
    let is_active = 0;
    if (autoApprove) {
      // Auto-assign the lowest-privilege role (staff)
      const [staffRole] = await pool.execute<RowDataPacket[]>(
        "SELECT role_id FROM roles WHERE role_name = 'staff' LIMIT 1"
      );
      if (staffRole.length > 0) {
        role_id = staffRole[0].role_id;
        is_active = 1;
      }
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (username, email, password, full_name, phone, role_id, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, full_name || null, phone || null, role_id, is_active]
    );

    // Activity log
    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        result.insertId,
        'REGISTER',
        'users',
        result.insertId,
        autoApprove
          ? `New user "${username}" registered and auto-approved as staff`
          : `New user "${username}" registered — awaiting admin approval`
      ]
    );

    // Notify admins/supervisors of pending registration
    if (!autoApprove) {
      await notifyAdminsAndSupervisors(
        'New User Registration',
        `${username} (${email}) registered and is awaiting role assignment.`,
        'approval'
      );
    }

    res.status(201).json({
      success: true,
      message: autoApprove
        ? 'Registration successful. You can now sign in.'
        : 'Registration submitted. An administrator will review your account and assign a role. You will be notified once approved.',
      data: {
        user_id: result.insertId,
        username,
        email,
        pending: !autoApprove
      }
    });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Registration failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
const login: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    // LEFT JOIN so users without role_id (pending) are still returned
    const [users] = await pool.execute<RowDataPacket[]>(
      `SELECT u.user_id, u.username, u.email, u.password, u.role_id, r.role_name, u.is_active 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       WHERE u.username = ? OR u.email = ?`,
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    const user = users[0];

    // Verify password BEFORE revealing account state to avoid info leakage
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Pending — role not yet assigned
    if (!user.role_id || !user.role_name) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending administrator approval. You will be able to sign in once a role is assigned.',
        code: 'PENDING_APPROVAL'
      });
    }

    // Disabled
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact your administrator.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    const token = generateToken({ userId: user.user_id, roleId: user.role_id });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role_id: user.role_id,
          role_name: user.role_name
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current logged-in user
const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'User fetched successfully.',
      data: req.user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Seed default roles (run once during initial setup)
const seedRoles: RequestHandler = async (req, res) => {
  try {
    const roles = [
      { role_id: 1, role_name: 'admin', description: 'Full system access' },
      { role_id: 2, role_name: 'supervisor', description: 'Supervisor access' },
      { role_id: 3, role_name: 'staff', description: 'Standard staff access' },
      { role_id: 4, role_name: 'auditor', description: 'Read-only access' }
    ];

    for (const role of roles) {
      await pool.execute<ResultSetHeader>(
        'INSERT IGNORE INTO roles (role_id, role_name, description) VALUES (?, ?, ?)',
        [role.role_id, role.role_name, role.description]
      );
    }

    res.json({
      success: true,
      message: 'Default roles seeded successfully.',
      data: roles
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to seed roles.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { register, login, getCurrentUser, seedRoles };