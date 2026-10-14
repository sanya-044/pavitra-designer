import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token containing user id, email, and role.
 */
export const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables.');
  }

  const payload = {
    id: user._id || user.id,
    email: user.email,
    role: user.role
  };

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify and decode a JWT token.
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables.');
  }

  return jwt.verify(token, secret);
};
