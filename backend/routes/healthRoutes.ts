import express from 'express';
const router = express.Router();
import { getAllHealthLogs, getHealthLogById, createHealthLog, updateHealthLog } from '../controllers/healthController';
import { authenticate, authorize } from '../middleware/auth';

// All health routes require authentication
router.use(authenticate);

// GET /api/health/logs - Get health logs (all authenticated)
router.get('/logs', getAllHealthLogs);

// GET /api/health/logs/:id - Get single health log (all authenticated)
router.get('/logs/:id', getHealthLogById);

// POST /api/health/logs - Create health log (Staff, Supervisor, Admin)
router.post('/logs', authorize('staff', 'supervisor', 'admin'), createHealthLog);

// PUT /api/health/logs/:id - Update health log (Admin, Supervisor)
router.put('/logs/:id', authorize('admin', 'supervisor'), updateHealthLog);

export default router;