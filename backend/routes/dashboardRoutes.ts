import express from 'express';
const router = express.Router();
import { getOverview, getLowStock, getCategoryStats, getRecentActivities, getHealthSummary, getAdvancedAnalytics } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

// All dashboard routes require authentication
router.use(authenticate);

// GET /api/dashboard/overview - Dashboard overview stats
router.get('/overview', getOverview);

// GET /api/dashboard/low-stock - List of low stock plants
router.get('/low-stock', getLowStock);

// GET /api/dashboard/category-stats - Category-wise statistics
router.get('/category-stats', getCategoryStats);

// GET /api/dashboard/recent-activities - Recent activity logs
router.get('/recent-activities', getRecentActivities);

// GET /api/dashboard/health-summary - Health status distribution
router.get('/health-summary', getHealthSummary);

// GET /api/dashboard/advanced-analytics - Advanced analytics and trends
router.get('/advanced-analytics', getAdvancedAnalytics);

export default router;