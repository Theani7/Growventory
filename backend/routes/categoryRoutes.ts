import express from 'express';
const router = express.Router();
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { authenticate, authorize } from '../middleware/auth';

router.use(authenticate);

// View categories (all authenticated users including auditor)
router.get('/', getAllCategories);

// Manage categories (Admin, Supervisor)
router.post('/', authorize('admin', 'supervisor'), createCategory);
router.put('/:id', authorize('admin', 'supervisor'), updateCategory);
router.delete('/:id', authorize('admin', 'supervisor'), deleteCategory);

export default router;