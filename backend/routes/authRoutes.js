const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, seedRoles } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/seed-roles', seedRoles); // Run once to seed roles

// Protected routes
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
