import { error as logError } from '../utils/logger.js';

export const notFoundHandler = (req, res, next) => {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  const details = err.details || null;

  if (status >= 500) {
    logError(err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {})
  });
};
