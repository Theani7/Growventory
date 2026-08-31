import { RequestHandler } from 'express';
import type { PoolConnection } from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';
import { notifyAdminsAndSupervisors } from './notificationController';

const VALID_HEALTH_STATUS = ['healthy', 'under_observation', 'poor', 'critical'];

// Get all health logs with optional plant filter
const getAllHealthLogs: RequestHandler = async (req, res) => {
  try {
    const { plant_id, health_status } = req.query;

    let query = `SELECT hl.*, p.name as plant_name, u.username as checked_by_name 
                 FROM plant_health_logs hl 
                 JOIN plants p ON hl.plant_id = p.plant_id 
                 LEFT JOIN users u ON hl.checked_by = u.user_id 
                 WHERE 1=1`;
    const params = [];

    if (plant_id) {
      query += ` AND hl.plant_id = ?`;
      params.push(String(plant_id));
    }

    if (health_status) {
      query += ` AND hl.health_status = ?`;
      params.push(String(health_status));
    }

    query += ` ORDER BY hl.check_date DESC`;

    const [logs] = await pool.execute<RowDataPacket[]>(query, params);

    res.json({
      success: true,
      message: 'Health logs fetched successfully.',
      data: logs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health logs.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single health log
const getHealthLogById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [logs] = await pool.execute<RowDataPacket[]>(
      `SELECT hl.*, p.name as plant_name, u.username as checked_by_name 
       FROM plant_health_logs hl 
       JOIN plants p ON hl.plant_id = p.plant_id 
       LEFT JOIN users u ON hl.checked_by = u.user_id 
       WHERE hl.log_id = ?`,
      [id]
    );

    if (logs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Health log not found.'
      });
    }

    res.json({
      success: true,
      message: 'Health log fetched successfully.',
      data: logs[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health log.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create health log and update plant
const createHealthLog: RequestHandler = async (req, res) => {
  try {
    const { plant_id, health_status, growth_stage, notes } = req.body;
    const user_id = req.user!.user_id;

    // Validation
    if (!plant_id || !health_status) {
      return res.status(400).json({
        success: false,
        message: 'Plant ID and health status are required.'
      });
    }

    if (!VALID_HEALTH_STATUS.includes(health_status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid health status. Valid values: ${VALID_HEALTH_STATUS.join(', ')}`
      });
    }

    const connection: PoolConnection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Verify plant exists and lock the row for update
      const [plants] = await connection.execute<RowDataPacket[]>(
        'SELECT plant_id, name, health_status, growth_stage, is_active FROM plants WHERE plant_id = ? FOR UPDATE',
        [plant_id]
      );

      if (plants.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Plant not found.'
        });
      }

      if (!plants[0].is_active) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cannot record health log for a deleted plant.'
        });
      }

      const plant = plants[0];
      const status = health_status.toLowerCase();

      // Insert health log
      const [logResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO plant_health_logs (plant_id, health_status, growth_stage, notes, checked_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [plant_id, status, growth_stage || null, notes || null, user_id]
      );

      // Update plant's health status
      await connection.execute<ResultSetHeader>(
        `UPDATE plants SET health_status = ?, growth_stage = ?, last_health_check = CURRENT_TIMESTAMP WHERE plant_id = ?`,
        [status, growth_stage || plant.growth_stage, plant_id]
      );

      // Log activity
      await connection.execute<ResultSetHeader>(
        `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, 'HEALTH_CHECK', 'plants', plant_id, 
         `Health check for ${plant.name}: ${plant.health_status} → ${status}`]
      );

      // Notify if health is poor or critical
      if (status === 'poor' || status === 'critical') {
        await notifyAdminsAndSupervisors(
          'Health Alert',
          `${plant.name} health status: ${status.toUpperCase()}`,
          'health_issue'
        );
      }

      await connection.commit();

      const [newLog] = await pool.execute<RowDataPacket[]>(
        `SELECT hl.*, p.name as plant_name FROM plant_health_logs hl JOIN plants p ON hl.plant_id = p.plant_id WHERE hl.log_id = ?`,
        [logResult.insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Health log recorded successfully.',
        data: newLog[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to record health log.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update health log (Admin/Supervisor only)
const updateHealthLog: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { health_status, growth_stage, notes } = req.body;

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM plant_health_logs WHERE log_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Health log not found.'
      });
    }

    const log = existing[0];

    if (health_status && !VALID_HEALTH_STATUS.includes(health_status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid health status. Valid values: ${VALID_HEALTH_STATUS.join(', ')}`
      });
    }

    const newStatus = health_status ? health_status.toLowerCase() : log.health_status;
    const newGrowthStage = growth_stage !== undefined ? growth_stage : log.growth_stage;
    const newNotes = notes !== undefined ? notes : log.notes;

    await pool.execute<ResultSetHeader>(
      'UPDATE plant_health_logs SET health_status = ?, growth_stage = ?, notes = ? WHERE log_id = ?',
      [newStatus, newGrowthStage, newNotes, id]
    );

    // Also update plant only if editing the latest log for this plant
    if (health_status) {
      const [latest] = await pool.execute<RowDataPacket[]>(
        'SELECT MAX(log_id) as maxId FROM plant_health_logs WHERE plant_id = ?',
        [log.plant_id]
      );
      const maxId = latest[0]?.maxId;
      if (maxId != null && String(maxId) === String(id)) {
        await pool.execute<ResultSetHeader>(
          'UPDATE plants SET health_status = ?, growth_stage = ?, last_health_check = CURRENT_TIMESTAMP WHERE plant_id = ?',
          [newStatus, newGrowthStage, log.plant_id]
        );
      }
    }

    const [updated] = await pool.execute<RowDataPacket[]>(
      `SELECT hl.*, p.name as plant_name FROM plant_health_logs hl JOIN plants p ON hl.plant_id = p.plant_id WHERE hl.log_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Health log updated successfully.',
      data: updated[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update health log.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { getAllHealthLogs, getHealthLogById, createHealthLog, updateHealthLog };