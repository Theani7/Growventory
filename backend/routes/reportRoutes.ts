import express from 'express';
const router = express.Router();
import { exportInventoryCSV, exportStockMovementsCSV, exportHealthLogsCSV, getSummaryReport, generateInventoryPDF, generateStockMovementsPDF } from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';

router.use(authenticate);

// Reports - Admin, Supervisor, Auditor (read-only)
router.get('/inventory-csv', authorize('admin', 'supervisor', 'auditor'), exportInventoryCSV);
router.get('/stock-movements-csv', authorize('admin', 'supervisor', 'auditor'), exportStockMovementsCSV);
router.get('/health-logs-csv', authorize('admin', 'supervisor', 'auditor'), exportHealthLogsCSV);
router.get('/summary', authorize('admin', 'supervisor', 'auditor'), getSummaryReport);
router.get('/inventory-pdf', authorize('admin', 'supervisor', 'auditor'), generateInventoryPDF);
router.get('/stock-movements-pdf', authorize('admin', 'supervisor', 'auditor'), generateStockMovementsPDF);

export default router;