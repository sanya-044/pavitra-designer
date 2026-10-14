import { z } from 'zod';
import { GSTIN_REGEX } from '../models/User.js';

/**
 * Schema for public user registration.
 * Explicitly restricts roles to 'retailer' or 'seller' to prevent privilege escalation.
 */
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z
    .enum(['retailer', 'seller'], {
      errorMap: () => ({ message: 'Public registration role must be either "retailer" or "seller"' })
    })
    .default('retailer'),
  phone: z.string().trim().min(10, 'Phone must be at least 10 digits').max(15).optional().nullable(),
  businessName: z.string().trim().min(2, 'Business name must be at least 2 characters').max(150).optional().nullable(),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(GSTIN_REGEX, 'Invalid GSTIN format. Example: 22AAAAA0000A1Z5')
    .optional()
    .nullable()
});

/**
 * Schema for user login.
 */
export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

/**
 * Express middleware to validate request body or query against a Zod schema.
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const dataToValidate = source === 'query' ? req.query : req.body;
    const validatedData = schema.parse(dataToValidate);
    if (source === 'query') {
      Object.assign(req.query, validatedData);
    } else {
      req.body = validatedData;
    }
    next();
  } catch (err) {
    if (err instanceof z.ZodError || err.issues) {
      const issues = err.issues || err.errors || [];
      const formattedErrors = issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Validation error',
        errors: formattedErrors
      });
    }
    next(err);
  }
};
