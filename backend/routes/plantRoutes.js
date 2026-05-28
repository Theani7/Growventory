const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getAllPlants, getPlantById, createPlant, updatePlant, deletePlant, importPlants } = require('../controllers/plantController');
const { authenticate, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'plant-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const csvUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only CSV files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(authenticate);

// View plants - all authenticated (incl. auditor)
router.get('/', getAllPlants);
router.get('/:id', getPlantById);

// Create/update - Staff, Supervisor, Admin
router.post('/', authorize('admin', 'supervisor', 'staff'), upload.single('image'), createPlant);
router.put('/:id', authorize('admin', 'supervisor', 'staff'), upload.single('image'), updatePlant);

// Import plants - Admin, Supervisor
router.post('/import', authorize('admin', 'supervisor'), csvUpload.single('file'), importPlants);

// Delete - Admin, Supervisor
router.delete('/:id', authorize('admin', 'supervisor'), deletePlant);

module.exports = router;
