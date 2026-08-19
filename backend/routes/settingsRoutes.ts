import express from 'express';
const router = express.Router();
import { getAllSettings, updateSetting } from '../controllers/settingsController';
import { authenticate, authorize } from '../middleware/auth';

router.use(authenticate);

// View settings (all authenticated)
router.get('/', getAllSettings);

// Update settings (admin only)
router.put('/', authorize('admin'), updateSetting);

export default router;