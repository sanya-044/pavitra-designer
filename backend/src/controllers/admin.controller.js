import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Inquiry from '../models/Inquiry.js';

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Compute comprehensive platform summary metrics from live database records
 * @access  Private (Admin)
 */
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      retailersCount,
      verifiedRetailersCount,
      sellersCount,
      verifiedSellersCount,
      catalogItemsCount,
      activeCatalogCount,
      ordersTotal,
      activeOrdersCount,
      pendingOrdersCount,
      pendingInquiriesCount,
      revenueResult
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'retailer' }),
      User.countDocuments({ role: 'retailer', businessVerificationStatus: 'verified' }),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'seller', businessVerificationStatus: 'verified' }),
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      // Active orders excluding cancelled and delivered
      Order.countDocuments({ status: { $in: ['confirmed', 'in_production', 'dispatched', 'in_transit'] } }),
      Order.countDocuments({ status: 'pending' }),
      Inquiry.countDocuments({ status: 'pending' }),
      // Calculate total platform revenue from non-cancelled orders
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' } } }
      ])
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      message: 'Admin dashboard statistics calculated successfully.',
      data: {
        totalRevenue,
        formattedTotalRevenue: `₹${Number(totalRevenue).toLocaleString('en-IN')}`,
        ordersPlaced: ordersTotal,
        activeOrdersCount,
        pendingOrdersCount,
        pendingInquiriesCount,
        catalogItemsCount: activeCatalogCount,
        totalCatalogItems: catalogItemsCount,
        verifiedRetailersCount,
        retailersCount,
        verifiedSellersCount,
        sellersCount,
        totalUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    List all platform users with pagination, role, verification, and status filters
 * @access  Private (Admin)
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const { role, status, verificationStatus, search, page, limit } = req.query;

    const query = {};

    if (role && ['admin', 'seller', 'retailer'].includes(role)) {
      query.role = role;
    }

    if (status && ['active', 'suspended', 'pending_approval'].includes(status)) {
      query.accountStatus = status;
    }

    if (verificationStatus && ['unverified', 'pending', 'verified', 'rejected'].includes(verificationStatus)) {
      query.businessVerificationStatus = verificationStatus;
    }

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { businessName: { $regex: escaped, $options: 'i' } },
        { gstin: { $regex: escaped, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      message: 'Users list retrieved successfully.',
      data: {
        users: users.map((u) => u.toJSON()),
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
 * @route   GET /api/admin/users/:id
 * @desc    Retrieve detailed user profile for administration
 * @access  Private (Admin)
 */
export const getAdminUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Attach contextual counts for this user (products if seller, orders if retailer)
    let relatedStats = {};
    if (user.role === 'seller') {
      const [productCount, orderCount] = await Promise.all([
        Product.countDocuments({ seller: user._id }),
        Order.countDocuments({ 'items.seller': user._id })
      ]);
      relatedStats = { productCount, orderCount };
    } else if (user.role === 'retailer') {
      const [orderCount, inquiryCount] = await Promise.all([
        Order.countDocuments({ retailer: user._id }),
        Inquiry.countDocuments({ retailer: user._id })
      ]);
      relatedStats = { orderCount, inquiryCount };
    }

    res.status(200).json({
      success: true,
      message: 'User details retrieved successfully.',
      data: {
        user: user.toJSON(),
        stats: relatedStats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Activate or suspend a user account (with Last-Admin Protection)
 * @access  Private (Admin)
 */
export const updateAdminUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Protection rule: Prevent suspending the last active administrator
    if (user.role === 'admin' && status !== 'active') {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        accountStatus: 'active'
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Operation denied: Cannot suspend the last active system administrator.'
        });
      }
    }

    user.accountStatus = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account status updated to '${status}'.`,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/users/:id/verification
 * @desc    Update B2B business GSTIN verification status
 * @access  Private (Admin)
 */
export const updateAdminUserVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    user.businessVerificationStatus = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Business verification status updated to '${status}'.`,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/products
 * @desc    Manage all catalog listings including active and inactive items
 * @access  Private (Admin)
 */
export const getAdminProducts = async (req, res, next) => {
  try {
    const { isActive, category, search, page, limit } = req.query;

    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { origin: { $regex: escaped, $options: 'i' } },
        { fabric: { $regex: escaped, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('seller', 'name businessName email businessVerificationStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      message: 'Admin products retrieved successfully.',
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
