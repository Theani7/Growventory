import { RequestHandler } from 'express';
import type { PoolConnection } from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';
import { notifyAdminsAndSupervisors, createNotification } from './notificationController';
import stockService from '../services/stockService';

// Helper, read a system setting (returns string or default)
const getSetting = async (key: string, defaultValue = ''): Promise<string> => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      [key]
    );
    return rows.length ? rows[0].setting_value : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Get all stock movements with optional filters (plant, type, status)
const getAllMovements: RequestHandler = async (req, res) => {
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
    const params: any[] = [];

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

    const [movements] = await pool.execute<RowDataPacket[]>(query, params);

    res.json({
      success: true,
      message: 'Stock movements fetched successfully.',
      data: movements
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock movements.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single stock movement
const getMovementById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [movements] = await pool.execute<RowDataPacket[]>(
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock movement.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create stock movement.
// If `require_stock_approval` is true AND user is staff, the movement is created in
// `pending` status and stock is NOT updated. A supervisor/admin must approve it.
// Otherwise the movement is auto-approved and applied immediately.
const createMovement: RequestHandler = async (req, res) => {
  const connection: PoolConnection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { plant_id, movement_type, quantity, notes } = req.body;
    const user_id = req.user!.user_id;
    const role = req.user!.role_name;

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
    const [plants] = await connection.execute<RowDataPacket[]>(
      'SELECT plant_id, name, current_stock, min_stock_threshold, is_active FROM plants WHERE plant_id = ? FOR UPDATE',
      [plant_id]
    );

    if (plants.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Plant not found.'
      });
    }

    if (plants[0].is_active === 0 || plants[0].is_active === false) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot record stock movement for a deleted plant.'
      });
    }

    const plant = plants[0];
    const previous_stock = plant.current_stock;

    // Compute new stock for validation (used at approval time too)
    let new_stock: number;
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
      // ADJUSTMENT, quantity is the new absolute value
      new_stock = qty;
    }

    // Approval policy: staff requires approval if setting is on; supervisor/admin auto-approve
    const approvalRequired = await getSetting('require_stock_approval', 'false');
    const needsApproval = approvalRequired === 'true' && role === 'staff';

    let movementId: number | string | null;
    let final_new_stock: number;

    if (!needsApproval) {
      // Use StockService for atomic update and auto-approved movement record
      const result = await stockService.updateStock(
        plant_id,
        qty,
        type,
        user_id,
        notes || (type === 'ADJUSTMENT' ? 'Manual adjustment' : `Stock ${type.toLowerCase()}`),
        connection
      );

      movementId = result.movementId;
      final_new_stock = result.newStock;

      await connection.execute<ResultSetHeader>(
        `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, 'STOCK_' + type, 'plants', plant_id,
          `Stock ${type.toLowerCase()}: ${plant.name} - ${type === 'ADJUSTMENT' ? `set to ${qty}` : qty} (${previous_stock} → ${final_new_stock})`]
      );

      // Notify admins/supervisors of new stock movement (if created by staff - though here needsApproval is false)
      // If a supervisor/admin does it, we might still want to notify others?
      if (role === 'staff') {
        await notifyAdminsAndSupervisors(
          'Stock Movement Recorded',
          `${req.user!.username} recorded a ${type.toLowerCase()} of ${qty} unit(s) for "${plant.name}" (${previous_stock} → ${final_new_stock}).`,
          'system'
        );
      }

      // Low-stock alert
      if (final_new_stock <= plant.min_stock_threshold) {
        await notifyAdminsAndSupervisors(
          'Low Stock Alert',
          `${plant.name} is low on stock: ${final_new_stock} units remaining (threshold: ${plant.min_stock_threshold})`,
          'low_stock'
        );
      }
    } else {
      // Pending approval, insert movement record manually as 'pending'
      const [movementResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO stock_movements 
          (plant_id, movement_type, quantity, previous_stock, new_stock, notes, created_by, approval_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [plant_id, type, qty, previous_stock, new_stock, notes || null, user_id]
      );

      movementId = movementResult.insertId;

      await connection.execute<ResultSetHeader>(
        `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, 'STOCK_PENDING', 'stock_movements', movementId,
          `Pending ${type.toLowerCase()} of ${qty} for ${plant.name}, awaiting supervisor approval`]
      );

      await notifyAdminsAndSupervisors(
        'Stock Movement Awaiting Approval',
        `${req.user!.username} requested a ${type.toLowerCase()} of ${qty} unit(s) for "${plant.name}". Review and approve.`,
        'approval'
      );
    }

    await connection.commit();

    const [newMovement] = await pool.execute<RowDataPacket[]>(
      `SELECT sm.*, p.name as plant_name, u.username as created_by_name 
       FROM stock_movements sm 
       JOIN plants p ON sm.plant_id = p.plant_id 
       LEFT JOIN users u ON sm.created_by = u.user_id 
       WHERE sm.movement_id = ?`,
      [movementId]
    );

    res.status(201).json({
      success: true,
      message: needsApproval
        ? 'Stock movement submitted for supervisor approval.'
        : 'Stock movement recorded successfully.',
      data: newMovement[0]
    });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to record stock movement.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

