import { RequestHandler } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';

// Get all notifications for current user
const getNotifications: RequestHandler = async (req, res) => {
  try {
    const user_id = req.user!.user_id;

    const [notifications] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );

    const [unreadCount] = await pool.execute<RowDataPacket[]>(
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications.',
      error: error.message
    });
  }
};

// Get only unread notifications
const getUnreadNotifications: RequestHandler = async (req, res) => {
  try {
    const user_id = req.user!.user_id;

    const [notifications] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC`,
      [user_id]
    );

    res.json({
      success: true,
      message: 'Unread notifications fetched successfully.',
      data: notifications
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread notifications.',
      error: error.message
    });
  }
};

// Mark single notification as read
const markAsRead: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user!.user_id;

    const [result] = await pool.execute<ResultSetHeader>(
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read.',
      error: error.message
    });
  }
};

// Mark all notifications as read
const markAllAsRead: RequestHandler = async (req, res) => {
  try {
    const user_id = req.user!.user_id;

    await pool.execute<ResultSetHeader>(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [user_id]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read.',
      error: error.message
    });
  }
};

// Helper: Create notification (for internal use)
const createNotification = async (user_id: number, title: string, message: string, type: string) => {
  try {
    await pool.execute<ResultSetHeader>(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [user_id, title, message, type]
    );
  } catch (error: any) {
    console.error('Failed to create notification:', error.message);
  }
};

// Helper: Notify all admins and supervisors
const notifyAdminsAndSupervisors = async (title: string, message: string, type: string) => {
  try {
    const [users] = await pool.execute<RowDataPacket[]>(
      `SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id 
       WHERE r.role_name IN ('admin', 'supervisor') AND u.is_active = 1`
    );

    for (const user of users) {
      await createNotification(user.user_id, title, message, type);
    }
  } catch (error: any) {
    console.error('Failed to notify admins:', error.message);
  }
};

export {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  notifyAdminsAndSupervisors
};