const { pool } = require('../config/db');
const { notifyAdminsAndSupervisors, createNotification } = require('./notificationController');

// Helper — read a system setting (returns string or default)
const getSetting = async (key, defaultValue = '') => {
  try {
    const [rows] = await pool.execute(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      [key]
    );
    return rows.length ? rows[0].setting_value : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Get all stock movements with optional filters (plant, type, status)
const getAllMovements = async (req, res) => {
  try {
    const { plant_id, movement_type, status } = req.query;

    let query = `SELECT sm.*, 
                        p.name as plant_name, 
                        u.username as created_by_name,
                        au.username as approved_by_name
                 FROM stock_movements sm 
                 JOIN plants p ON sm.plant_id = p.plant_id 
                 LEFT JOIN users u ON sm.created_by = u.user_id 
                 LEFT JOIN users au ON sm.approved_by = au.user_id
                 WHERE 1=1`;
    const params = [];

    if (plant_id) {
      query += ` AND sm.plant_id = ?`;
      params.push(plant_id);
    }
    if (movement_type) {
      query += ` AND sm.movement_type = ?`;
      params.push(movement_type);
    }
    if (status) {
      query += ` AND sm.approval_status = ?`;
      params.push(status);
    }

    query += ` ORDER BY sm.movement_date DESC`;

    const [movements] = await pool.execute(query, params);

    res.json({
      success: true,
      message: 'Stock movements fetched successfully.',
      data: movements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock movements.',
      error: error.message
    });
  }
};

// Get single stock movement
const getMovementById = async (req, res) => {
  try {
    const { id } = req.params;

    const [movements] = await pool.execute(
      `SELECT sm.*, 
              p.name as plant_name, 
              u.username as created_by_name,
              au.username as approved_by_name
       FROM stock_movements sm 
       JOIN plants p ON sm.plant_id = p.plant_id 
       LEFT JOIN users u ON sm.created_by = u.user_id 
       LEFT JOIN users au ON sm.approved_by = au.user_id
       WHERE sm.movement_id = ?`,
      [id]
    );

    if (movements.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stock movement not found.'
      });
    }

    res.json({
      success: true,
      message: 'Stock movement fetched successfully.',
      data: movements[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock movement.',
      error: error.message
    });
  }
};

// Create stock movement.
// If `require_stock_approval` is true AND user is staff, the movement is created in
// `pending` status and stock is NOT updated. A supervisor/admin must approve it.
// Otherwise the movement is auto-approved and applied immediately.
const createMovement = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { plant_id, movement_type, quantity, notes } = req.body;
    const user_id = req.user.user_id;
    const role = req.user.role_name;

    // Validation
    if (!plant_id || !movement_type || !quantity) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Plant ID, movement type, and quantity are required.'
      });
    }

    const validTypes = ['IN', 'OUT', 'ADJUSTMENT'];
    const type = movement_type.toUpperCase();
    if (!validTypes.includes(type)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid movement type. Use IN, OUT, or ADJUSTMENT.'
      });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0.'
      });
    }

    // Lock plant row
    const [plants] = await connection.execute(
      'SELECT plant_id, name, current_stock, min_stock_threshold FROM plants WHERE plant_id = ? FOR UPDATE',
      [plant_id]
    );

    if (plants.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Plant not found.'
      });
    }

    const plant = plants[0];
    const previous_stock = plant.current_stock;

    // Compute new stock for validation (used at approval time too)
    let new_stock;
    if (type === 'IN') {
      new_stock = previous_stock + qty;
    } else if (type === 'OUT') {
      if (previous_stock < qty) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Current: ${previous_stock}, Requested: ${qty}`
        });
      }
      new_stock = previous_stock - qty;
    } else {
      // ADJUSTMENT — quantity is the new absolute value
      new_stock = qty;
    }

    // Approval policy: staff requires approval if setting is on; supervisor/admin auto-approve
    const approvalRequired = await getSetting('require_stock_approval', 'false');
    const needsApproval = approvalRequired === 'true' && role === 'staff';
    const approval_status = needsApproval ? 'pending' : 'approved';

    // Insert movement
    const [movementResult] = await connection.execute(
      `INSERT INTO stock_movements 
        (plant_id, movement_type, quantity, previous_stock, new_stock, notes, created_by, approval_status, approved_by, approved_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plant_id, type, qty, previous_stock, new_stock,
        notes || null, user_id, approval_status,
        needsApproval ? null : user_id,
        needsApproval ? null : new Date()
      ]
    );

    // If auto-approved, apply stock change immediately
    if (!needsApproval) {
      await connection.execute(
        'UPDATE plants SET current_stock = ? WHERE plant_id = ?',
        [new_stock, plant_id]
      );

      await connection.execute(
        `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, 'STOCK_' + type, 'plants', plant_id,
          `Stock ${type.toLowerCase()}: ${plant.name} - ${type === 'ADJUSTMENT' ? `set to ${qty}` : qty} (${previous_stock} → ${new_stock})`]
      );

      // Low-stock alert
      if (new_stock <= plant.min_stock_threshold) {
        await notifyAdminsAndSupervisors(
          'Low Stock Alert',
          `${plant.name} is low on stock: ${new_stock} units remaining (threshold: ${plant.min_stock_threshold})`,
          'low_stock'
        );
      }
    } else {
      // Pending approval — log + notify approvers
      await connection.execute(
        `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, 'STOCK_PENDING', 'stock_movements', movementResult.insertId,
          `Pending ${type.toLowerCase()} of ${qty} for ${plant.name} — awaiting supervisor approval`]
      );

      await notifyAdminsAndSupervisors(
        'Stock Movement Awaiting Approval',
        `${req.user.username} requested a ${type.toLowerCase()} of ${qty} unit(s) for "${plant.name}". Review and approve.`,
        'approval'
      );
    }

    await connection.commit();

    const [newMovement] = await pool.execute(
      `SELECT sm.*, p.name as plant_name, u.username as created_by_name 
       FROM stock_movements sm 
       JOIN plants p ON sm.plant_id = p.plant_id 
       LEFT JOIN users u ON sm.created_by = u.user_id 
       WHERE sm.movement_id = ?`,
      [movementResult.insertId]
    );

    res.status(201).json({
      success: true,
      message: needsApproval
        ? 'Stock movement submitted for supervisor approval.'
        : 'Stock movement recorded successfully.',
      data: newMovement[0]
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to record stock movement.',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Approve a pending stock movement (Supervisor/Admin only)
// Re-validates against CURRENT stock at approval time and applies the change atomically.
const approveMovement = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const approver_id = req.user.user_id;

    const [movements] = await connection.execute(
      `SELECT sm.*, p.name as plant_name, p.min_stock_threshold 
       FROM stock_movements sm 
       JOIN plants p ON sm.plant_id = p.plant_id 
       WHERE sm.movement_id = ? FOR UPDATE`,
      [id]
    );

    if (movements.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Stock movement not found.' });
    }

    const movement = movements[0];

    if (movement.approval_status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot approve — movement is already ${movement.approval_status}.`
      });
    }

    // Re-fetch plant with lock to recompute against latest stock
    const [plants] = await connection.execute(
      'SELECT current_stock FROM plants WHERE plant_id = ? FOR UPDATE',
      [movement.plant_id]
    );
    const currentStock = plants[0].current_stock;
    const qty = movement.quantity;
    const type = movement.movement_type;

    let new_stock;
    if (type === 'IN') {
      new_stock = currentStock + qty;
    } else if (type === 'OUT') {
      if (currentStock < qty) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Cannot approve — insufficient stock. Current: ${currentStock}, Requested: ${qty}`
        });
      }
      new_stock = currentStock - qty;
    } else {
      new_stock = qty;
    }

    // Apply stock change
    await connection.execute(
      'UPDATE plants SET current_stock = ? WHERE plant_id = ?',
      [new_stock, movement.plant_id]
    );

    // Update movement record with final values
    await connection.execute(
      `UPDATE stock_movements 
       SET approval_status = 'approved', approved_by = ?, approved_at = NOW(), 
           previous_stock = ?, new_stock = ?
       WHERE movement_id = ?`,
      [approver_id, currentStock, new_stock, id]
    );

    // Activity log
    await connection.execute(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [approver_id, 'STOCK_APPROVED', 'stock_movements', id,
        `Approved ${type.toLowerCase()} of ${qty} for ${movement.plant_name} (${currentStock} → ${new_stock})`]
    );

    // Notify the requester
    if (movement.created_by && movement.created_by !== approver_id) {
      await createNotification(
        movement.created_by,
        'Stock Movement Approved',
        `Your ${type.toLowerCase()} of ${qty} for "${movement.plant_name}" was approved by ${req.user.username}.`,
        'approval'
      );
    }

    // Low-stock alert
    if (new_stock <= movement.min_stock_threshold) {
      await notifyAdminsAndSupervisors(
        'Low Stock Alert',
        `${movement.plant_name} is low on stock: ${new_stock} units remaining (threshold: ${movement.min_stock_threshold})`,
        'low_stock'
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Stock movement approved and applied.',
      data: { movement_id: parseInt(id), new_stock }
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to approve stock movement.',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Reject a pending stock movement (Supervisor/Admin only)
const rejectMovement = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { reason } = req.body || {};
    const approver_id = req.user.user_id;

    const [movements] = await connection.execute(
      `SELECT sm.*, p.name as plant_name 
       FROM stock_movements sm 
       JOIN plants p ON sm.plant_id = p.plant_id 
       WHERE sm.movement_id = ?`,
      [id]
    );

    if (movements.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Stock movement not found.' });
    }

    const movement = movements[0];

    if (movement.approval_status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot reject — movement is already ${movement.approval_status}.`
      });
    }

    // Append rejection reason into notes (preserving existing notes)
    const newNotes = reason
      ? `${movement.notes ? movement.notes + ' | ' : ''}Rejected: ${reason}`
      : movement.notes;

    await connection.execute(
      `UPDATE stock_movements 
       SET approval_status = 'rejected', approved_by = ?, approved_at = NOW(), notes = ?
       WHERE movement_id = ?`,
      [approver_id, newNotes, id]
    );

    await connection.execute(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [approver_id, 'STOCK_REJECTED', 'stock_movements', id,
        `Rejected ${movement.movement_type.toLowerCase()} of ${movement.quantity} for ${movement.plant_name}${reason ? ` — Reason: ${reason}` : ''}`]
    );

    if (movement.created_by && movement.created_by !== approver_id) {
      await createNotification(
        movement.created_by,
        'Stock Movement Rejected',
        `Your ${movement.movement_type.toLowerCase()} of ${movement.quantity} for "${movement.plant_name}" was rejected by ${req.user.username}.${reason ? ` Reason: ${reason}` : ''}`,
        'approval'
      );
    }

    await connection.commit();

    res.json({ success: true, message: 'Stock movement rejected.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to reject stock movement.',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Delete stock movement (Admin/Supervisor only).
// If approved, reverses the stock change. If pending/rejected, just removes the record.
const deleteMovement = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const user_id = req.user.user_id;

    const [movements] = await connection.execute(
      `SELECT sm.*, p.name as plant_name FROM stock_movements sm 
       JOIN plants p ON sm.plant_id = p.plant_id 
       WHERE sm.movement_id = ?`,
      [id]
    );

    if (movements.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Stock movement not found.' });
    }

    const movement = movements[0];

    // Only reverse stock if the movement was actually applied (approved)
    if (movement.approval_status === 'approved') {
      const [plants] = await connection.execute(
        'SELECT current_stock FROM plants WHERE plant_id = ? FOR UPDATE',
        [movement.plant_id]
      );
      const currentStock = plants[0].current_stock;
      let reversedStock;

      if (movement.movement_type === 'IN') {
        reversedStock = currentStock - movement.quantity;
        if (reversedStock < 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Cannot delete: would result in negative stock.'
          });
        }
      } else if (movement.movement_type === 'OUT') {
        reversedStock = currentStock + movement.quantity;
      } else {
        reversedStock = movement.previous_stock;
      }

      await connection.execute(
        'UPDATE plants SET current_stock = ? WHERE plant_id = ?',
        [reversedStock, movement.plant_id]
      );

      await connection.execute(
        `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, 'DELETE_MOVEMENT', 'stock_movements', id,
          `Deleted approved movement for ${movement.plant_name} (stock restored: ${currentStock} → ${reversedStock})`]
      );
    } else {
      await connection.execute(
        `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, 'DELETE_MOVEMENT', 'stock_movements', id,
          `Deleted ${movement.approval_status} movement for ${movement.plant_name}`]
      );
    }

    await connection.execute('DELETE FROM stock_movements WHERE movement_id = ?', [id]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Stock movement deleted.'
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to delete stock movement.',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllMovements,
  getMovementById,
  createMovement,
  approveMovement,
  rejectMovement,
  deleteMovement,
};
