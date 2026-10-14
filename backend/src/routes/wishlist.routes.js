import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} from '../controllers/wishlist.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../validators/auth.validator.js';
import { addWishlistItemSchema } from '../validators/cart.validator.js';

const router = express.Router();

// All wishlist routes require authenticated user
router.use(authenticate);

router.get('/', getWishlist);
router.post('/items', validate(addWishlistItemSchema), addToWishlist);
router.delete('/items/:productId', removeFromWishlist);

export default router;
