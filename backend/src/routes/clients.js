import { Router } from 'express';
import * as controller from '../controllers/clients.js';
import { allowRoles } from '../middleware/auth.js';
const router = Router();
router.get('/', allowRoles('admin', 'project_manager'), controller.handleGetRoot);
router.post('/', allowRoles('admin', 'project_manager'), controller.handlePostRoot);
router.patch('/:id', allowRoles('admin', 'project_manager'), controller.handlePatchRoot);
router.delete('/:id', allowRoles('admin', 'project_manager'), controller.handleDeleteRoot);
export default router;
