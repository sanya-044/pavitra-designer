import mongoose from 'mongoose';
import Order, { generateOrderNumber } from '../models/Order.js';
import Inquiry from '../models/Inquiry.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Define allowed status transitions for orders
export const ALLOWED_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_production', 'cancelled'],
  in_production: ['dispatched', 'cancelled'],
  dispatched: ['in_transit'],
  in_transit: ['delivered'],
  delivered: [],
  cancelled: []
};

/**
 * Helper to validate status transitions
 */
export function isValidStatusTransition(currentStatus, targetStatus) {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * @route   POST /api/orders
 * @desc    Create an order from cart items or from an approved quotation inquiry
 * @access  Private (Retailer)
 */
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { shippingAddress, notes, idempotencyKey, inquiryId } = req.body;

    // 1. Idempotency Check: if idempotencyKey supplied, return existing order if already processed
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey });
      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: 'Order already processed (idempotent request).',
          data: {
            order: existingOrder.toJSON()
          }
        });
      }
    }

    let orderItems = [];
    let inquiryRef = null;

    // 2. Branch: Order from Inquiry Quotation OR Order from Cart
    if (inquiryId) {
      // Placing order based on an approved/quoted Inquiry
      if (!mongoose.Types.ObjectId.isValid(inquiryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid inquiry ID format.'
        });
      }

      const inquiry = await Inquiry.findById(inquiryId);
      if (!inquiry) {
        return res.status(404).json({
          success: false,
          message: 'Inquiry not found.'
        });
      }

      // Check ownership
      if (inquiry.retailer.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: You can only convert your own inquiries into orders.'
        });
      }

      if (inquiry.status !== 'quoted' && inquiry.status !== 'accepted') {
        return res.status(400).json({
          success: false,
          message: `Inquiry cannot be converted to order because its current status is '${inquiry.status}'.`
        });
      }

      // Check quotation validity
      if (inquiry.quotation?.validUntil && new Date() > new Date(inquiry.quotation.validUntil)) {
        inquiry.status = 'expired';
        await inquiry.save();
        return res.status(400).json({
          success: false,
          message: 'Quotation has expired. Please request a new quote.'
        });
      }

      // Check live product existence and stock
      for (const item of inquiry.items) {
        const prod = await Product.findById(item.product);
        if (!prod || !prod.isActive) {
          return res.status(400).json({
            success: false,
            message: `Product "${item.name}" is no longer available.`
          });
        }
        if (prod.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product "${prod.name}". Available: ${prod.stock}, Requested: ${item.quantity}.`
          });
        }

        const unitPrice = inquiry.quotation?.quotedPricePerUnit || prod.price;
        const itemSubtotal = unitPrice * item.quantity;

        orderItems.push({
          product: prod._id,
          name: prod.name,
          category: prod.category,
          fabric: prod.fabric,
          origin: prod.origin,
          image: prod.image,
          price: unitPrice,
          moq: prod.moq,
          quantity: item.quantity,
          subtotal: itemSubtotal,
          seller: prod.seller
        });
      }

      inquiryRef = inquiry._id;
    } else {
      // Placing order from user's active Cart
      const cart = await Cart.findOne({ user: userId }).populate('items.product');
      if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Your cart is empty. Add sarees to your cart or provide an inquiry ID.'
        });
      }

      for (const item of cart.items) {
        const prod = item.product;
        if (!prod || !prod.isActive) {
          return res.status(400).json({
            success: false,
            message: `One or more products in your cart are no longer active or available.`
          });
        }

        // Enforce MOQ
        if (item.quantity < prod.moq) {
          return res.status(400).json({
            success: false,
            message: `Product "${prod.name}" requires minimum order quantity (MOQ) of ${prod.moq} pcs. Current quantity: ${item.quantity}.`
          });
        }

        // Enforce Stock
        if (prod.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for "${prod.name}". Available: ${prod.stock}, Requested: ${item.quantity}.`
          });
        }

        const itemSubtotal = prod.price * item.quantity;

        orderItems.push({
          product: prod._id,
          name: prod.name,
          category: prod.category,
          fabric: prod.fabric,
          origin: prod.origin,
          image: prod.image,
          price: prod.price,
          moq: prod.moq,
          quantity: item.quantity,
          subtotal: itemSubtotal,
          seller: prod.seller
        });
      }
    }

    // 3. Server-side price and totals calculation (never trust frontend totals)
    let totalUnits = 0;
    let subtotal = 0;
    for (const item of orderItems) {
      totalUnits += item.quantity;
      subtotal += item.subtotal;
    }

    const taxAmount = Math.round(subtotal * 0.05); // 5% GST standard for textiles
    const shippingAmount = 0; // B2B free freight / credit invoice standard
    const grandTotal = subtotal + taxAmount + shippingAmount;

    // 4. Atomic stock deduction
    // Decrement stock for each product safely using atomic $inc with condition stock >= qty
    for (const item of orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { returnDocument: 'after' }
      );

      if (!updatedProduct) {
        // Rollback already deducted items if concurrency collision happens
        for (const rolledBackItem of orderItems) {
          if (rolledBackItem.product.toString() === item.product.toString()) break;
          await Product.findByIdAndUpdate(rolledBackItem.product, {
            $inc: { stock: rolledBackItem.quantity }
          });
        }
        return res.status(400).json({
          success: false,
          message: `Stock conflict: "${item.name}" ran out of stock or was purchased by another buyer concurrently.`
        });
      }
    }

    // 5. Generate unique Order Number
    let orderNumber = generateOrderNumber();
    while (await Order.findOne({ orderNumber })) {
      orderNumber = generateOrderNumber();
    }

    // 6. Create Order record
    const retailerName = req.user.businessName || req.user.name;

    const order = await Order.create({
      orderNumber,
      idempotencyKey: idempotencyKey || undefined,
      retailer: userId,
      retailerName,
      items: orderItems,
      totalUnits,
      subtotal,
      taxAmount,
      shippingAmount,
      grandTotal,
      shippingAddress,
      status: 'confirmed',
      paymentStatus: 'credit_invoice',
      inquiryReference: inquiryRef,
      notes: notes || ''
    });

    // 7. Post-creation cleanup:
    // If order was from cart, clear cart
    if (!inquiryId) {
      await Cart.findOneAndUpdate({ user: userId }, { items: [] });
    } else {
      // If order was from inquiry, update inquiry status to converted_to_order
      await Inquiry.findByIdAndUpdate(inquiryId, { status: 'converted_to_order' });
    }

    const populated = await Order.findById(order._id)
      .populate('retailer', 'name email businessName gstin phone')
      .populate('items.seller', 'name email businessName');

    return res.status(201).json({
      success: true,
      message: 'B2B Wholesale Order placed successfully.',
      data: {
        order: populated.toJSON()
      }
    });
  } catch (error) {
    // If unique constraint error on idempotencyKey, return duplicate conflict gracefully
    if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey: req.body.idempotencyKey });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Order already processed (idempotent request).',
          data: {
            order: existing.toJSON()
          }
        });
      }
    }
    next(error);
  }
};

