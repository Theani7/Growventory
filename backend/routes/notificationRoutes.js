const express = require('express');
const router = express.Router();
const { getNotifications, getUnreadNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications - Get all notifications for current user
router.get('/', getNotifications);

// GET /api/notifications/unread - Get unread notifications
router.get('/unread', getUnreadNotifications);

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', markAsRead);

// PUT /api/notifications/mark-all-read - Mark all as read
router.put('/mark-all-read', markAllAsRead);

module.exports = router;
