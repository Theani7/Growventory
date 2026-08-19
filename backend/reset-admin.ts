import bcrypt from 'bcryptjs';
import { pool } from './config/db';

const resetAdmin = async () => {
  try {
    const newPassword = 'admin';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      'UPDATE users SET password = ?, is_active = 1, role_id = 1 WHERE username = "admin" OR email = "admin@growventory.com"',
      [hashedPassword]
    );

    console.log('✅ Admin password reset to: admin');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

resetAdmin();