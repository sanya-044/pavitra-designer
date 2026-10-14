import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * Authentication Middleware:
 * Extracts Bearer token from Authorization header and attaches the user document to req.user.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid format. Please provide a Bearer token.'
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Authentication token has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.'
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.'
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.accountStatus}. Please contact support.`
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Based Authorization Middleware:
 * Restricts access to specified roles.
 * Usage: authorizeRoles('admin', 'seller')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden: Role "${req.user.role}" does not have permission to access this resource.`
      });
    }

    next();
  };
};

/**
 * Business Verification Gate Middleware:
 * Restricts operations requiring verified B2B GSTIN status (e.g. bulk dispatch or wholesale billing).
 */
export const requireBusinessVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  // Admins bypass business verification
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.businessVerificationStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: `Business verification required. Current status: "${req.user.businessVerificationStatus}".`
    });
  }

  next();
};
