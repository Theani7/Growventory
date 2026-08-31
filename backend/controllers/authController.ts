import bcrypt from 'bcryptjs';
import { RequestHandler } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';
import { generateToken } from '../utils/generateToken';
import { notifyAdminsAndSupervisors } from './notificationController';
import { generateOTP, hashOTP, verifyOTP, getExpiryDate, OTP_MAX_ATTEMPTS, OTP_RESEND_COOLDOWN_SECONDS } from '../utils/otp';
import { sendVerificationOTP as sendVerificationEmail, sendPasswordResetOTP as sendPasswordResetEmail } from '../services/emailService';

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

// ---------------- OTP Helpers ----------------
const canResendOTP = async (email: string, purpose: string): Promise<{ allowed: boolean; waitSeconds?: number }> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT created_at FROM email_otps WHERE email = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1`,
    [email, purpose]
  );
  if (rows.length === 0) return { allowed: true };
  const last = new Date(rows[0].created_at as string).getTime();
  const elapsed = (Date.now() - last) / 1000;
  if (elapsed < OTP_RESEND_COOLDOWN_SECONDS) {
    return { allowed: false, waitSeconds: Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed) };
  }
  return { allowed: true };
};

const createAndSendOTP = async (email: string, purpose: 'email_verification' | 'password_reset', username?: string) => {
  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  const expiresAt = getExpiryDate();

  // Invalidate previous unverified OTPs for same purpose? Keep them but they'll be superseded by latest
  // Optionally delete expired
  try {
    await pool.execute(`DELETE FROM email_otps WHERE expires_at < NOW()`);
  } catch {}

  await pool.execute<ResultSetHeader>(
    `INSERT INTO email_otps (email, otp_hash, purpose, expires_at) VALUES (?, ?, ?, ?)`,
    [email, otpHash, purpose, expiresAt]
  );

  // Send email (non-blocking failure)
  try {
    if (purpose === 'email_verification') {
      await sendVerificationEmail(email, otp, username);
    } else {
      await sendPasswordResetEmail(email, otp, username);
    }
  } catch (err: any) {
    console.error(`Failed to send ${purpose} OTP to ${email}:`, err.message);
    // In dev, log OTP to console so testing still works
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV OTP ${purpose}] ${email} => ${otp} (expires ${expiresAt.toISOString()})`);
    }
    // Don't fail request — OTP is stored; user can still verify if email misconfigured and dev sees logs
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[OTP] ${purpose} for ${email}: ${otp} (expires ${expiresAt.toISOString()})`);
  }

  return otp; // returned only for dev logging, never sent to client except in dev response
};

const verifyOTPInternal = async (email: string, otp: string, purpose: 'email_verification' | 'password_reset'): Promise<{ ok: boolean; message?: string; otpId?: number }> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT otp_id, otp_hash, expires_at, verified, attempts FROM email_otps 
     WHERE email = ? AND purpose = ? AND verified = FALSE AND expires_at > NOW() 
     ORDER BY created_at DESC LIMIT 1`,
    [email, purpose]
  );

  if (rows.length === 0) {
    return { ok: false, message: 'Invalid or expired code. Please request a new one.' };
  }

  const record = rows[0] as any;

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, message: 'Too many failed attempts. Please request a new code.' };
  }

  const isValid = await verifyOTP(otp, record.otp_hash);
  if (!isValid) {
    await pool.execute(`UPDATE email_otps SET attempts = attempts + 1 WHERE otp_id = ?`, [record.otp_id]);
    const remaining = OTP_MAX_ATTEMPTS - (record.attempts + 1);
    return { ok: false, message: `Invalid code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'No attempts left — request a new code.'}` };
  }

  // Mark as verified
  await pool.execute(`UPDATE email_otps SET verified = TRUE WHERE otp_id = ?`, [record.otp_id]);
  return { ok: true, otpId: record.otp_id };
};

