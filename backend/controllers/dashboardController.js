const { pool } = require('../config/db');

// Get dashboard overview
const getOverview = async (req, res) => {
  try {
    // Total plants count
    const [plantCount] = await pool.execute('SELECT COUNT(*) as total FROM plants WHERE is_active = 1');

    // Total current stock
    const [stockTotal] = await pool.execute('SELECT SUM(current_stock) as total FROM plants WHERE is_active = 1');

    // Low stock plants count
    const [lowStockCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM plants WHERE is_active = 1 AND current_stock <= min_stock_threshold'
    );

    // Plants by health status
    const [healthStatus] = await pool.execute(
      `SELECT health_status, COUNT(*) as count 
       FROM plants 
       WHERE is_active = 1 
       GROUP BY health_status`
    );

    // Recent activity count (last 7 days)
    const [activityCount] = await pool.execute(
      `SELECT COUNT(*) as total FROM activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    const healthByStatus = {};
    healthStatus.forEach(item => {
      healthByStatus[item.health_status] = item.count;
    });

    res.json({
      success: true,
      message: 'Dashboard overview fetched successfully.',
      data: {
        total_plants: plantCount[0].total,
        total_stock: stockTotal[0].total || 0,
        low_stock_count: lowStockCount[0].total,
        plants_by_health: healthByStatus,
        recent_activity_count: activityCount[0].total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard overview.',
      error: error.message
    });
  }
};

// Get low stock plants
const getLowStock = async (req, res) => {
  try {
    const [plants] = await pool.execute(
      `SELECT p.plant_id, p.name, p.current_stock, p.min_stock_threshold, c.category_name 
       FROM plants p 
       LEFT JOIN categories c ON p.category_id = c.category_id 
       WHERE p.is_active = 1 AND p.current_stock <= p.min_stock_threshold 
       ORDER BY p.current_stock ASC`
    );

    res.json({
      success: true,
      message: 'Low stock plants fetched successfully.',
      data: plants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock plants.',
      error: error.message
    });
  }
};

// Get category-wise statistics
const getCategoryStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT c.category_id, c.category_name, 
              COUNT(p.plant_id) as plant_count, 
              COALESCE(SUM(p.current_stock), 0) as total_stock 
       FROM categories c 
       LEFT JOIN plants p ON c.category_id = p.category_id AND p.is_active = 1 
       GROUP BY c.category_id, c.category_name 
       ORDER BY c.category_name ASC`
    );

    res.json({
      success: true,
      message: 'Category statistics fetched successfully.',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category statistics.',
      error: error.message
    });
  }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const safeLimit = Math.min(Math.max(limit, 1), 100); // safe between 1 and 100

    const [activities] = await pool.execute(
      `SELECT al.log_id, al.user_id, u.username, al.action_type, al.table_name, 
              al.record_id, al.description, al.created_at 
       FROM activity_logs al 
       LEFT JOIN users u ON al.user_id = u.user_id 
       ORDER BY al.created_at DESC 
       LIMIT ${safeLimit}`
    );

    res.json({
      success: true,
      message: 'Recent activities fetched successfully.',
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities.',
      error: error.message
    });
  }
};

// Get health summary for charts
const getHealthSummary = async (req, res) => {
  try {
    const [summary] = await pool.execute(
      `SELECT health_status, COUNT(*) as count 
       FROM plants 
       WHERE is_active = 1 
       GROUP BY health_status 
       ORDER BY count DESC`
    );

    res.json({
      success: true,
      message: 'Health summary fetched successfully.',
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health summary.',
      error: error.message
    });
  }
};

// Get advanced analytics
const getAdvancedAnalytics = async (req, res) => {
  try {
    // Stock movement trends (last 30 days)
    const [stockTrends] = await pool.execute(
      `SELECT 
        DATE(movement_date) as date,
        SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END) as stock_in,
        SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END) as stock_out,
        COUNT(*) as total_movements
       FROM stock_movements 
       WHERE movement_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(movement_date)
       ORDER BY date`
    );

    // Category performance (stock value)
    const [categoryPerformance] = await pool.execute(
      `SELECT 
        c.category_name,
        COUNT(p.plant_id) as plant_count,
        SUM(p.current_stock) as total_stock,
        SUM(p.current_stock * COALESCE(p.purchase_price, 0)) as total_value
       FROM categories c
       LEFT JOIN plants p ON c.category_id = p.category_id AND p.is_active = 1
       GROUP BY c.category_id, c.category_name
       ORDER BY total_value DESC`
    );

    // Monthly health trends
    const [healthTrends] = await pool.execute(
      `SELECT 
        DATE_FORMAT(last_health_check, '%Y-%m') as month,
        health_status,
        COUNT(*) as count
       FROM plants 
       WHERE is_active = 1 
         AND last_health_check IS NOT NULL 
         AND last_health_check >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(last_health_check, '%Y-%m'), health_status
       ORDER BY month, health_status`
    );

    // User activity heatmap
    const [userActivity] = await pool.execute(
      `SELECT 
        u.username,
        u.role_id,
        r.role_name,
        COUNT(al.log_id) as activity_count,
        DATE(al.created_at) as activity_date
       FROM users u
       LEFT JOIN activity_logs al ON u.user_id = al.user_id
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY u.user_id, u.username, u.role_id, r.role_name, DATE(al.created_at)
       ORDER BY activity_count DESC`
    );

    res.json({
      success: true,
      message: 'Advanced analytics fetched successfully.',
      data: {
        stock_trends: stockTrends,
        category_performance: categoryPerformance,
        health_trends: healthTrends,
        user_activity: userActivity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advanced analytics.',
      error: error.message
    });
  }
};

module.exports = { getOverview, getLowStock, getCategoryStats, getRecentActivities, getHealthSummary, getAdvancedAnalytics };
