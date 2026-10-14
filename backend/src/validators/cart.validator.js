import { z } from 'zod';

/**
 * Validation schema for adding/updating an item in the cart
 */
export const addCartItemSchema = z.object({
  productId: z.string().trim().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1 piece')
});

/**
 * Validation schema for updating item quantity
 */
export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1 piece')
});

/**
 * Validation schema for adding/toggling item in wishlist
 */
export const addWishlistItemSchema = z.object({
  productId: z.string().trim().min(1, 'Product ID is required')
});
