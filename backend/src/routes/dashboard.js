import { Router } from 'express';
import * as controller from '../controllers/dashboard.js';
import { allowRoles } from '../middleware/auth.js';
const router = Router();
router.get('/', allowRoles('admin', 'project_manager'), controller.handleGetRoot);
export default router;
