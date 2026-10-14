/**
 * Centralized Error Handling Middleware
 * Formats errors into standard JSON contract.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  const response = {
    success: false,
    message: err.message || 'Internal Server Error'
  };

  // Include stack trace only in development mode
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
