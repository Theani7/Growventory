import express from 'express';
import rateLimit from 'express-rate-limit';
const router = express.Router();
import { register, login, getCurrentUser, seedRoles, sendVerificationOTP, verifyEmail, forgotPassword, verifyResetOTP, resetPassword } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/send-verification-otp', otpLimiter, sendVerificationOTP);
router.post('/verify-email', otpLimiter, verifyEmail);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/verify-reset-otp', otpLimiter, verifyResetOTP);
router.post('/reset-password', otpLimiter, resetPassword);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.get('/seed-roles', authenticate, authorize('admin'), seedRoles);

export default router;