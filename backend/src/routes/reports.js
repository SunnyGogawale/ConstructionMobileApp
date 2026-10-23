import { Router } from 'express';
import * as controller from '../controllers/reports.js';
import { allowRoles } from '../middleware/auth.js';
const router = Router();
router.get('/:type', allowRoles('admin', 'project_manager'), controller.handleGetRoot);
export default router;
