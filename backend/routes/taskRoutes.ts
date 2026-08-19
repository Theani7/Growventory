import express from 'express';
const router = express.Router();
import { getAllTasks, createTask, updateTaskStatus, updateTask, deleteTask } from '../controllers/taskController';
import { authenticate, authorize } from '../middleware/auth';

router.use(authenticate);

// View tasks (all authenticated - staff sees their own)
router.get('/', getAllTasks);

// Update status (assignee or manager)
router.patch('/:id/status', updateTaskStatus);

// Manage tasks (admin/supervisor)
router.post('/', authorize('admin', 'supervisor'), createTask);
router.put('/:id', authorize('admin', 'supervisor'), updateTask);
router.delete('/:id', authorize('admin', 'supervisor'), deleteTask);

export default router;