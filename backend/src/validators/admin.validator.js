import { z } from 'zod';
import { GSTIN_REGEX } from '../models/User.js';

/**
 * Validation schema for admin updating user accountStatus
 */
export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'pending_approval'], {
    errorMap: () => ({ message: 'Status must be active, suspended, or pending_approval' })
  })
});

/**
 * Validation schema for admin updating businessVerificationStatus
 */
export const updateVerificationStatusSchema = z.object({
  status: z.enum(['unverified', 'pending', 'verified', 'rejected'], {
    errorMap: () => ({ message: 'Status must be unverified, pending, verified, or rejected' })
  })
});

/**
 * Validation schema for seller updating permitted profile fields
 */
export const updateSellerProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
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
