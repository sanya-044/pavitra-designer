import express from 'express';
import {
  getSellerDashboardStats,
  getSellerProducts,
  updateSellerProfile
} from '../controllers/seller.controller.js';
import {
  getSellerInquiries,
  submitQuotation
} from '../controllers/inquiry.controller.js';
import {
  getSellerOrders,
  updateSellerOrderStatus
} from '../controllers/order.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../validators/auth.validator.js';
import { updateSellerProfileSchema } from '../validators/admin.validator.js';
import {
  submitQuotationSchema,
  updateOrderStatusSchema
} from '../validators/order.validator.js';

const router = express.Router();

// Seller routes require authentication and seller or admin role
router.use(authenticate);
router.use(authorizeRoles('seller', 'admin'));

/**
 * Seller Dashboard Metrics
 */
router.get('/dashboard/stats', getSellerDashboardStats);

/**
 * Seller Saree Catalog (Ownership Enforced)
 */
router.get('/products', getSellerProducts);

/**
 * Seller Business Profile
 */
router.patch('/profile', validate(updateSellerProfileSchema), updateSellerProfile);

/**
 * Seller Inquiries
 */
router.get('/inquiries', getSellerInquiries);
router.patch('/inquiries/:id/quote', validate(submitQuotationSchema), submitQuotation);

/**
 * Seller Orders
 */
router.get('/orders', getSellerOrders);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), updateSellerOrderStatus);

export default router;
