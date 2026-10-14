import express from 'express';
import {
  getProducts,
  getCategories,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../validators/auth.validator.js';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema
} from '../validators/product.validator.js';

const router = express.Router();

/**
 * Public Routes
 */
router.get('/', validate(productQuerySchema, 'query'), getProducts);
router.get('/categories', getCategories);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

/**
 * Protected Routes (Admin & Seller only; Retailer forbidden)
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('admin', 'seller'),
  validate(createProductSchema),
  createProduct
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles('admin', 'seller'),
  validate(updateProductSchema),
  updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('admin', 'seller'),
  deleteProduct
);

export default router;
