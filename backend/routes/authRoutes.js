import express from 'express';
import { body } from 'express-validator';
import { 
  signup, 
  login, 
  getProfile, 
  updateFirstLogin 
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const signupValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('companyName').trim().notEmpty().withMessage('Company name is required')
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/profile', protect, getProfile);
router.put('/first-login', protect, updateFirstLogin);

export default router;
