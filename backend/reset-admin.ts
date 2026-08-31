import bcrypt from 'bcryptjs';
import { pool } from './config/db';

const resetAdmin = async () => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_RESET !== 'true') {
      console.error('❌ Refusing to reset admin password in production. Set ALLOW_ADMIN_RESET=true to override.');
      process.exit(1);
    }

    const newPassword = process.env.ADMIN_PASSWORD;
    if (!newPassword) {
      console.error('❌ ADMIN_PASSWORD environment variable is required (e.g. ADMIN_PASSWORD=YourPassword npm run reset-admin).');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      'UPDATE users SET password = ?, is_active = 1, role_id = 1, is_email_verified = TRUE, email_verified_at = NOW() WHERE username = "admin" OR email = "admin@growventory.com"',
      [hashedPassword]
    );

    console.log('✅ Admin password reset (value taken from ADMIN_PASSWORD).');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

resetAdmin();