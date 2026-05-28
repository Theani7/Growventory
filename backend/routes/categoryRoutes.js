const express = require('express');
const router = express.Router();
const { getAllCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// View categories (all authenticated users including auditor)
router.get('/', getAllCategories);

// Manage categories (Admin, Supervisor)
router.post('/', authorize('admin', 'supervisor'), createCategory);
router.put('/:id', authorize('admin', 'supervisor'), updateCategory);
router.delete('/:id', authorize('admin', 'supervisor'), deleteCategory);

module.exports = router;
