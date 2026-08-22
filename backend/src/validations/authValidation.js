const {body, oneOf} = require('express-validator');
const ROLES = require('../constants/roles');

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('mobileNumber')
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Valid mobile number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({min: 8})
    .withMessage('Password must be at least 8 characters long'),
  body('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage('Invalid role specified'),
];

const loginValidation = [
  oneOf(
    [
      body('mobileNumber')
        .trim()
        .matches(/^[0-9]{10,15}$/)
        .withMessage('Valid mobile number is required'),
      body('email').trim().isEmail().withMessage('Valid email is required'),
    ],
    'Mobile number or email is required'
  ),
  body('password')
    .isLength({min: 8})
    .withMessage('Password must be at least 8 characters long'),
];

module.exports = {
  registerValidation,
  loginValidation,
};
