import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  getMe,
  logout,
  provisionAdmin
} from '../controllers/auth.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate, registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = express.Router();

// Specific Rate Limiter for Authentication Attempts (15 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

// Public Authentication Endpoints
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);

// Protected Authentication Endpoints
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

// Administrative Provisioning Endpoint (Protected by X-Admin-Secret header)
router.post('/provision-admin', authLimiter, provisionAdmin);

// Role Protection Verification Endpoint (Useful for verification tests and RBAC diagnostics)
router.get('/admin-only', authenticate, authorizeRoles('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Admin Portal.',
    user: req.user.toJSON()
  });
});

export default router;
