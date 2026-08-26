import { RequestHandler } from 'express';
import type { PoolConnection } from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';
import { notifyAdminsAndSupervisors } from './notificationController';
import stockService from '../services/stockService';

// Get all plants with search and filtering
const getAllPlants: RequestHandler = async (req, res) => {
  try {
    const { search, category_id, health_status, min_stock, include_inactive } = req.query;

    let query = `SELECT p.*, c.category_name 
                 FROM plants p 
                 LEFT JOIN categories c ON p.category_id = c.category_id 
                 WHERE 1=1`;
    const params: any[] = [];

    if (include_inactive !== 'true') {
      query += ` AND p.is_active = 1`;
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.scientific_name LIKE ? OR p.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    if (health_status) {
      query += ` AND p.health_status = ?`;
      params.push(health_status);
    }

    if (min_stock) {
      query += ` AND p.current_stock >= ?`;
      params.push(min_stock);
    }

    query += ` ORDER BY p.created_at DESC`;

    const [plants] = await pool.execute<RowDataPacket[]>(query, params);

    res.json({
      success: true,
      message: 'Plants fetched successfully.',
      data: plants
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plants.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single plant by ID
const getPlantById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [plants] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, c.category_name 
       FROM plants p 
       LEFT JOIN categories c ON p.category_id = c.category_id 
       WHERE p.plant_id = ?`,
      [id]
    );

    if (plants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found.'
      });
    }

    res.json({
      success: true,
      message: 'Plant fetched successfully.',
      data: plants[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plant.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new plant
const createPlant: RequestHandler = async (req, res) => {
  try {
    const { name, scientific_name, category_id, description, current_stock, min_stock_threshold, health_status, growth_stage, location, purchase_price, selling_price } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Plant name is required.'
      });
    }

    const connection: PoolConnection = await pool.getConnection();
    try {
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;
      const initialStock = parseInt(current_stock) || 0;

      await connection.beginTransaction();

      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO plants (name, scientific_name, category_id, description, image_url, current_stock, min_stock_threshold, health_status, growth_stage, location, purchase_price, selling_price) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, scientific_name || null, category_id || null, description || null, image_url, initialStock, min_stock_threshold || 0, health_status || 'healthy', growth_stage || null, location || null, purchase_price || null, selling_price || null]
      );

      const plantId = result.insertId;

      // Initialize stock movement audit trail if stock > 0
      if (initialStock > 0) {
        await stockService.initializeStock(plantId, initialStock, req.user!.user_id, connection);
      }

      const [newPlant] = await connection.execute<RowDataPacket[]>(
        `SELECT p.*, c.category_name FROM plants p LEFT JOIN categories c ON p.category_id = c.category_id WHERE p.plant_id = ?`,
        [plantId]
      );

      // Log activity
      await connection.execute<ResultSetHeader>(
        `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
        [req.user!.user_id, 'CREATE', 'plants', plantId, `Added new plant: ${name}`]
      );

      await connection.commit();

      // Create low stock notification if applicable (outside transaction is fine)
      const threshold = parseInt(min_stock_threshold) || 0;
      if (threshold > 0 && initialStock <= threshold) {
        await notifyAdminsAndSupervisors(
          'Low Stock Alert',
          `${name} added with stock below threshold (${initialStock}/${threshold})`,
          'low_stock'
        );
      }

      res.status(201).json({
        success: true,
        message: 'Plant created successfully.',
        data: newPlant[0]
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
      message: 'Failed to create plant.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update plant
const updatePlant: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, scientific_name, category_id, description, current_stock, min_stock_threshold, health_status, growth_stage, location, purchase_price, selling_price, is_active } = req.body;

    const [existing] = await pool.execute<RowDataPacket[]>('SELECT * FROM plants WHERE plant_id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found.'
      });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : existing[0].image_url;

    if (current_stock !== undefined) {
      return res.status(400).json({
        success: false,
        message: 'Direct update of current_stock is not allowed. Please use the Stock Management module.'
      });
    }

    await pool.execute<ResultSetHeader>(
      `UPDATE plants SET name = ?, scientific_name = ?, category_id = ?, description = ?, image_url = ?, min_stock_threshold = ?, health_status = ?, growth_stage = ?, location = ?, purchase_price = ?, selling_price = ?, is_active = ? WHERE plant_id = ?`,
      [name || existing[0].name, scientific_name === '' ? null : scientific_name ?? existing[0].scientific_name, category_id ?? existing[0].category_id, description === '' ? null : description ?? existing[0].description, image_url, min_stock_threshold ?? existing[0].min_stock_threshold, health_status || existing[0].health_status, growth_stage === '' ? null : growth_stage ?? existing[0].growth_stage, location === '' ? null : location ?? existing[0].location, purchase_price ?? existing[0].purchase_price, selling_price ?? existing[0].selling_price, is_active !== undefined ? is_active : existing[0].is_active, id]
    );

    const [updated] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, c.category_name FROM plants p LEFT JOIN categories c ON p.category_id = c.category_id WHERE p.plant_id = ?`,
      [id]
    );

    // Log activity
    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user!.user_id, 'UPDATE', 'plants', id, `Updated plant: ${updated[0].name}`]
    );

    res.json({
      success: true,
      message: 'Plant updated successfully.',
      data: updated[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update plant.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete plant
const deletePlant: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute<RowDataPacket[]>('SELECT * FROM plants WHERE plant_id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found.'
      });
    }

    const plantName = existing[0].name;

    // Perform soft delete to preserve audit trail (stock movements, health logs)
    await pool.execute<ResultSetHeader>('UPDATE plants SET is_active = 0 WHERE plant_id = ?', [id]);

    // Log activity
    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user!.user_id, 'DELETE', 'plants', id, `Deleted plant (soft-delete): ${plantName}`]
    );

    res.json({
      success: true,
      message: 'Plant deleted successfully.'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete plant.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Import plants from CSV
const importPlants: RequestHandler = async (req, res) => {
  const connection: PoolConnection = await pool.getConnection();
  try {
    if (!req.file) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.'
      });
    }

    // Validate file type
    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Only CSV files are allowed.'
      });
    }

    const csvContent = req.file.buffer.toString('utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty or has no data rows.'
      });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'category_id', 'current_stock', 'min_stock_threshold'];

    // CSV parsing helper function
    const parseCSVRow = (row: string): string[] => {
      const result = [];
      let inQuotes = false;
      let currentValue = '';

      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        const nextChar = row[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentValue += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }

      result.push(currentValue.trim());
      return result;
    };

    // Validate headers
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Missing required column: ${required}`
        });
      }
    }

    let importedCount = 0;
    const errors = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const values = parseCSVRow(row);

      if (values.length !== headers.length) {
        errors.push(`Row ${i}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        continue;
      }

      const plantData: Record<string, any> = {};
      headers.forEach((header, index) => {
        plantData[header] = values[index] || null;
      });

      // Validate required fields
      if (!plantData.name || !plantData.category_id || plantData.current_stock === null || plantData.current_stock === '' || !plantData.min_stock_threshold) {
        errors.push(`Row ${i}: Missing required fields`);
        continue;
      }

      // Validate numeric fields
      const currentStock = parseInt(plantData.current_stock);
      const minStockThreshold = parseInt(plantData.min_stock_threshold);

      if (isNaN(currentStock) || currentStock < 0) {
        errors.push(`Row ${i}: Invalid current stock value: ${plantData.current_stock}`);
        continue;
      }

      if (isNaN(minStockThreshold) || minStockThreshold < 0) {
        errors.push(`Row ${i}: Invalid minimum stock threshold: ${plantData.min_stock_threshold}`);
        continue;
      }

      try {
        await connection.beginTransaction();

        // Check if category exists
        const [category] = await connection.execute<RowDataPacket[]>('SELECT category_id FROM categories WHERE category_id = ?', [plantData.category_id]);
        if (category.length === 0) {
          errors.push(`Row ${i}: Category ID ${plantData.category_id} not found`);
          await connection.rollback();
          continue;
        }

        // Validate health status if provided
        const validHealthStatuses = ['healthy', 'under_observation', 'poor', 'critical'];
        const healthStatus = plantData.health_status || 'healthy';
        if (!validHealthStatuses.includes(healthStatus.toLowerCase())) {
          errors.push(`Row ${i}: Invalid health status: ${plantData.health_status}. Must be one of: ${validHealthStatuses.join(', ')}`);
          await connection.rollback();
          continue;
        }

        // Insert plant
        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO plants (name, scientific_name, category_id, current_stock, min_stock_threshold, 
            health_status, growth_stage, location, purchase_price, selling_price, description, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            plantData.name,
            plantData.scientific_name || null,
            plantData.category_id,
            currentStock,
            minStockThreshold,
            healthStatus,
            plantData.growth_stage || null,
            plantData.location || null,
            plantData.purchase_price ? parseFloat(plantData.purchase_price) : null,
            plantData.selling_price ? parseFloat(plantData.selling_price) : null,
            plantData.description || null,
            1 // is_active
          ]
        );

        const plantId = result.insertId;

        // Initialize stock movement audit trail if stock > 0
        if (currentStock > 0) {
          await stockService.initializeStock(plantId, currentStock, req.user!.user_id, connection);
        }

        // Log activity
        await connection.execute<ResultSetHeader>(
          `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
          [req.user!.user_id, 'CREATE', 'plants', plantId, `Imported plant: ${plantData.name}`]
        );

        await connection.commit();
        importedCount++;

      } catch (error: any) {
        await connection.rollback();
        errors.push(`Row ${i}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Imported ${importedCount} plants successfully.`,
      data: { imported: importedCount, errors: errors.length > 0 ? errors : undefined }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to import plants.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

export { getAllPlants, getPlantById, createPlant, updatePlant, deletePlant, importPlants };