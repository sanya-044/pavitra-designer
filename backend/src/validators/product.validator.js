import { z } from 'zod';

const validCategories = ['Banarasi', 'Kanchipuram', 'Chanderi', 'Organza', 'Silk', 'Cotton'];

/**
 * Validation schema for creating a product (Admin or Seller)
 */
export const createProductSchema = z.object({
  name: z.string().trim().min(3, 'Saree name must be at least 3 characters').max(150),
  description: z.string().trim().optional(),
  category: z.enum(validCategories, {
    errorMap: () => ({ message: `Category must be one of: ${validCategories.join(', ')}` })
  }),
  fabric: z.string().trim().optional().default('Silk'),
  origin: z.string().trim().min(2, 'Origin city / weaver hub is required'),
  image: z.string().trim().url('Image must be a valid HTTP/HTTPS URL'),
  images: z.array(z.string().trim().url('Each image must be a valid URL')).optional(),
  price: z.coerce.number().positive('Wholesale price must be greater than 0'),
  moq: z.coerce.number().int().min(1, 'MOQ must be at least 1 piece').default(5),
  stock: z.coerce.number().int().min(0, 'Available stock cannot be negative').default(50)
});

/**
 * Validation schema for updating a product (Admin or Owner Seller)
 */
export const updateProductSchema = z.object({
  name: z.string().trim().min(3).max(150).optional(),
  description: z.string().trim().optional(),
  category: z.enum(validCategories).optional(),
  fabric: z.string().trim().optional(),
  origin: z.string().trim().min(2).optional(),
  image: z.string().trim().url().optional(),
  images: z.array(z.string().trim().url()).optional(),
  price: z.coerce.number().positive().optional(),
  moq: z.coerce.number().int().min(1).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

/**
 * Validation schema for querying public catalog
 */
export const productQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  fabric: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating_desc']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});
