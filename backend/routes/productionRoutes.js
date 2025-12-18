import express from 'express';
import { body } from 'express-validator';
import {
  getProductions,
  getProduction,
  createProduction,
  updateProduction,
  deleteProduction,
  getProductionStats,
  getDailySummary,
  getDateSummary,
  getSummaries,
  getWorkerAnalytics,
  getMachineAnalytics,
  getElectricityAnalytics,
  getYesterdaySummaryByMachine
} from '../controllers/productionController.js';
import { protect, checkCompanyAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const productionValidation = [
  body('machine').notEmpty().withMessage('Machine is required'),
  body('worker').notEmpty().withMessage('Worker is required'),
  body('shift').isIn(['day', 'night']).withMessage('Shift must be day or night'),
  body('runtime').optional().isNumeric().withMessage('Runtime must be a number'),
  body('efficiency').optional().isNumeric().withMessage('Efficiency must be a number'),
  body('h1').optional().isNumeric().withMessage('H1 must be a number'),
  body('h2').optional().isNumeric().withMessage('H2 must be a number'),
  body('worph').optional().isNumeric().withMessage('WorPH must be a number'),
  body('meter').optional().isNumeric().withMessage('Meter must be a number'),
  body('totalPick').optional().isNumeric().withMessage('Total Pick must be a number'),
  // Daily fields
  body('speed').optional().isNumeric().withMessage('Speed must be a number'),
  body('cfm').optional().isNumeric().withMessage('CFM must be a number'),
  body('pik').optional().isNumeric().withMessage('Pik must be a number'),
  // Electricity fields
  body('previousReading').optional().isNumeric().withMessage('Previous reading must be a number'),
  body('currentReading').optional().isNumeric().withMessage('Current reading must be a number')
];

// All routes are protected and require company access
router.use(protect);
router.use(checkCompanyAccess);

router.get('/', getProductions);
router.get('/stats', getProductionStats);
router.get('/summaries', getSummaries);
router.get('/summary/daily', getDailySummary);
router.get('/summary/yesterday-by-machine', getYesterdaySummaryByMachine);
router.get('/summary/:date', getDateSummary);
router.get('/analytics/electricity', getElectricityAnalytics);
router.get('/analytics/worker/:workerId', getWorkerAnalytics);
router.get('/analytics/machine/:machineId', getMachineAnalytics);
router.get('/:id', getProduction);
router.post('/', productionValidation, createProduction);
router.put('/:id', productionValidation, updateProduction);
router.delete('/:id', deleteProduction);

export default router;
