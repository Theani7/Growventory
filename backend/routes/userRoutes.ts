import express from 'express';
const router = express.Router();
import {
  getAllUsers,
  getPendingUsers,
  getAllRoles,
  createUser,
  updateUser,
  toggleUserActive,
  resetPassword,
  deleteUser,
  approveUser,
  rejectUser,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

router.use(authenticate);

// Roles list (any authenticated user)
router.get('/roles', getAllRoles);

// User management (admin only)
router.get('/', authorize('admin'), getAllUsers);
router.get('/pending', authorize('admin'), getPendingUsers);
router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateUser);
router.patch('/:id/approve', authorize('admin'), approveUser);
router.patch('/:id/reject', authorize('admin'), rejectUser);
router.patch('/:id/toggle-active', authorize('admin'), toggleUserActive);
router.patch('/:id/reset-password', authorize('admin'), resetPassword);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
