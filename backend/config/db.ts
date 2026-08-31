import mysql from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'growventory',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initTables = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.execute<ResultSetHeader>(`CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY, role_name VARCHAR(50) UNIQUE, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

    await conn.execute<ResultSetHeader>(`CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE, email VARCHAR(100) UNIQUE, password VARCHAR(255),
    full_name VARCHAR(100), phone VARCHAR(20), role_id INT, is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE, email_verified_at TIMESTAMP NULL, requested_role VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id))`);

    // Ensure email verification columns exist for existing installations
    try {
      await conn.execute<ResultSetHeader>(`ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE`);
    } catch (e) {}
    try {
      await conn.execute<ResultSetHeader>(`ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL`);
    } catch (e) {}
    try {
      await conn.execute<ResultSetHeader>(`ALTER TABLE users ADD COLUMN requested_role VARCHAR(50) NULL`);
    } catch (e) {}
    // Backfill: mark existing users with role as verified (optional — keeps old accounts usable)
    try {
      await conn.execute<ResultSetHeader>(`UPDATE users SET is_email_verified = TRUE WHERE role_id IS NOT NULL AND is_email_verified = FALSE`);
    } catch (e) {}

    await conn.execute<ResultSetHeader>(`CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY, category_name VARCHAR(100), description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

    await conn.execute<ResultSetHeader>(`CREATE TABLE IF NOT EXISTS plants (
    plant_id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), scientific_name VARCHAR(150), category_id INT,
    current_stock INT DEFAULT 0, min_stock_threshold INT DEFAULT 10, health_status ENUM('healthy','under_observation','poor','critical') DEFAULT 'healthy',
    growth_stage VARCHAR(50), location VARCHAR(100), purchase_price DECIMAL(10,2), selling_price DECIMAL(10,2), description TEXT, image_url VARCHAR(255),
    last_health_check TIMESTAMP NULL, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id))`);

    await conn.execute<ResultSetHeader>(`CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id INT AUTO_INCREMENT PRIMARY KEY, plant_id INT, movement_type ENUM('IN','OUT','ADJUSTMENT'), quantity INT,
    previous_stock INT, new_stock INT, notes TEXT, created_by INT, movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_status ENUM('approved','pending','rejected') DEFAULT 'approved',
    approved_by INT NULL, approved_at TIMESTAMP NULL,
    FOREIGN KEY (plant_id) REFERENCES plants(plant_id), FOREIGN KEY (created_by) REFERENCES users(user_id))`);

    // Add new columns if they don't exist (for existing installations)
    try {
      await conn.execute<ResultSetHeader>(`ALTER TABLE stock_movements ADD COLUMN approval_status ENUM('approved','pending','rejected') DEFAULT 'approved'`);
    } catch (e) {}
    try {
      await conn.execute<ResultSetHeader>(`ALTER TABLE stock_movements ADD COLUMN approved_by INT NULL`);
    } catch (e) {}
    try {
      await conn.execute<ResultSetHeader>(`ALTER TABLE stock_movements ADD COLUMN approved_at TIMESTAMP NULL`);
    } catch (e) {}

    // Ensure is_active exists for soft-delete
    try {
      await conn.execute<ResultSetHeader>(`ALTER TABLE plants ADD COLUMN is_active BOOLEAN DEFAULT TRUE`);
    } catch (e) {}

    await conn.execute<ResultSetHeader>(`CREATE TABLE IF NOT EXISTS plant_health_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY, plant_id INT, health_status ENUM('healthy','under_observation','poor','critical'),
    growth_stage VARCHAR(50), notes TEXT, checked_by INT, check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(plant_id), FOREIGN KEY (checked_by) REFERENCES users(user_id))`);

    await conn.execute<ResultSetHeader>(`CREATE TABLE IF NOT EXISTS activity_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action_type VARCHAR(50), table_name VARCHAR(50),
    record_id INT, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(user_id))`);

    await conn.execute<ResultSetHeader>(`CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, title VARCHAR(100), message TEXT,
    type VARCHAR(50) DEFAULT 'system', is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id))`);

    // Migrate existing ENUM column to VARCHAR if needed (handle schema changes)
    try {
      const [cols] = await conn.execute<RowDataPacket[]>(`SHOW COLUMNS FROM notifications WHERE Field = 'type'`);
      if (cols.length > 0 && cols[0].Type.toLowerCase().startsWith('enum')) {
        await conn.execute<ResultSetHeader>(`ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50) DEFAULT 'system'`);
      }
    } catch (_) {}

    await conn.execute<ResultSetHeader>(`CREATE TABLE IF NOT EXISTS tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL, description TEXT,
    assigned_to INT NOT NULL, assigned_by INT NOT NULL,
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    status ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending',
    due_date DATE NULL, completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id), FOREIGN KEY (assigned_by) REFERENCES users(user_id))`);

    await conn.execute<ResultSetHeader>(`CREATE TABLE IF NOT EXISTS email_otps (
    otp_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose ENUM('email_verification','password_reset') NOT NULL,
    expires_at DATETIME NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_purpose (email, purpose),
    INDEX idx_expires_at (expires_at)
    )`);

    await conn.execute<ResultSetHeader>(`CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);

    // Seed default settings
    const defaultSettings = [
      ['low_stock_threshold', '10'],
      ['require_stock_approval', 'false'],
      ['notification_email_enabled', 'false'],
      ['currency', 'USD'],
      ['date_format', 'YYYY-MM-DD'],
      ['auto_approve_registrations', 'false']
    ];
    for (const [key, value] of defaultSettings) {
      await conn.execute<ResultSetHeader>(
        'INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)',
        [key, value]
      );
    }

    console.log('✅ Tables initialized');
  } finally {
    conn.release();
  }
};

const testConnection = async () => {
  try {
    await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    await initTables();
  } catch (error: any) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
};

export { pool, testConnection };