// Approve a pending stock movement (Supervisor/Admin only)
// Re-validates against CURRENT stock at approval time and applies the change atomically.
const approveMovement: RequestHandler = async (req, res) => {
  const connection: PoolConnection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const approver_id = req.user!.user_id;

    const [movements] = await connection.execute<RowDataPacket[]>(
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
        message: `Cannot approve, movement is already ${movement.approval_status}.`
      });
    }

    // Use StockService for atomic update and audit trail
    const result = await stockService.updateStock(
      movement.plant_id,
      movement.quantity,
      movement.movement_type,
      approver_id,
      movement.notes,
      connection,
      id
    );

    const new_stock = result.newStock;

    // Activity log
    await connection.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [approver_id, 'STOCK_APPROVED', 'stock_movements', id,
        `Approved ${movement.movement_type.toLowerCase()} of ${movement.quantity} for ${movement.plant_name} (final stock: ${new_stock})`]
    );

    // Notify the requester
    if (movement.created_by && movement.created_by !== approver_id) {
      await createNotification(
        movement.created_by,
        'Stock Movement Approved',
        `Your ${movement.movement_type.toLowerCase()} of ${movement.quantity} for "${movement.plant_name}" was approved by ${req.user!.username}.`,
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
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to approve stock movement.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

// Reject a pending stock movement (Supervisor/Admin only)
const rejectMovement: RequestHandler = async (req, res) => {
  const connection: PoolConnection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { reason } = req.body || {};
    const approver_id = req.user!.user_id;

    const [movements] = await connection.execute<RowDataPacket[]>(
      `SELECT sm.*, p.name as plant_name 
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
        message: `Cannot reject, movement is already ${movement.approval_status}.`
      });
    }

    // Append rejection reason into notes (preserving existing notes)
    const newNotes = reason
      ? `${movement.notes ? movement.notes + ' | ' : ''}Rejected: ${reason}`
      : movement.notes;

    await connection.execute<ResultSetHeader>(
      `UPDATE stock_movements 
       SET approval_status = 'rejected', approved_by = ?, approved_at = NOW(), notes = ?
       WHERE movement_id = ? AND approval_status = 'pending'`,
      [approver_id, newNotes, id]
    );

    await connection.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [approver_id, 'STOCK_REJECTED', 'stock_movements', id,
        `Rejected ${movement.movement_type.toLowerCase()} of ${movement.quantity} for ${movement.plant_name}${reason ? `, Reason: ${reason}` : ''}`]
    );

    if (movement.created_by && movement.created_by !== approver_id) {
      await createNotification(
        movement.created_by,
        'Stock Movement Rejected',
        `Your ${movement.movement_type.toLowerCase()} of ${movement.quantity} for "${movement.plant_name}" was rejected by ${req.user!.username}.${reason ? ` Reason: ${reason}` : ''}`,
        'approval'
      );
    }

    await connection.commit();

    res.json({ success: true, message: 'Stock movement rejected.' });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to reject stock movement.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

// Delete stock movement (Admin/Supervisor only).
// If approved, reverses the stock change. If pending/rejected, just removes the record.
const deleteMovement: RequestHandler = async (req, res) => {
  const connection: PoolConnection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const user_id = req.user!.user_id;

    const [movements] = await connection.execute<RowDataPacket[]>(
      `SELECT sm.*, p.name as plant_name FROM stock_movements sm 
       JOIN plants p ON sm.plant_id = p.plant_id 
       WHERE sm.movement_id = ? FOR UPDATE`,
      [id]
    );

    if (movements.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Stock movement not found.' });
    }

    const movement = movements[0];

    // Only reverse stock if the movement was actually applied (approved)
    if (movement.approval_status === 'approved') {
      const [plants] = await connection.execute<RowDataPacket[]>(
        'SELECT current_stock FROM plants WHERE plant_id = ? FOR UPDATE',
        [movement.plant_id]
      );

      // Reversal math is only correct for the latest approved movement;
      // deleting an older one would corrupt current_stock.
      const [later] = await connection.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM stock_movements 
         WHERE plant_id = ? AND approval_status = 'approved' AND movement_id > ?`,
        [movement.plant_id, id]
      );
      if (later[0].cnt > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cannot delete: newer approved movements exist for this plant. Delete the latest movement first.'
        });
      }
      const currentStock = plants[0].current_stock;
      let reversedStock: number;

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

      await connection.execute<ResultSetHeader>(
        'UPDATE plants SET current_stock = ? WHERE plant_id = ?',
        [reversedStock, movement.plant_id]
      );

      await connection.execute<ResultSetHeader>(
        `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, 'DELETE_MOVEMENT', 'stock_movements', id,
          `Deleted approved movement for ${movement.plant_name} (stock restored: ${currentStock} → ${reversedStock})`]
      );
    } else {
      await connection.execute<ResultSetHeader>(
        `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, 'DELETE_MOVEMENT', 'stock_movements', id,
          `Deleted ${movement.approval_status} movement for ${movement.plant_name}`]
      );
    }

    await connection.execute<ResultSetHeader>('DELETE FROM stock_movements WHERE movement_id = ?', [id]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Stock movement deleted.'
    });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to delete stock movement.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

export {
  getAllMovements,
  getMovementById,
  createMovement,
  approveMovement,
  rejectMovement,
  deleteMovement,
};