import express from 'express';
const router = express.Router();
import { register, login, getCurrentUser, seedRoles, sendVerificationOTP, verifyEmail, forgotPassword, verifyResetOTP, resetPassword } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/send-verification-otp', sendVerificationOTP);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.get('/seed-roles', authenticate, authorize('admin'), seedRoles);

export default router;