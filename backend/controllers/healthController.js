const { pool } = require('../config/db');
const { notifyAdminsAndSupervisors } = require('./notificationController');

const VALID_HEALTH_STATUS = ['healthy', 'under_observation', 'poor', 'critical'];

// Get all health logs with optional plant filter
const getAllHealthLogs = async (req, res) => {
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
      params.push(plant_id);
    }

    if (health_status) {
      query += ` AND hl.health_status = ?`;
      params.push(health_status);
    }

    query += ` ORDER BY hl.check_date DESC`;

    const [logs] = await pool.execute(query, params);

    res.json({
      success: true,
      message: 'Health logs fetched successfully.',
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health logs.',
      error: error.message
    });
  }
};

// Get single health log
const getHealthLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const [logs] = await pool.execute(
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health log.',
      error: error.message
    });
  }
};

// Create health log and update plant
const createHealthLog = async (req, res) => {
  try {
    const { plant_id, health_status, growth_stage, notes } = req.body;
    const user_id = req.user.user_id;

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

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Verify plant exists and lock the row for update
      const [plants] = await connection.execute(
        'SELECT plant_id, name, health_status, growth_stage, is_active FROM plants WHERE plant_id = ? FOR UPDATE',
        [plant_id]
      );

      if (plants.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Plant not found.'
        });
      }

      if (!plants[0].is_active) {
        return res.status(400).json({
          success: false,
          message: 'Cannot record health log for a deleted plant.'
        });
      }

      const plant = plants[0];
      const status = health_status.toLowerCase();

      // Insert health log
      const [logResult] = await connection.execute(
        `INSERT INTO plant_health_logs (plant_id, health_status, growth_stage, notes, checked_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [plant_id, status, growth_stage || null, notes || null, user_id]
      );

      // Update plant's health status
      await connection.execute(
        `UPDATE plants SET health_status = ?, growth_stage = ?, last_health_check = CURRENT_TIMESTAMP WHERE plant_id = ?`,
        [status, growth_stage || plant.growth_stage, plant_id]
      );

      // Log activity
      await connection.execute(
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

      const [newLog] = await pool.execute(
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record health log.',
      error: error.message
    });
  }
};

// Update health log (Admin/Supervisor only)
const updateHealthLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { health_status, growth_stage, notes } = req.body;

    const [existing] = await pool.execute(
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

    await pool.execute(
      'UPDATE plant_health_logs SET health_status = ?, growth_stage = ?, notes = ? WHERE log_id = ?',
      [newStatus, newGrowthStage, newNotes, id]
    );

    // Also update plant if status changed
    if (health_status) {
      await pool.execute(
        'UPDATE plants SET health_status = ?, growth_stage = ?, last_health_check = CURRENT_TIMESTAMP WHERE plant_id = ?',
        [newStatus, newGrowthStage, log.plant_id]
      );
    }

    const [updated] = await pool.execute(
      `SELECT hl.*, p.name as plant_name FROM plant_health_logs hl JOIN plants p ON hl.plant_id = p.plant_id WHERE hl.log_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Health log updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update health log.',
      error: error.message
    });
  }
};

module.exports = { getAllHealthLogs, getHealthLogById, createHealthLog, updateHealthLog };
