const express = require('express');
const router = express.Router();
const { getAllTasks, createTask, updateTaskStatus, updateTask, deleteTask } = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// View tasks (all authenticated - staff sees their own)
router.get('/', getAllTasks);

// Update status (assignee or manager)
router.patch('/:id/status', updateTaskStatus);

// Manage tasks (admin/supervisor)
router.post('/', authorize('admin', 'supervisor'), createTask);
router.put('/:id', authorize('admin', 'supervisor'), updateTask);
router.delete('/:id', authorize('admin', 'supervisor'), deleteTask);

module.exports = router;
