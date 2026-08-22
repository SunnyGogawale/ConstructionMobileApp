const path = require('path');
const dotenv = require('dotenv');

dotenv.config({path: path.resolve(__dirname, '../../.env')});

const requiredVariables = ['MONGODB_URI', 'JWT_SECRET'];

requiredVariables.forEach(variable => {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
});

module.exports = {
  port: Number(process.env.PORT || 5000),
  host: process.env.HOST,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  adminSeed: {
    name: process.env.ADMIN_NAME || 'System Admin',
    mobileNumber: process.env.ADMIN_MOBILE || '9999999999',
    email: process.env.ADMIN_EMAIL || 'admin@buildflow.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  },
};
