import express from 'express';
import {
  getAdminDashboardStats,
  getAdminUsers,
  getAdminUserById,
  updateAdminUserStatus,
  updateAdminUserVerification,
  getAdminProducts
} from '../controllers/admin.controller.js';
import {
  getAdminInquiries,
  updateAdminInquiryStatus
} from '../controllers/inquiry.controller.js';
import {
  getAdminOrders,
  updateAdminOrderStatus
} from '../controllers/order.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../validators/auth.validator.js';
import {
  updateUserStatusSchema,
  updateVerificationStatusSchema
} from '../validators/admin.validator.js';
import {
  updateInquiryStatusSchema,
  updateOrderStatusSchema
} from '../validators/order.validator.js';

const router = express.Router();

// Admin routes require authentication and admin role
router.use(authenticate);
router.use(authorizeRoles('admin'));

/**
 * Dashboard Summary Metrics
 */
router.get('/dashboard/stats', getAdminDashboardStats);
router.get('/overview', getAdminDashboardStats); // Compatible alias for AdminOverview.jsx

/**
 * User & Account Administration
 */
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserById);
router.patch('/users/:id/status', validate(updateUserStatusSchema), updateAdminUserStatus);
router.patch('/users/:id/verification', validate(updateVerificationStatusSchema), updateAdminUserVerification);
router.patch('/users/:id/verify', validate(updateVerificationStatusSchema), updateAdminUserVerification); // Alias matching api.md

/**
 * Catalog Administration
 */
router.get('/products', getAdminProducts);

/**
 * Inquiry Administration
 */
router.get('/inquiries', getAdminInquiries);
router.patch('/inquiries/:id/status', validate(updateInquiryStatusSchema), updateAdminInquiryStatus);

/**
 * Order Administration
 */
router.get('/orders', getAdminOrders);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), updateAdminOrderStatus);

export default router;
