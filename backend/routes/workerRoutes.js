import express from 'express';
import { body } from 'express-validator';
import {
  getWorkers,
  getWorker,
  createWorker,
  updateWorker,
  deleteWorker
} from '../controllers/workerController.js';
import { protect, checkCompanyAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const workerValidation = [
  body('name').trim().notEmpty().withMessage('Worker name is required'),
  body('aadhaarNumber').optional().trim(),
  body('phone').optional().trim()
];

// All routes are protected and require company access
router.use(protect);
router.use(checkCompanyAccess);

router.get('/', getWorkers);
router.get('/:id', getWorker);
router.post('/', workerValidation, createWorker);
router.put('/:id', workerValidation, updateWorker);
router.delete('/:id', deleteWorker);

export default router;
