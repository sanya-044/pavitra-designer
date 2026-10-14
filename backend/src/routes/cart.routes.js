import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../validators/auth.validator.js';
import {
  addCartItemSchema,
  updateCartItemSchema
} from '../validators/cart.validator.js';

const router = express.Router();

// All cart routes require authenticated user
router.use(authenticate);

router.get('/', getCart);
router.post('/items', validate(addCartItemSchema), addToCart);
router.patch('/items/:productId', validate(updateCartItemSchema), updateCartItemQuantity);
router.delete('/items/:productId', removeCartItem);
router.delete('/', clearCart);

export default router;
