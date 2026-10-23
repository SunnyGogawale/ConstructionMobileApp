import { Router } from 'express';
import * as controller from '../controllers/settings.js';
import { allowRoles } from '../middleware/auth.js';
const router = Router();
router.get('/', allowRoles('admin'), controller.handleGetRoot);
router.put('/:key', allowRoles('admin'), controller.handlePutRoot);
export default router;
