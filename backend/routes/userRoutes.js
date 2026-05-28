const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

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

module.exports = router;