// Register new user.
// New users land in a "pending" state: role_id = NULL, is_active = 0.
// Admin must approve from the Users page before they can log in.
// Optional: `auto_approve_registrations` setting (default false) — if true, new users
// are auto-assigned the `staff` role and activated immediately.
const register: RequestHandler = async (req, res) => {
  try {
    // requested_role is a *request* — still pending until admin approval (role_id stays NULL unless autoApprove)
    const { username, email, password, full_name, phone, requested_role } = req.body;

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

    // Validate requested role (optional) — staff/supervisor/auditor only; admin cannot be self-requested
    const allowedRequested = ['staff', 'supervisor', 'auditor'];
    let normalizedRequested: string | null = null;
    if (requested_role) {
      const r = String(requested_role).toLowerCase().trim();
      if (!allowedRequested.includes(r)) {
        return res.status(400).json({ success: false, message: 'Invalid requested role. Choose staff, supervisor, or auditor.' });
      }
      normalizedRequested = r;
    } else {
      normalizedRequested = 'staff'; // default request
    }

    // Check if email or username already exists
    const [existingUsers] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id, is_email_verified FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      // If existing user is unverified and same email, allow resending OTP instead of hard 409?
      // Keep 409 for now to avoid enumeration ambiguity
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
      `INSERT INTO users (username, email, password, full_name, phone, role_id, is_active, is_email_verified, requested_role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, ?)`,
      [username, email, hashedPassword, full_name || null, phone || null, role_id, is_active, normalizedRequested]
    );

    // Create verification OTP
    try {
      await createAndSendOTP(email, 'email_verification', username);
    } catch (e: any) {
      console.error('Failed to create verification OTP on register:', e.message);
    }

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
          : `New user "${username}" registered — awaiting email verification and admin approval`
      ]
    );

    // Notify admins/supervisors of pending registration only after verification? Notify now for visibility
    if (!autoApprove) {
      await notifyAdminsAndSupervisors(
        'New User Registration',
        `${username} (${email}) requested role: ${normalizedRequested} — awaiting email verification and role assignment.`,
        'approval'
      );
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. A 4-digit verification code has been sent to your email. Please verify to continue.',
      data: {
        user_id: result.insertId,
        username,
        email,
        pending: !autoApprove,
        requiresVerification: true,
        requested_role: normalizedRequested
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
      `SELECT u.user_id, u.username, u.email, u.password, u.role_id, r.role_name, u.is_active, u.is_email_verified 
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

    // Email verification required first
    if (!user.is_email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email. A 4-digit code was sent to your email address.',
        code: 'EMAIL_NOT_VERIFIED',
        data: { email: user.email }
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

// Send email verification OTP
const sendVerificationOTP: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Invalid email format.' });

    const [users] = await pool.execute<RowDataPacket[]>(`SELECT user_id, username, is_email_verified FROM users WHERE email = ?`, [email]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'No account found with this email.' });
    const user = users[0] as any;
    if (user.is_email_verified) return res.status(400).json({ success: false, message: 'Email is already verified. You can sign in.' });

    const { allowed, waitSeconds } = await canResendOTP(email, 'email_verification');
    if (!allowed) return res.status(429).json({ success: false, message: `Please wait ${waitSeconds}s before requesting a new code.` });

    await createAndSendOTP(email, 'email_verification', user.username);

    res.json({
      success: true,
      message: 'Verification code sent. Please check your email (including spam folder). Valid for 10 minutes.',
      data: process.env.NODE_ENV === 'development' ? { devNote: 'Code logged to server console if email not configured' } : undefined
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to send verification code.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Verify email with OTP
const verifyEmail: RequestHandler = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and 4-digit code are required.' });
    if (!/^\d{4}$/.test(otp)) return res.status(400).json({ success: false, message: 'Code must be 4 digits.' });

    const [users] = await pool.execute<RowDataPacket[]>(`SELECT user_id, is_email_verified FROM users WHERE email = ?`, [email]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'No account found with this email.' });
    const user = users[0] as any;
    if (user.is_email_verified) return res.status(400).json({ success: false, message: 'Email is already verified.' });

    const result = await verifyOTPInternal(email, otp, 'email_verification');
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });

    await pool.execute(`UPDATE users SET is_email_verified = TRUE, email_verified_at = NOW() WHERE user_id = ?`, [user.user_id]);

    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [user.user_id, 'VERIFY_EMAIL', 'users', user.user_id, `User verified email ${email}`]
    );

    // Clean up used OTPs
    await pool.execute(`DELETE FROM email_otps WHERE email = ? AND purpose = 'email_verification'`, [email]);

    // Check if still pending admin approval
    const [updatedUsers] = await pool.execute<RowDataPacket[]>(`SELECT username, role_id, is_active FROM users WHERE user_id = ?`, [user.user_id]);
    const updated = updatedUsers[0] as any;
    const isPending = !updated.role_id || !updated.is_active;

    if (isPending) {
      res.json({
        success: true,
        message: 'Email verified successfully. Your account is awaiting administrator approval.',
        data: { pending: true, username: updated.username, email }
      });
    } else {
      res.json({
        success: true,
        message: 'Email verified successfully. You can now sign in.',
        data: { pending: false, username: updated.username, email }
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Verification failed.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Forgot password — send OTP
const forgotPassword: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Invalid email format.' });

    // Always return generic success to prevent enumeration, but only send if user exists
    const [users] = await pool.execute<RowDataPacket[]>(`SELECT user_id, username FROM users WHERE email = ?`, [email]);
    if (users.length === 0) {
      // Simulate delay to prevent timing attack
      await new Promise(r => setTimeout(r, 500));
      return res.json({ success: true, message: 'If an account exists with this email, a reset code has been sent. Please check your inbox.' });
    }
    const user = users[0] as any;

    const { allowed, waitSeconds } = await canResendOTP(email, 'password_reset');
    if (!allowed) return res.status(429).json({ success: false, message: `Please wait ${waitSeconds}s before requesting a new code.` });

    await createAndSendOTP(email, 'password_reset', user.username);

    res.json({ success: true, message: 'If an account exists with this email, a 4-digit reset code has been sent. Valid for 10 minutes.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to send reset code.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Verify reset OTP (optional step for UI to validate before showing new password fields)
const verifyResetOTP: RequestHandler = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and 4-digit code are required.' });
    if (!/^\d{4}$/.test(otp)) return res.status(400).json({ success: false, message: 'Code must be 4 digits.' });

    // Check user exists
    const [users] = await pool.execute<RowDataPacket[]>(`SELECT user_id FROM users WHERE email = ?`, [email]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'No account found with this email.' });

    // Look for valid OTP (don't mark verified yet? For step validation, we mark but keep for reset)
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT otp_id, otp_hash, expires_at, attempts FROM email_otps WHERE email = ? AND purpose = 'password_reset' AND verified = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [email]
    );
    if (rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid or expired code. Please request a new one.' });
    const record = rows[0] as any;
    if (record.attempts >= OTP_MAX_ATTEMPTS) return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new code.' });

    const isValid = await verifyOTP(otp, record.otp_hash);
    if (!isValid) {
      await pool.execute(`UPDATE email_otps SET attempts = attempts + 1 WHERE otp_id = ?`, [record.otp_id]);
      const remaining = OTP_MAX_ATTEMPTS - (record.attempts + 1);
      return res.status(400).json({ success: false, message: `Invalid code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'No attempts left — request a new code.'}` });
    }

    // Mark verified but keep for reset-password step (reset will check verified=TRUE and still within expiry window)
    await pool.execute(`UPDATE email_otps SET verified = TRUE WHERE otp_id = ?`, [record.otp_id]);

    res.json({ success: true, message: 'Code verified. You can now reset your password.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Verification failed.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Reset password with OTP
const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Email, code, and new password are required.' });
    if (!/^\d{4}$/.test(otp)) return res.status(400).json({ success: false, message: 'Code must be 4 digits.' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const [users] = await pool.execute<RowDataPacket[]>(`SELECT user_id FROM users WHERE email = ?`, [email]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'No account found with this email.' });
    const user = users[0] as any;

    // Find OTP: either verified recently (within expiry) OR unverified but valid
    // Allow both: if verifyResetOTP was called, it'll be verified=true; otherwise verify now
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT otp_id, otp_hash, expires_at, verified, attempts FROM email_otps WHERE email = ? AND purpose = 'password_reset' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [email]
    );
    if (rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid or expired code. Please request a new one.' });
    const record = rows[0] as any;

    if (record.attempts >= OTP_MAX_ATTEMPTS && !record.verified) {
      return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new code.' });
    }

    // If not already verified, verify now
    if (!record.verified) {
      const isValid = await verifyOTP(otp, record.otp_hash);
      if (!isValid) {
        await pool.execute(`UPDATE email_otps SET attempts = attempts + 1 WHERE otp_id = ?`, [record.otp_id]);
        const remaining = OTP_MAX_ATTEMPTS - (record.attempts + 1);
        return res.status(400).json({ success: false, message: `Invalid code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'No attempts left — request a new code.'}` });
      }
      await pool.execute(`UPDATE email_otps SET verified = TRUE WHERE otp_id = ?`, [record.otp_id]);
    } else {
      // Already verified via verifyResetOTP step — need to confirm otp matches the verified record
      const isValid = await verifyOTP(otp, record.otp_hash);
      if (!isValid) return res.status(400).json({ success: false, message: 'Invalid code for verified session.' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(`UPDATE users SET password = ?, updated_at = NOW() WHERE user_id = ?`, [hashedPassword, user.user_id]);

    // Invalidate all password_reset OTPs for this email
    await pool.execute(`DELETE FROM email_otps WHERE email = ? AND purpose = 'password_reset'`, [email]);

    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [user.user_id, 'RESET_PASSWORD', 'users', user.user_id, `User reset password via OTP`]
    );

    res.json({ success: true, message: 'Password reset successful. You can now sign in with your new password.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to reset password.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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

export { register, login, getCurrentUser, seedRoles, sendVerificationOTP, verifyEmail, forgotPassword, verifyResetOTP, resetPassword };
