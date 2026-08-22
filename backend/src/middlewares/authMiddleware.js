const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const {jwtSecret} = require('../config/env');
const User = require('../models/User');
const ROLES = require('../constants/roles');

function extractToken(req) {
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    return header.split(' ')[1];
  }

  return null;
}

async function protect(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.sub).select('-password');

    if (!user) {
      return next(new AppError('The user no longer exists', 401, 'UNAUTHORIZED'));
    }

    if (!user.active) {
      return next(new AppError('Your account is inactive', 403, 'ACCOUNT_INACTIVE'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401, 'UNAUTHORIZED'));
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to access this resource', 403, 'FORBIDDEN'));
    }

    next();
  };
}

module.exports = {
  protect,
  authorizeRoles,
};
