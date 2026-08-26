import express from 'express';
const router = express.Router();
import {
  getAllMovements,
  getMovementById,
  createMovement,
  approveMovement,
  rejectMovement,
  deleteMovement,
} from '../controllers/stockController';
import { authenticate, authorize } from '../middleware/auth';

router.use(authenticate);

// View movements (all authenticated users)
router.get('/movements', getAllMovements);
router.get('/movements/:id', getMovementById);

// Create movement (Staff, Supervisor, Admin) — staff submissions may go pending
router.post('/movements', authorize('staff', 'admin', 'supervisor'), createMovement);

// Approve / reject pending movements (Supervisor, Admin only)
router.patch('/movements/:id/approve', authorize('admin', 'supervisor'), approveMovement);
router.patch('/movements/:id/reject', authorize('admin', 'supervisor'), rejectMovement);

// Delete movement (Admin, Supervisor only)
router.delete('/movements/:id', authorize('admin', 'supervisor'), deleteMovement);

export default router;