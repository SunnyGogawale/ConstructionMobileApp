const express = require('express');
const {loginValidation, registerValidation} = require('../validations/authValidation');
const {login, register, me} = require('../controllers/authController');
const {protect} = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, me);

module.exports = router;
