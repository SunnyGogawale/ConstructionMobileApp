const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  const response = {
    success: false,
    message: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_SERVER_ERROR',
  };

  if (process.env.NODE_ENV !== 'production' || !isOperational) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
