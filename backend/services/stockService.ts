import type { PoolConnection } from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';

interface StockUpdateResult {
  success: true;
  newStock: number;
  movementId: number | string | null;
}

class StockService {
  /**
   * Updates stock using a transaction and row-level locking.
   * Centralized method to ensure all stock changes are logged and atomic.
   */
  async updateStock(
    plantId: number | string,
    quantity: number,
    type: string,
    userId: number,
    reason: string,
    connection: PoolConnection | null = null,
    existingMovementId: number | string | null = null
  ): Promise<StockUpdateResult> {
    const conn = connection || await pool.getConnection();
    if (!connection) await conn.beginTransaction();

    try {
      // 1. Lock the plant row for update to prevent race conditions (Audit findings remediation)
      const [plants] = await conn.execute<RowDataPacket[]>(
        'SELECT current_stock, is_active FROM plants WHERE plant_id = ? FOR UPDATE',
        [plantId]
      );

      if (plants.length === 0) throw new Error('Plant not found');
      if (!plants[0].is_active) throw new Error('Cannot update stock for a deleted plant');

      const oldStock = plants[0].current_stock as number;
      let movementId: number | string | null = existingMovementId;

      let newStock: number;
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
      await conn.execute<ResultSetHeader>(
        'UPDATE plants SET current_stock = ? WHERE plant_id = ?',
        [newStock, plantId]
      );

      // 3. Record movement in stock_movements (Audit Trail)
      if (existingMovementId) {
        await conn.execute<ResultSetHeader>(
          `UPDATE stock_movements 
           SET approval_status = 'approved', approved_by = ?, approved_at = NOW(), 
               previous_stock = ?, new_stock = ?, notes = ?
           WHERE movement_id = ?`,
          [userId, oldStock, newStock, reason, existingMovementId]
        );
      } else {
        const [insertResult] = await conn.execute<ResultSetHeader>(
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
   */
  async initializeStock(plantId: number, quantity: number, userId: number, connection: PoolConnection) {
    if (!connection) throw new Error('Connection required for initializeStock');

    await connection.execute<ResultSetHeader>(
      `INSERT INTO stock_movements 
       (plant_id, created_by, quantity, movement_type, notes, approval_status, approved_by, approved_at, previous_stock, new_stock) 
       VALUES (?, ?, ?, 'IN', 'Initial stock setup', 'approved', ?, NOW(), 0, ?)`,
      [plantId, userId, quantity, userId, quantity]
    );
  }
}

export default new StockService();