import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    API server health status check
 * @access  Public
 */
router.get('/', (req, res) => {
  // Check MongoDB connection state: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbState = mongoose.connection.readyState;
  const databaseStatus = dbStatusMap[dbState] || 'unknown';

  res.status(200).json({
    success: true,
    message: 'Pavitra B2B API is running',
    status: 'active',
    timestamp: new Date().toISOString(),
    database: databaseStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;
