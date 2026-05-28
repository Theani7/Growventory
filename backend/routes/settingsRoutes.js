const express = require('express');
const router = express.Router();
const { getAllSettings, updateSetting } = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// View settings (all authenticated)
router.get('/', getAllSettings);

// Update settings (admin only)
router.put('/', authorize('admin'), updateSetting);

module.exports = router;
