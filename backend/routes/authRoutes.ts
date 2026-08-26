import express from 'express';
const router = express.Router();
import { register, login, getCurrentUser, seedRoles } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.get('/seed-roles', authenticate, authorize('admin'), seedRoles);

export default router;