import { Router } from 'express';
import * as controller from '../controllers/users.js';
import rateLimit from 'express-rate-limit';
import { allowRoles } from '../middleware/auth.js';
const router = Router();
const passwordResetRequestLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});
router.get('/project-managers', allowRoles('admin'), controller.handleGetProjectManagers);
router.get('/:id/activity/export', allowRoles('admin', 'project_manager'), controller.handleGetActivityExport);
router.get('/:id/activity', allowRoles('admin', 'project_manager'), controller.handleGetActivity);
router.get('/', allowRoles('admin', 'project_manager'), controller.handleGetRoot);
router.post('/', allowRoles('admin', 'project_manager'), controller.handlePostRoot);
router.post('/:id/password-reset', allowRoles('admin', 'project_manager'), passwordResetRequestLimit, controller.handlePostPasswordReset);
router.post('/:id/password', allowRoles('admin', 'project_manager'), passwordResetRequestLimit, controller.handlePostPassword);
router.patch('/:id', allowRoles('admin', 'project_manager'), controller.handlePatchRoot);
router.delete('/:id', allowRoles('admin'), controller.handleDeleteRoot);
export default router;
