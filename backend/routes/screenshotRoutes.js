import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createMappingTemplate,
  getMappingTemplates,
  getMappingTemplate,
  getDefaultTemplate,
  updateMappingTemplate,
  deleteMappingTemplate,
  createWorkerNameMapping,
  getWorkerNameMappings,
  updateWorkerNameMapping,
  deleteWorkerNameMapping,
  processScreenshot,
  getScreenshotStatus,
  getScreenshotRecords,
  verifyScreenshotData,
  deleteScreenshotRecord
} from '../controllers/screenshotController.js';
import { protect as authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for screenshot uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads/screenshots'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'screenshot-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// ============ MAPPING TEMPLATE ROUTES ============

// Get all mapping templates
router.get('/templates', authenticateToken, getMappingTemplates);

// Get default template
router.get('/templates/default', authenticateToken, getDefaultTemplate);

// Get specific template
router.get('/templates/:id', authenticateToken, getMappingTemplate);

// Create new template
router.post('/templates', authenticateToken, createMappingTemplate);

// Update template
router.put('/templates/:id', authenticateToken, updateMappingTemplate);

// Delete template
router.delete('/templates/:id', authenticateToken, deleteMappingTemplate);

// ============ WORKER NAME MAPPING ROUTES ============

// Get all worker name mappings
router.get('/worker-mappings', authenticateToken, getWorkerNameMappings);

// Create worker name mapping
router.post('/worker-mappings', authenticateToken, createWorkerNameMapping);

// Update worker name mapping
router.put('/worker-mappings/:id', authenticateToken, updateWorkerNameMapping);

// Delete worker name mapping
router.delete('/worker-mappings/:id', authenticateToken, deleteWorkerNameMapping);

// ============ SCREENSHOT PROCESSING ROUTES ============

// Upload and process screenshot
router.post('/upload', authenticateToken, upload.single('screenshot'), processScreenshot);

// Get screenshot processing status
router.get('/status/:id', authenticateToken, getScreenshotStatus);

// Get screenshot records (with filters)
router.get('/records', authenticateToken, getScreenshotRecords);

// Verify/correct extracted data
router.put('/verify/:id', authenticateToken, verifyScreenshotData);

// Delete screenshot record
router.delete('/records/:id', authenticateToken, deleteScreenshotRecord);

export default router;
