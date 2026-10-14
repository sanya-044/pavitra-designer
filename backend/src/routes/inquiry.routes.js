import express from 'express';
import {
  createInquiry,
  getMyInquiries,
  getInquiryById,
  updateInquiry,
  getSellerInquiries,
  submitQuotation,
  getAdminInquiries,
  updateAdminInquiryStatus
} from '../controllers/inquiry.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../validators/auth.validator.js';
import {
  createInquirySchema,
  updateInquirySchema,
  submitQuotationSchema,
  updateInquiryStatusSchema
} from '../validators/order.validator.js';

const router = express.Router();

// All inquiry routes require authentication
router.use(authenticate);

/**
 * Retailer Inquiry Routes
 */
router.post('/', authorizeRoles('retailer', 'admin'), validate(createInquirySchema), createInquiry);
router.get('/my', authorizeRoles('retailer'), getMyInquiries);
router.get('/:id', getInquiryById); // Controller checks ownership/seller/admin
router.patch('/:id', validate(updateInquirySchema), updateInquiry);

export default router;
