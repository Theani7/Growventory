const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');

const seedAdmin = async () => {
  try {
    // Admin credentials
    const adminCredentials = {
      username: 'admin',
      email: 'admin@growventory.com',
      password: 'Admin@123',
      full_name: 'System Administrator',
      phone: '1234567890'
    };

    // Hash password
    const hashedPassword = await bcrypt.hash(adminCredentials.password, 10);

    // Check if admin already exists
    const [existing] = await pool.execute(
      'SELECT user_id FROM users WHERE email = ? OR username = ?',
      [adminCredentials.email, adminCredentials.username]
    );

    if (existing.length > 0) {
      console.log('⚠️  Admin user already exists. Updating password...');
      await pool.execute(
        'UPDATE users SET password = ?, is_active = 1, role_id = 1 WHERE email = ? OR username = ?', 
        [hashedPassword, adminCredentials.email, adminCredentials.username]
      );
      console.log('✅ Admin password updated successfully!');
    } else {
      // Insert admin user (role_id = 1 for Admin, is_active = 1)
      await pool.execute(
        `INSERT INTO users (username, email, password, full_name, phone, role_id, is_active) 
         VALUES (?, ?, ?, ?, ?, 1, 1)`,
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
    console.log('   Password: Admin@123');
    console.log('\n⚠️  Please change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
