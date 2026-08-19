import bcrypt from 'bcryptjs';
import type { RowDataPacket } from 'mysql2';
import { pool } from './config/db';

const testLogin = async (username: string, password: string) => {
  try {
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT password FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      console.log('User not found');
      return;
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);

    console.log(`Checking password for ${username}...`);
    console.log(`Input password: ${password}`);
    console.log(`Stored hash: ${user.password}`);
    console.log(`Match: ${match}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Test with admin credentials
testLogin('admin', 'Admin@123');