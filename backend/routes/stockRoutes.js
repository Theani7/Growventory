const express = require('express');
const router = express.Router();
const {
  getAllMovements,
  getMovementById,
  createMovement,
  approveMovement,
  rejectMovement,
  deleteMovement,
} = require('../controllers/stockController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// View movements (all authenticated users)
router.get('/movements', getAllMovements);
router.get('/movements/:id', getMovementById);

// Create movement (Staff, Supervisor, Admin) — staff submissions may go pending
router.post('/movements', authorize('staff', 'supervisor', 'admin'), createMovement);

// Approve / reject pending movements (Supervisor, Admin only)
router.patch('/movements/:id/approve', authorize('admin', 'supervisor'), approveMovement);
router.patch('/movements/:id/reject', authorize('admin', 'supervisor'), rejectMovement);

// Delete movement (Admin, Supervisor only)
router.delete('/movements/:id', authorize('admin', 'supervisor'), deleteMovement);

module.exports = router;
