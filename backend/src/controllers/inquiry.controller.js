import mongoose from 'mongoose';
import Inquiry, { generateInquiryNumber } from '../models/Inquiry.js';
import Product from '../models/Product.js';

/**
 * @route   POST /api/inquiries
 * @desc    Create a B2B bulk-order or quotation inquiry
 * @access  Private (Retailer)
 */
export const createInquiry = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId, quantity, buyerNotes, shippingAddress } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format.'
      });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or is currently discontinued.'
      });
    }

    const qty = Number(quantity);

    // Validate MOQ for wholesale inquiries
    if (qty < product.moq) {
      return res.status(400).json({
        success: false,
        message: `Inquiry quantity (${qty}) must be at least the Minimum Order Quantity (MOQ) of ${product.moq} pieces.`
      });
    }

    const subtotal = product.price * qty;

    const itemSnapshot = {
      product: product._id,
      name: product.name,
      category: product.category,
      fabric: product.fabric,
      origin: product.origin,
      image: product.image,
      catalogPrice: product.price,
      moq: product.moq,
      quantity: qty,
      subtotal,
      seller: product.seller
    };

    let inquiryNumber = generateInquiryNumber();
    while (await Inquiry.findOne({ inquiryNumber })) {
      inquiryNumber = generateInquiryNumber();
    }

    const inquiry = await Inquiry.create({
      inquiryNumber,
      retailer: userId,
      seller: product.seller,
      items: [itemSnapshot],
      totalUnits: qty,
      estimatedSubtotal: subtotal,
      buyerNotes: buyerNotes || '',
      shippingAddress,
      status: 'pending'
    });

    const populated = await Inquiry.findById(inquiry._id)
      .populate('retailer', 'name email businessName gstin phone')
      .populate('seller', 'name email businessName');

    res.status(201).json({
      success: true,
      message: 'B2B Wholesale Inquiry submitted successfully.',
      data: {
        inquiry: populated.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/inquiries/my
 * @desc    List current authenticated retailer's inquiries
 * @access  Private (Retailer)
 */
export const getMyInquiries = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    const inquiries = await Inquiry.find({ retailer: userId })
      .populate('seller', 'name businessName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Inquiries retrieved successfully.',
      data: {
        inquiries: inquiries.map((i) => i.toJSON())
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/inquiries/:id
 * @desc    Retrieve single inquiry (Access: Owner Retailer, Target Seller, or Admin)
 * @access  Private
 */
export const getInquiryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req.user._id || req.user.id).toString();
    const userRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inquiry ID format.'
      });
    }

    const inquiry = await Inquiry.findById(id)
      .populate('retailer', 'name email businessName gstin phone')
      .populate('seller', 'name email businessName');

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found.'
      });
    }

    const isRetailerOwner = inquiry.retailer._id.toString() === userId;
    const isSellerTarget = inquiry.seller._id.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isRetailerOwner && !isSellerTarget && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to view this inquiry.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inquiry details retrieved successfully.',
      data: {
        inquiry: inquiry.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/inquiries/:id
 * @desc    Update buyer notes / shipping details (Only while in 'pending' status)
 * @access  Private (Owner Retailer)
 */
export const updateInquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req.user._id || req.user.id).toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inquiry ID format.'
      });
    }

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found.'
      });
    }

    if (inquiry.retailer.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You can only edit your own inquiries.'
      });
    }

    if (inquiry.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Inquiry cannot be modified once it is in '${inquiry.status}' status.`
      });
    }

    const { buyerNotes, shippingAddress } = req.body;
    if (buyerNotes !== undefined) inquiry.buyerNotes = buyerNotes;
    if (shippingAddress) inquiry.shippingAddress = shippingAddress;

    await inquiry.save();

    res.status(200).json({
      success: true,
      message: 'Inquiry updated successfully.',
      data: {
        inquiry: inquiry.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/seller/inquiries
 * @desc    List all inquiries received by the authenticated seller
 * @access  Private (Seller)
 */
export const getSellerInquiries = async (req, res, next) => {
  try {
    const sellerId = req.user._id || req.user.id;

    const inquiries = await Inquiry.find({ seller: sellerId })
      .populate('retailer', 'name email businessName gstin phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Seller inquiries retrieved successfully.',
      data: {
        inquiries: inquiries.map((i) => i.toJSON())
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/seller/inquiries/:id/quote
 * @desc    Submit or update formal weaver quotation for an inquiry
 * @access  Private (Seller assigned to inquiry)
 */
export const submitQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sellerId = (req.user._id || req.user.id).toString();
    const { quotedPricePerUnit, sellerNotes, validUntilDays } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inquiry ID format.'
      });
    }

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found.'
      });
    }

    if (inquiry.seller.toString() !== sellerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You can only provide quotes for inquiries assigned to your loom cluster.'
      });
    }

    if (inquiry.status === 'converted_to_order' || inquiry.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Cannot quote an inquiry with status '${inquiry.status}'.`
      });
    }

    const unitPrice = Number(quotedPricePerUnit);
    const quotedSubtotal = unitPrice * inquiry.totalUnits;
    const quotedTaxAmount = Math.round(quotedSubtotal * 0.05); // 5% GST
    const quotedGrandTotal = quotedSubtotal + quotedTaxAmount;

    const validDays = Number(validUntilDays) || 14;
    const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

    inquiry.quotation = {
      quotedPricePerUnit: unitPrice,
      quotedSubtotal,
      quotedTaxAmount,
      quotedGrandTotal,
      sellerNotes: sellerNotes || '',
      quotedBy: req.user._id,
      quotedAt: new Date(),
      validUntil
    };

    inquiry.status = 'quoted';
    await inquiry.save();

    res.status(200).json({
      success: true,
      message: 'Quotation submitted successfully.',
      data: {
        inquiry: inquiry.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/inquiries
 * @desc    List all platform inquiries with filter options
 * @access  Private (Admin)
 */
export const getAdminInquiries = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const inquiries = await Inquiry.find(filter)
      .populate('retailer', 'name email businessName gstin')
      .populate('seller', 'name email businessName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Platform inquiries retrieved.',
      data: {
        inquiries: inquiries.map((i) => i.toJSON())
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/inquiries/:id/status
 * @desc    Update inquiry status directly
 * @access  Private (Admin)
 */
export const updateAdminInquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inquiry ID format.'
      });
    }

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found.'
      });
    }

    inquiry.status = status;
    await inquiry.save();

    res.status(200).json({
      success: true,
      message: `Inquiry status updated to ${status}.`,
      data: {
        inquiry: inquiry.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};
