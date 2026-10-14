import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas using Mongoose.
 * Reads connection string from process.env.MONGO_URI.
 */
export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error('MONGO_URI is not defined in environment variables.');
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};

/**
 * Gracefully disconnect from MongoDB.
 */
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed successfully.');
  } catch (error) {
    console.error(`[MongoDB] Error closing connection: ${error.message}`);
  }
};
