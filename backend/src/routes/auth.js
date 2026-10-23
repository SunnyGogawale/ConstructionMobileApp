import { Router } from 'express';
import * as controller from '../controllers/auth.js';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
const router = Router();
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});
const registerLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});
const passwordResetLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});
router.post(['/register', '/signup'], registerLimit, controller.handlePostRegisterOrSignup);
router.post(['/login', '/signin'], loginLimit, controller.handlePostLoginOrSignin);
router.post('/logout', authenticate, controller.handlePostLogout);
router.post('/password-reset', passwordResetLimit, controller.handlePostPasswordReset);
router.get('/me', authenticate, controller.handleGetMe);
export default router;
