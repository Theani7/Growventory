import express from 'express';
const router = express.Router();
import { register, login, getCurrentUser, seedRoles } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/seed-roles', seedRoles); // Run once to seed roles

// Protected routes
router.get('/me', authenticate, getCurrentUser);

export default router;