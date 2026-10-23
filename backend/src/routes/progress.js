import { Router } from 'express';
import * as controller from '../controllers/progress.js';
import { allowRoles } from '../middleware/auth.js';
const router = Router();
router.post('/', allowRoles('worker'), controller.handlePostRoot);
router.get('/', controller.handleGetRoot);
router.patch('/:updateId/review', allowRoles('admin', 'project_manager'), controller.handlePatchReview);
export default router;
