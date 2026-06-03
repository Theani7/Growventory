const express = require('express');
const router = express.Router();
const { getAllHealthLogs, getHealthLogById, createHealthLog, updateHealthLog } = require('../controllers/healthController');
const { authenticate, authorize } = require('../middleware/auth');

// All health routes require authentication
router.use(authenticate);

// GET /api/health/logs - Get health logs (all authenticated)
router.get('/logs', getAllHealthLogs);

// GET /api/health/logs/:id - Get single health log (all authenticated)
router.get('/logs/:id', getHealthLogById);

// POST /api/health/logs - Create health log (Staff, Supervisor, Admin)
router.post('/logs', authorize('staff', 'admin'), createHealthLog);

// PUT /api/health/logs/:id - Update health log (Admin, Supervisor)
router.put('/logs/:id', authorize('admin', 'supervisor'), updateHealthLog);

module.exports = router;
