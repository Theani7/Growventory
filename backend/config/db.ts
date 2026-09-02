import mysql from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import 'dotenv/config';
import { runMigrations } from '../migrate';

// Fail-fast if DB password missing in production (prevent insecure default)
if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
  console.error('FATAL: DB_PASSWORD environment variable is required in production');
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'growventory',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 100,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

const testConnection = async () => {
  let conn: PoolConnection | null = null;
  try {
    conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    await runMigrations();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ MySQL connection failed:', message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
};

export { pool, testConnection };
