import { Router } from 'express';
import * as controller from '../controllers/notifications.js';
const router = Router();
router.get('/', controller.handleGetRoot);
router.patch('/read-all', controller.handlePatchReadAll);
router.patch('/:id/read', controller.handlePatchRead);
export default router;
