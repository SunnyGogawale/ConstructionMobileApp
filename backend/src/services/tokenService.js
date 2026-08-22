const jwt = require('jsonwebtoken');
const {jwtSecret, jwtExpiresIn} = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    {
      role: user.role,
      mobileNumber: user.mobileNumber,
    },
    jwtSecret,
    {
      subject: String(user._id),
      expiresIn: jwtExpiresIn,
    }
  );
}

module.exports = {
  signAccessToken,
};
