/**
 * 404 Not Found Middleware
 * Intercepts requests that did not match any registered routes.
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
