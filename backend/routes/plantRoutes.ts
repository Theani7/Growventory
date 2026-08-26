import express, { Request, Response, NextFunction, RequestHandler } from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import { getAllPlants, getPlantById, createPlant, updatePlant, deletePlant, importPlants } from '../controllers/plantController';
import { authenticate, authorize } from '../middleware/auth';

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
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = /\.(jpeg|jpg|png|gif|webp)$/i;

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type "${file.mimetype}". Only JPG, PNG, GIF, and WEBP images are allowed.`));
    }
    if (!allowedExtensions.test(path.extname(file.originalname))) {
      return cb(new Error(`Invalid file extension. Only .jpg, .jpeg, .png, .gif, and .webp are allowed.`));
    }
    cb(null, true);
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

// Helper to catch multer errors and return JSON
const handleUpload = (uploadMiddleware: RequestHandler): RequestHandler => (req: Request, res: Response, next: NextFunction) => {
  uploadMiddleware(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// View plants - all authenticated (incl. auditor)
router.get('/', getAllPlants);
router.get('/:id', getPlantById);

// Create/update - Staff, Supervisor, Admin
router.post('/', authorize('admin', 'staff', 'supervisor'), handleUpload(upload.single('image')), createPlant);
router.put('/:id', authorize('admin', 'staff', 'supervisor'), handleUpload(upload.single('image')), updatePlant);

// Import plants - Admin only
router.post('/import', authorize('admin'), handleUpload(csvUpload.single('file')), importPlants);

// Delete - Admin only
router.delete('/:id', authorize('admin'), deletePlant);

export default router;