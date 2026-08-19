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
    res.status(500).json({ success: false, message: 'Failed.', error: error.message });
  }
};

// Update setting (admin only)
const updateSetting: RequestHandler = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Settings object required.' });
    }

    for (const [key, value] of Object.entries(settings)) {
      await pool.execute<ResultSetHeader>(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [key, String(value)]
      );
    }

    res.json({ success: true, message: 'Settings updated.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed.', error: error.message });
  }
};

export { getAllSettings, updateSetting };