import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateSellerOrderStatus,
  getAdminOrders,
  updateAdminOrderStatus
} from '../controllers/order.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../validators/auth.validator.js';
import {
  createOrderSchema,
  updateOrderStatusSchema
} from '../validators/order.validator.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticate);

/**
 * Retailer Order Routes
 */
router.post('/', authorizeRoles('retailer', 'admin'), validate(createOrderSchema), createOrder);
router.get('/my', authorizeRoles('retailer'), getMyOrders);
router.get('/:id', getOrderById); // Controller checks ownership/seller/admin

export default router;
