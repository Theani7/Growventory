import bcrypt from 'bcryptjs';
import type { RowDataPacket } from 'mysql2';
import { pool } from './config/db';
import { runMigrations } from './migrate';

const seedAdmin = async () => {
  try {
    await runMigrations();

    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_RESET !== 'true') {
      console.error('❌ Refusing to seed admin in production. Set ALLOW_ADMIN_RESET=true to override.');
      process.exit(1);
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error('❌ ADMIN_PASSWORD environment variable is required (e.g. ADMIN_PASSWORD=YourPassword npm run seed).');
      process.exit(1);
    }

    // Ensure default roles exist (idempotent — matches the IDs authController uses).
    const roles = [
      { role_id: 1, role_name: 'admin', description: 'Full system access' },
      { role_id: 2, role_name: 'supervisor', description: 'Supervisor access' },
      { role_id: 3, role_name: 'staff', description: 'Standard staff access' },
      { role_id: 4, role_name: 'auditor', description: 'Read-only access' }
    ];
    for (const role of roles) {
      await pool.execute(
        'INSERT IGNORE INTO roles (role_id, role_name, description) VALUES (?, ?, ?)',
        [role.role_id, role.role_name, role.description]
      );
    }
    console.log('✓ Roles seeded');

    const adminCredentials = {
      username: 'admin',
      email: 'admin@growventory.com',
      password: adminPassword,
      full_name: 'System Administrator',
      phone: '1234567890'
    };

    const hashedPassword = await bcrypt.hash(adminCredentials.password, 10);

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id FROM users WHERE email = ? OR username = ?',
      [adminCredentials.email, adminCredentials.username]
    );

    if (existing.length > 0) {
      console.log('⚠️  Admin user already exists. Updating password...');
      await pool.execute(
        'UPDATE users SET password = ?, is_active = 1, role_id = 1, is_email_verified = TRUE, email_verified_at = NOW() WHERE email = ? OR username = ?',
        [hashedPassword, adminCredentials.email, adminCredentials.username]
      );
      console.log('✅ Admin password updated successfully!');
    } else {
      await pool.execute(
        `INSERT INTO users (username, email, password, full_name, phone, role_id, is_active, is_email_verified, email_verified_at)
         VALUES (?, ?, ?, ?, ?, 1, 1, TRUE, NOW())`,
        [
          adminCredentials.username,
          adminCredentials.email,
          hashedPassword,
          adminCredentials.full_name,
          adminCredentials.phone
        ]
      );
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n📧 Login Credentials:');
    console.log('   Email/Username: admin@growventory.com or admin');
    console.log(`   Password: (from ADMIN_PASSWORD environment variable)`);
    console.log('\n⚠️  Please change the password after first login!\n');

    process.exit(0);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Error seeding admin:', message);
    process.exit(1);
  }
};

seedAdmin();
