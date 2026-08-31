import { RequestHandler } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';

// Get all settings
const getAllSettings: RequestHandler = async (req, res) => {
  try {
    const [settings] = await pool.execute<RowDataPacket[]>('SELECT * FROM system_settings ORDER BY setting_key');
    const settingsObj: Record<string, any> = {};
    settings.forEach(s => { settingsObj[s.setting_key] = s.setting_value; });
    res.json({ success: true, message: 'Settings fetched.', data: settingsObj });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Update setting (admin only)
const updateSetting: RequestHandler = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Settings object required.' });
    }

    const ALLOWED = new Set(['low_stock_threshold','require_stock_approval','notification_email_enabled','currency','date_format','auto_approve_registrations','app_name']);
    for (const [key, value] of Object.entries(settings)) {
      if (!ALLOWED.has(key)) {
        return res.status(400).json({ success: false, message: `Invalid setting key: ${key}` });
      }
      // Validate boolean-like settings
      if (['require_stock_approval','notification_email_enabled','auto_approve_registrations'].includes(key)) {
        if (!['true','false'].includes(String(value))) {
          return res.status(400).json({ success: false, message: `Invalid value for ${key}: must be true or false` });
        }
      }
      await pool.execute<ResultSetHeader>(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [key, String(value)]
      );
    }

    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user!.user_id, 'UPDATE', 'system_settings', 0, `Updated settings: ${Object.keys(settings).join(', ')}`]
    );

    res.json({ success: true, message: 'Settings updated.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export { getAllSettings, updateSetting };