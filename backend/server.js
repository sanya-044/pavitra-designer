import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';

const PORT = process.env.PORT || 5000;

let server;

// Connect to MongoDB Atlas first, then start listening
const startServer = async () => {
  try {
    console.log('[Server] Connecting to MongoDB Atlas...');
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`[Server] Pavitra B2B API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error(`[Server] Startup failed: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown handling
const shutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
