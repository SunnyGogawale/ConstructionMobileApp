const express = require('express');
const {protect, authorizeRoles} = require('../middlewares/authMiddleware');
const ROLES = require('../constants/roles');
const sendResponse = require('../utils/apiResponse');

const router = express.Router();

router.get('/dashboard', protect, authorizeRoles(ROLES.ADMIN), (req, res) => {
  return sendResponse(res, {
    statusCode: 200,
    message: 'Admin dashboard access granted',
    data: {
      role: req.user.role,
    },
  });
});

router.get(
  '/project-overview',
  protect,
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  (req, res) => {
    return sendResponse(res, {
      statusCode: 200,
      message: 'Project overview access granted',
      data: {
        role: req.user.role,
      },
    });
  }
);

router.get('/work-items', protect, authorizeRoles(ROLES.WORKER), (req, res) => {
  return sendResponse(res, {
    statusCode: 200,
    message: 'Worker work-items access granted',
    data: {
      role: req.user.role,
    },
  });
});

module.exports = router;
