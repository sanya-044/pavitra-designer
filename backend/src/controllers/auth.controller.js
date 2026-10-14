import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new retailer or seller (Public cannot register as admin)
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, businessName, gstin } = req.body;

    // Double check email uniqueness
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Set initial business verification status based on whether GSTIN is provided
    let businessVerificationStatus = 'unverified';
    if (gstin) {
      businessVerificationStatus = 'pending';
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role: role || 'retailer',
      phone: phone || null,
      businessName: businessName || null,
      gstin: gstin ? gstin.toUpperCase() : null,
      businessVerificationStatus,
      accountStatus: 'active'
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user: newUser.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user (admin, seller, or retailer) and return JWT
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.accountStatus}. Please contact support.`
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private (Bearer Token required)
 */
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully.',
      data: {
        user: req.user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (Bearer token strategy: client discards token from storage; server acknowledges session termination)
 * @access  Private (Bearer Token required)
 */
export const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. The client should discard the stored authorization token.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/provision-admin
 * @desc    Secure internal endpoint to provision the platform administrator
 *          Protected by ADMIN_SECRET_KEY header or env configuration
 * @access  Internal / Secret-Protected
 */
export const provisionAdmin = async (req, res, next) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    const configuredSecret = process.env.ADMIN_SECRET_KEY;

    if (!configuredSecret || !adminSecret || adminSecret !== configuredSecret) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Invalid or missing administrative provisioning key.'
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      businessVerificationStatus: 'verified',
      accountStatus: 'active'
    });

    const token = generateToken(admin);

    res.status(201).json({
      success: true,
      message: 'Admin account provisioned successfully.',
      data: {
        user: admin.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};
