const { pool } = require('../config/db');

class StockService {
  /**
   * Updates stock using a transaction and row-level locking.
   * Centralized method to ensure all stock changes are logged and atomic.
   * 
   * @param {number} plantId - ID of the plant
   * @param {number} quantity - Quantity to change
   * @param {string} type - 'IN' or 'OUT'
   * @param {number} userId - ID of the user performing the action
   * @param {string} reason - Reason for the stock movement
   * @param {object} connection - Optional existing DB connection for transaction chaining
   */
  async updateStock(plantId, quantity, type, userId, reason, connection = null, existingMovementId = null) {
    const conn = connection || await pool.getConnection();
    if (!connection) await conn.beginTransaction();

    try {
      // 1. Lock the plant row for update to prevent race conditions (Audit findings remediation)
      const [plants] = await conn.execute(
        'SELECT current_stock, is_active FROM plants WHERE plant_id = ? FOR UPDATE',
        [plantId]
      );

      if (plants.length === 0) throw new Error('Plant not found');
      if (!plants[0].is_active) throw new Error('Cannot update stock for a deleted plant');
      
      const oldStock = plants[0].current_stock;
      let movementId;
      
      let newStock;
      if (type === 'IN') {
        newStock = oldStock + quantity;
      } else if (type === 'OUT') {
        newStock = oldStock - quantity;
      } else if (type === 'ADJUSTMENT') {
        newStock = quantity; // quantity represents the new absolute value
      } else {
        throw new Error('Invalid movement type');
      }

      if (newStock < 0) throw new Error('Insufficient stock');

      // 2. Update plant current_stock
      await conn.execute(
        'UPDATE plants SET current_stock = ? WHERE plant_id = ?',
        [newStock, plantId]
      );

      // 3. Record movement in stock_movements (Audit Trail)
      if (existingMovementId) {
        await conn.execute(
          `UPDATE stock_movements 
           SET approval_status = 'approved', approved_by = ?, approved_at = NOW(), 
               previous_stock = ?, new_stock = ?, notes = ?
           WHERE movement_id = ?`,
          [userId, oldStock, newStock, reason, existingMovementId]
        );
      } else {
        const [insertResult] = await conn.execute(
          `INSERT INTO stock_movements 
           (plant_id, created_by, quantity, movement_type, notes, approval_status, approved_by, approved_at, previous_stock, new_stock) 
           VALUES (?, ?, ?, ?, ?, 'approved', ?, NOW(), ?, ?)`,
          [plantId, userId, quantity, type, reason, userId, oldStock, newStock]
        );
        movementId = insertResult.insertId;
      }

      if (!connection) await conn.commit();
      return { success: true, newStock, movementId: existingMovementId || movementId };
    } catch (error) {
      if (!connection) await conn.rollback();
      throw error;
    } finally {
      if (!connection) conn.release();
    }
  }

  /**
   * Initializes stock for a new plant (creates initial movement).
   * Used during plant creation or import.
   * 
   * @param {number} plantId - ID of the plant
   * @param {number} quantity - Initial quantity
   * @param {number} userId - ID of the user
   * @param {object} connection - Existing connection (required as this is typically part of plant creation txn)
   */
  async initializeStock(plantId, quantity, userId, connection) {
    if (!connection) throw new Error('Connection required for initializeStock');
    
    await connection.execute(
      `INSERT INTO stock_movements 
       (plant_id, created_by, quantity, movement_type, notes, approval_status, approved_by, approved_at, previous_stock, new_stock) 
       VALUES (?, ?, ?, 'IN', 'Initial stock setup', 'approved', ?, NOW(), 0, ?)`,
      [plantId, userId, quantity, userId, quantity]
    );
  }
}

module.exports = new StockService();