/**
 * @route   GET /api/orders/my
 * @desc    List current authenticated retailer's orders
 * @access  Private (Retailer)
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    const orders = await Order.find({ retailer: userId })
      .populate('items.seller', 'name businessName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Retailer orders retrieved successfully.',
      data: {
        orders: orders.map((o) => o.toJSON())
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders/:id
 * @desc    Retrieve single order by ID (Retailer owner, Seller of item, or Admin)
 * @access  Private
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req.user._id || req.user.id).toString();
    const userRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.'
      });
    }

    const order = await Order.findById(id)
      .populate('retailer', 'name email businessName gstin phone')
      .populate('items.seller', 'name email businessName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    const isRetailerOwner = order.retailer._id.toString() === userId;
    const isSeller = order.items.some((item) => item.seller?._id?.toString() === userId || item.seller?.toString() === userId);
    const isAdmin = userRole === 'admin';

    if (!isRetailerOwner && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You are not authorized to view this order.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order details retrieved successfully.',
      data: {
        order: order.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/seller/orders
 * @desc    List orders containing products manufactured by the authenticated seller
 * @access  Private (Seller)
 */
export const getSellerOrders = async (req, res, next) => {
  try {
    const sellerId = req.user._id || req.user.id;

    // Find orders where at least one item belongs to this seller
    const orders = await Order.find({ 'items.seller': sellerId })
      .populate('retailer', 'name email businessName gstin phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Seller orders retrieved successfully.',
      data: {
        orders: orders.map((o) => o.toJSON())
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/seller/orders/:id/status
 * @desc    Update fulfillment status of an order within allowed transitions
 * @access  Private (Seller assigned to order)
 */
export const updateSellerOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sellerId = (req.user._id || req.user.id).toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Verify seller is assigned to at least one item in the order
    const isAssignedSeller = order.items.some((item) => item.seller.toString() === sellerId);
    if (!isAssignedSeller && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You can only update fulfillment for orders assigned to your loom cluster.'
      });
    }

    // Check allowed status transitions
    if (!isValidStatusTransition(order.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${order.status}' to '${status}'. Allowed transitions: ${JSON.stringify(ALLOWED_STATUS_TRANSITIONS[order.status] || [])}`
      });
    }

    // If cancelling, restore product inventory
    if (status === 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}' successfully.`,
      data: {
        order: order.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/orders
 * @desc    List all platform orders with optional status filtering
 * @access  Private (Admin)
 */
export const getAdminOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('retailer', 'name email businessName gstin phone')
      .populate('items.seller', 'name businessName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Admin orders retrieved successfully.',
      data: {
        orders: orders.map((o) => o.toJSON())
      }
    });
  } catch (error)
  {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/orders/:id/status
 * @desc    Admin update order status with transition validation
 * @access  Private (Admin)
 */
export const updateAdminOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Check allowed status transitions
    if (!isValidStatusTransition(order.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${order.status}' to '${status}'. Allowed transitions: ${JSON.stringify(ALLOWED_STATUS_TRANSITIONS[order.status] || [])}`
      });
    }

    // If cancelling, restore product inventory
    if (status === 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Admin updated order status to '${status}'.`,
      data: {
        order: order.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};
