const { pool } = require('../config/db');

// Get all notifications for current user
const getNotifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const [notifications] = await pool.execute(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );

    const [unreadCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [user_id]
    );

    res.json({
      success: true,
      message: 'Notifications fetched successfully.',
      data: {
        notifications,
        unread_count: unreadCount[0].count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications.',
      error: error.message
    });
  }
};

// Get only unread notifications
const getUnreadNotifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const [notifications] = await pool.execute(
      `SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC`,
      [user_id]
    );

    res.json({
      success: true,
      message: 'Unread notifications fetched successfully.',
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread notifications.',
      error: error.message
    });
  }
};

// Mark single notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
      [id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read.',
      error: error.message
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [user_id]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read.',
      error: error.message
    });
  }
};

// Helper: Create notification (for internal use)
const createNotification = async (user_id, title, message, type) => {
  try {
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [user_id, title, message, type]
    );
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

// Helper: Notify all admins and supervisors
const notifyAdminsAndSupervisors = async (title, message, type) => {
  try {
    const [users] = await pool.execute(
      `SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id 
       WHERE r.role_name IN ('admin', 'supervisor') AND u.is_active = 1`
    );

    for (const user of users) {
      await createNotification(user.user_id, title, message, type);
    }
  } catch (error) {
    console.error('Failed to notify admins:', error.message);
  }
};

module.exports = {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  notifyAdminsAndSupervisors
};
