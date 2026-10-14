import { z } from 'zod';

const shippingAddressSchema = z.object({
  addressLine: z.string().trim().min(5, 'Address line must be at least 5 characters'),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit Indian PIN code')
});

/**
 * Validation schema for creating a B2B Inquiry
 */
export const createInquirySchema = z.object({
  productId: z.string().trim().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1 piece'),
  buyerNotes: z.string().trim().optional(),
  shippingAddress: shippingAddressSchema
});

/**
 * Validation schema for updating buyer inquiry details
 */
export const updateInquirySchema = z.object({
  buyerNotes: z.string().trim().optional(),
  shippingAddress: shippingAddressSchema.optional()
});

/**
 * Validation schema for Seller Quotation
 */
export const submitQuotationSchema = z.object({
  quotedPricePerUnit: z.coerce.number().positive('Quoted unit price must be positive'),
  sellerNotes: z.string().trim().optional(),
  validUntilDays: z.coerce.number().int().min(1).max(90).default(14)
});

/**
 * Validation schema for Admin status update on inquiry
 */
export const updateInquiryStatusSchema = z.object({
  status: z.enum(['pending', 'quoted', 'accepted', 'rejected', 'expired', 'converted_to_order'])
});

/**
 * Validation schema for placing an Order directly or from cart
 */
export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  notes: z.string().trim().optional(),
  idempotencyKey: z.string().trim().optional(),
  inquiryId: z.string().trim().optional() // Optional: order directly from quotation
});

/**
 * Validation schema for Seller/Admin status updates on orders
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'in_production', 'dispatched', 'in_transit', 'delivered', 'cancelled'])
});
