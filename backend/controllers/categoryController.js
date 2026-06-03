const { pool } = require('../config/db');

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM plants WHERE category_id = c.category_id AND is_active = 1) as plant_count,
        (SELECT COALESCE(SUM(current_stock), 0) FROM plants WHERE category_id = c.category_id AND is_active = 1) as total_stock
       FROM categories c 
       ORDER BY c.category_name ASC`
    );

    res.json({
      success: true,
      message: 'Categories fetched successfully.',
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories.',
      error: error.message
    });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;

    if (!category_name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO categories (category_name, description) VALUES (?, ?)',
      [category_name, description || null]
    );

    const [newCategory] = await pool.execute(
      'SELECT * FROM categories WHERE category_id = ?',
      [result.insertId]
    );

    // Log activity
    await pool.execute(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user.user_id, 'CREATE', 'categories', result.insertId, `Added new category: ${category_name}`]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: newCategory[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Category name already exists.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create category.',
      error: error.message
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, description } = req.body;

    const [existing] = await pool.execute(
      'SELECT * FROM categories WHERE category_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    await pool.execute(
      'UPDATE categories SET category_name = ?, description = ? WHERE category_id = ?',
      [category_name || existing[0].category_name, description ?? existing[0].description, id]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM categories WHERE category_id = ?',
      [id]
    );

    // Log activity
    await pool.execute(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user.user_id, 'UPDATE', 'categories', id, `Updated category: ${updated[0].category_name}`]
    );

    res.json({
      success: true,
      message: 'Category updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Category name already exists.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update category.',
      error: error.message
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM categories WHERE category_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    // Check if category has active plants
    const [plants] = await pool.execute(
      'SELECT COUNT(*) as count FROM plants WHERE category_id = ? AND is_active = 1',
      [id]
    );

    if (plants[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${plants[0].count} plant(s) assigned to this category.`
      });
    }

    const categoryName = existing[0].category_name;

    await pool.execute('DELETE FROM categories WHERE category_id = ?', [id]);

    // Log activity
    await pool.execute(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user.user_id, 'DELETE', 'categories', id, `Deleted category: ${categoryName}`]
    );

    res.json({
      success: true,
      message: 'Category deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete category.',
      error: error.message
    });
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
