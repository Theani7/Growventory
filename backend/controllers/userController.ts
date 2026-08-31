import bcrypt from 'bcryptjs';
import { RequestHandler } from 'express';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { pool } from '../config/db';
import { createNotification } from './notificationController';

const isStrongPassword = (p: string) =>
  p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);

// Get all users (admin only), uses LEFT JOIN so pending users (role_id NULL) are included
const getAllUsers: RequestHandler = async (req, res) => {
  try {
    const [users] = await pool.execute<RowDataPacket[]>(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.role_id, u.is_active, u.requested_role,
              u.created_at, r.role_name,
              CASE 
                WHEN u.role_id IS NULL THEN 'pending'
                WHEN u.is_active = 0 THEN 'disabled'
                ELSE 'active'
              END AS account_status
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       ORDER BY 
         CASE WHEN u.role_id IS NULL THEN 0 ELSE 1 END,
         u.created_at DESC`
    );
    res.json({ success: true, message: 'Users fetched.', data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Get pending users only (admin)
const getPendingUsers: RequestHandler = async (req, res) => {
  try {
    const [users] = await pool.execute<RowDataPacket[]>(
      `SELECT user_id, username, email, full_name, phone, requested_role, created_at
       FROM users
       WHERE role_id IS NULL
       ORDER BY created_at ASC`
    );
    res.json({ success: true, message: 'Pending users fetched.', data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending users.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Get all roles
const getAllRoles: RequestHandler = async (req, res) => {
  try {
    const [roles] = await pool.execute<RowDataPacket[]>('SELECT * FROM roles ORDER BY role_id');
    res.json({ success: true, message: 'Roles fetched.', data: roles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch roles.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Get own profile (any authenticated role)
const getMyProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.user!.user_id;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.role_id, r.role_name, u.is_active, u.is_email_verified, u.created_at
       FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?`,
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'Profile fetched.', data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Update own profile (full_name, phone)
const updateMyProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.user!.user_id;
    const { full_name, phone } = req.body;
    if (full_name !== undefined && String(full_name).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Full name cannot be empty.' });
    }
    if (phone && String(phone).trim() !== '') {
      const phoneStr = String(phone).trim();
      const digits = phoneStr.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15 || !/^\+?[\d\s\-\(\)]+$/.test(phoneStr)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number. Use 10-15 digits, may include +, spaces, dashes, parentheses.' });
      }
    }
    await pool.execute<ResultSetHeader>(
      `UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?`,
      [full_name?.toString().trim() || null, phone?.toString().trim() || null, userId]
    );
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.role_id, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?`,
      [userId]
    );
    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [userId, 'UPDATE_PROFILE', 'users', userId, `Updated own profile`]
    );
    res.json({ success: true, message: 'Profile updated.', data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update profile.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Change own password
const changeMyPassword: RequestHandler = async (req, res) => {
  try {
    const userId = req.user!.user_id;
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }
    if (!isStrongPassword(new_password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' });
    }
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT password FROM users WHERE user_id = ?`, [userId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    const ok = await bcrypt.compare(current_password, rows[0].password);
    if (!ok) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.execute<ResultSetHeader>(`UPDATE users SET password = ? WHERE user_id = ?`, [hashed, userId]);
    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [userId, 'CHANGE_PASSWORD', 'users', userId, `Changed own password`]
    );
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to change password.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Approve a pending user (admin), assigns role and activates account
const approveUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    if (!role_id) {
      return res.status(400).json({ success: false, message: 'role_id is required to approve a user.' });
    }

    // Validate the role exists
    const [roles] = await pool.execute<RowDataPacket[]>('SELECT role_id, role_name FROM roles WHERE role_id = ?', [role_id]);
    if (roles.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id, username, role_id, requested_role FROM users WHERE user_id = ?',
      [id]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (users[0].role_id !== null) {
      return res.status(400).json({ success: false, message: 'User is not pending, already has a role assigned.' });
    }

    // Enforce requested role on first approval, admin cannot change it
    if (users[0].requested_role) {
      const requested = String(users[0].requested_role).toLowerCase();
      const chosen = String(roles[0].role_name).toLowerCase();
      if (requested !== chosen) {
        return res.status(400).json({
          success: false,
          message: `Cannot change requested role on first approval. User requested "${users[0].requested_role}" but you tried to assign "${roles[0].role_name}".`
        });
      }
    }

    await pool.execute<ResultSetHeader>(
      'UPDATE users SET role_id = ?, is_active = 1 WHERE user_id = ?',
      [role_id, id]
    );

    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [req.user!.user_id, 'APPROVE_USER', 'users', id,
        `Approved user "${users[0].username}" as ${roles[0].role_name}`]
    );

    // Notify the approved user
    await createNotification(
      parseInt(id),
      'Account Approved',
      `Your account has been approved with the role "${roles[0].role_name}". You can now sign in and start using the system.`,
      'approval'
    );

    res.json({ success: true, message: `User approved as ${roles[0].role_name}.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to approve user.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Reject a pending user (admin), deletes the registration
const rejectUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id, username, email, role_id FROM users WHERE user_id = ?',
      [id]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (users[0].role_id !== null) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject, user already has a role. Use deactivate or delete instead.'
      });
    }

    // Activity log BEFORE delete (so we have a trail), uses admin as actor
    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [req.user!.user_id, 'REJECT_USER', 'users', id,
        `Rejected user registration "${users[0].username}" (${users[0].email})${reason ? `, Reason: ${reason}` : ''}`]
    );

    // Clean up references to this user before delete (FK constraints)
    await pool.execute<ResultSetHeader>('DELETE FROM activity_logs WHERE user_id = ?', [id]);
    await pool.execute<ResultSetHeader>('DELETE FROM notifications WHERE user_id = ?', [id]);

    await pool.execute<ResultSetHeader>('DELETE FROM users WHERE user_id = ?', [id]);

    res.json({ success: true, message: 'User registration rejected and removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to reject user.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Create user (admin), direct creation always assigns a role
const createUser: RequestHandler = async (req, res) => {
  try {
    const { username, email, password, full_name, phone, role_id } = req.body;

    if (!username || !email || !password || !role_id) {
      return res.status(400).json({ success: false, message: 'Username, email, password, role required.' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' });
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or email already exists.' });
    }

    if (phone && String(phone).trim() !== '') {
      const phoneStr = String(phone).trim();
      const digits = phoneStr.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15 || !/^\+?[\d\s\-\(\)]+$/.test(phoneStr)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number. Use 10-15 digits, may include +, spaces, dashes, parentheses.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (username, email, password, full_name, phone, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [username, email, hashedPassword, full_name || null, phone || null, role_id]
    );

    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user!.user_id, 'CREATE', 'users', result.insertId, `Created new user: ${username}`]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: { user_id: result.insertId }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create user.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Update user
const updateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, full_name, phone, role_id, is_active } = req.body;

    const [existing] = await pool.execute<RowDataPacket[]>('SELECT username FROM users WHERE user_id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    if (phone && String(phone).trim() !== '') {
      const phoneStr = String(phone).trim();
      const digits = phoneStr.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15 || !/^\+?[\d\s\-\(\)]+$/.test(phoneStr)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number. Use 10-15 digits, may include +, spaces, dashes, parentheses.' });
      }
    }

    await pool.execute<ResultSetHeader>(
      `UPDATE users SET username = ?, email = ?, full_name = ?, phone = ?, role_id = ?, is_active = ?
       WHERE user_id = ?`,
      [username, email, full_name || null, phone || null, role_id || null, is_active ? 1 : 0, id]
    );

    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user!.user_id, 'UPDATE', 'users', id, `Updated user: ${username}`]
    );

    res.json({ success: true, message: 'User updated.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update user.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Toggle user active status, only meaningful for users with a role assigned
const toggleUserActive: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT username, is_active, role_id FROM users WHERE user_id = ?',
      [id]
    );
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    if (existing[0].role_id === null) {
      return res.status(400).json({
        success: false,
        message: 'Cannot toggle a pending user. Approve or reject them instead.'
      });
    }

    await pool.execute<ResultSetHeader>('UPDATE users SET is_active = NOT is_active WHERE user_id = ?', [id]);

    const action = existing[0].is_active ? 'Deactivated' : 'Activated';

    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user!.user_id, 'TOGGLE_ACTIVE', 'users', id, `${action} user: ${existing[0].username}`]
    );

    res.json({ success: true, message: 'User status toggled.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Reset password
const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    if (!new_password || !isStrongPassword(new_password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' });
    }

    const [existing] = await pool.execute<RowDataPacket[]>('SELECT username FROM users WHERE user_id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.execute<ResultSetHeader>('UPDATE users SET password = ? WHERE user_id = ?', [hashed, id]);

    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user!.user_id, 'PASSWORD_RESET', 'users', id, `Reset password for user: ${existing[0].username}`]
    );

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Delete user
const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user!.user_id) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself.' });
    }

    const [existing] = await pool.execute<RowDataPacket[]>('SELECT username FROM users WHERE user_id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    const connection: PoolConnection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Activity log first (with admin as actor)
      await connection.execute<ResultSetHeader>(
        `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
        [req.user!.user_id, 'DELETE', 'users', id, `Deleted user: ${existing[0].username}`]
      );

      // Clean up references to this user before delete (FK constraints)
      await connection.execute<ResultSetHeader>('DELETE FROM activity_logs WHERE user_id = ?', [id]);
      await connection.execute<ResultSetHeader>('DELETE FROM notifications WHERE user_id = ?', [id]);
      // For tables with NOT NULL FKs (tasks), delete the rows rather than nulling
      await connection.execute<ResultSetHeader>('DELETE FROM tasks WHERE assigned_to = ? OR assigned_by = ?', [id, id]);
      // Nullable FKs, just clear the reference
      await connection.execute<ResultSetHeader>('UPDATE stock_movements SET created_by = NULL WHERE created_by = ?', [id]);
      await connection.execute<ResultSetHeader>('UPDATE stock_movements SET approved_by = NULL WHERE approved_by = ?', [id]);
      await connection.execute<ResultSetHeader>('UPDATE plant_health_logs SET checked_by = NULL WHERE checked_by = ?', [id]);

      try {
        await connection.execute<ResultSetHeader>('DELETE FROM users WHERE user_id = ?', [id]);
      } catch (fkError: any) {
        await connection.rollback();
        if (fkError?.code === 'ER_ROW_IS_REFERENCED_2' || fkError?.code === 'ER_NO_REFERENCED_ROW_2' || fkError?.errno === 1451 || fkError?.errno === 1452) {
          return res.status(409).json({
            success: false,
            message: 'Cannot delete user, they have associated records that prevent deletion. Consider deactivating instead.',
            error: fkError.message
          });
        }
        throw fkError;
      }

      await connection.commit();
      res.json({ success: true, message: 'User deleted.' });
    } catch (txError: any) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export {
  getAllUsers,
  getPendingUsers,
  getAllRoles,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  createUser,
  updateUser,
  toggleUserActive,
  resetPassword,
  deleteUser,
  approveUser,
  rejectUser,
};