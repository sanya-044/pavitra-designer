import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Inquiry from '../models/Inquiry.js';
import User from '../models/User.js';

/**
 * @route   GET /api/seller/dashboard/stats
 * @desc    Compute metrics specific to the authenticated weaver's loom cluster
 * @access  Private (Seller)
 */
export const getSellerDashboardStats = async (req, res, next) => {
  try {
    const sellerId = req.user._id || req.user.id;

    const [
      totalProducts,
      activeProducts,
      ordersResult,
      pendingInquiriesCount,
      inventorySummary
    ] = await Promise.all([
      Product.countDocuments({ seller: sellerId }),
      Product.countDocuments({ seller: sellerId, isActive: true }),
      // Find orders containing items produced by this seller
      Order.aggregate([
        { $match: { 'items.seller': new mongoose.Types.ObjectId(sellerId) } },
        { $unwind: '$items' },
        { $match: { 'items.seller': new mongoose.Types.ObjectId(sellerId) } },
        {
          $group: {
            _id: null,
            totalUnitsSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.subtotal' },
            distinctOrdersCount: { $addToSet: '$_id' }
          }
        }
      ]),
      Inquiry.countDocuments({ seller: sellerId, status: { $in: ['pending', 'quoted'] } }),
      // Total available inventory units across all seller products
      Product.aggregate([
        { $match: { seller: new mongoose.Types.ObjectId(sellerId), isActive: true } },
        { $group: { _id: null, totalStockPieces: { $sum: '$stock' } } }
      ])
    ]);

    const orderAgg = ordersResult.length > 0 ? ordersResult[0] : null;
    const totalOrdersCount = orderAgg ? orderAgg.distinctOrdersCount.length : 0;
    const totalRevenue = orderAgg ? orderAgg.totalRevenue : 0;
    const totalUnitsSold = orderAgg ? orderAgg.totalUnitsSold : 0;
    const totalStockPieces = inventorySummary.length > 0 ? inventorySummary[0].totalStockPieces : 0;

    res.status(200).json({
      success: true,
      message: 'Seller dashboard statistics calculated successfully.',
      data: {
        totalProducts,
        activeProducts,
        totalOrdersCount,
        totalUnitsSold,
        totalRevenue,
        formattedTotalRevenue: `₹${Number(totalRevenue).toLocaleString('en-IN')}`,
        pendingInquiriesCount,
        totalStockPieces,
        verificationStatus: req.user.businessVerificationStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/seller/products
 * @desc    Retrieve all saree listings manufactured by this seller (enforcing strict ownership)
 * @access  Private (Seller)
 */
export const getSellerProducts = async (req, res, next) => {
  try {
    const sellerId = req.user._id || req.user.id;
    const { isActive, page, limit } = req.query;

    const query = { seller: sellerId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      message: 'Seller products retrieved successfully.',
      data: {
        products: products.map((p) => p.toJSON()),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/seller/profile
 * @desc    Update permitted business profile fields (businessName, phone, gstin)
 * @access  Private (Seller)
 */
export const updateSellerProfile = async (req, res, next) => {
  try {
    const sellerId = req.user._id || req.user.id;
    const { name, phone, businessName, gstin } = req.body;

    const user = await User.findById(sellerId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found.'
      });
    }

    // Only allow permitted updates (never role, verificationStatus, or accountStatus)
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (businessName !== undefined) user.businessName = businessName;
    if (gstin !== undefined) {
      user.gstin = gstin;
      // When GSTIN is changed or submitted, transition to pending if unverified
      if (user.businessVerificationStatus === 'unverified') {
        user.businessVerificationStatus = 'pending';
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Seller business profile updated successfully.',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};
