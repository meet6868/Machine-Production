import express from 'express';
import { body } from 'express-validator';
import {
  getMachines,
  getMachine,
  createMachine,
  updateMachine,
  deleteMachine
} from '../controllers/machineController.js';
import { protect, checkCompanyAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const machineValidation = [
  body('machineNumber').trim().notEmpty().withMessage('Machine number is required'),
  body('type').isIn(['single', 'double']).withMessage('Type must be single or double')
];

// All routes are protected and require company access
router.use(protect);
router.use(checkCompanyAccess);

router.get('/', getMachines);
router.get('/:id', getMachine);
router.post('/', machineValidation, createMachine);
router.put('/:id', machineValidation, updateMachine);
router.delete('/:id', deleteMachine);

export default router;
