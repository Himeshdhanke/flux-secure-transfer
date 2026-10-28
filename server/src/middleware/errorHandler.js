const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const config = require('../config/env');

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred.';
  let details = err.details || null;

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    code = 'UPLOAD_ERROR';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = `File exceeds maximum allowed upload size (${Math.round(config.maxUploadSizeBytes / (1024 * 1024))}MB).`;
    }
  }

  // Handle CastError from Mongoose (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_IDENTIFIER';
    message = 'Invalid resource identifier format.';
  }

  // Handle duplicate key error from MongoDB
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'A resource with this key already exists.';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}: ${message}`, {
      stack: err.stack,
      ip: req.ip,
      statusCode,
    });
  } else {
    logger.warn(`[CLIENT ERROR] ${req.method} ${req.originalUrl}: ${message}`, {
      code,
      statusCode,
      ip: req.ip,
    });
  }

  // Return clean, structured error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      details,
      ...(config.env === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
    },
  });
}

module.exports = errorHandler;
