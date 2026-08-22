const {validationResult} = require('express-validator');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/apiResponse');
const User = require('../models/User');
const {signAccessToken} = require('../services/tokenService');

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
  }

  const {name, mobileNumber, email, password, role} = req.body;

  const existingUser = await User.findOne({
    $or: [{mobileNumber}, ...(email ? [{email}] : [])],
  });

  if (existingUser) {
    throw new AppError('User already exists', 409, 'USER_EXISTS');
  }

  const user = await User.create({
    name,
    mobileNumber,
    email,
    password,
    role,
  });

  const token = signAccessToken(user);

  return sendResponse(res, {
    statusCode: 201,
    message: 'User registered successfully',
    data: {
      user: user.toSafeJSON(),
      token,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
  }

  const {mobileNumber, email, password} = req.body;

  if (!mobileNumber && !email) {
    throw new AppError(
      'Mobile number or email is required',
      400,
      'IDENTIFIER_REQUIRED'
    );
  }

  const query = mobileNumber ? {mobileNumber} : {email};

  const user = await User.findOne(query).select('+password');

  if (!user || !user.active) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const token = signAccessToken(user);

  return sendResponse(res, {
    statusCode: 200,
    message: 'Login successful',
    data: {
      user: user.toSafeJSON(),
      token,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  return sendResponse(res, {
    statusCode: 200,
    message: 'Profile fetched successfully',
    data: {
      user: req.user.toSafeJSON(),
    },
  });
});

module.exports = {
  register,
  login,
  me,
};
