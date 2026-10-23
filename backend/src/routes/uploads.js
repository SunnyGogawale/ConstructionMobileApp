import { Router } from 'express';
import { allowedTypes, handlePostRoot, storage } from '../controllers/uploads.js';
import multer from 'multer';
import { allowRoles } from '../middleware/auth.js';
const router = Router();
const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, callback) => callback(allowedTypes.has(file.mimetype) ? null : new Error('Only image uploads are accepted.'), allowedTypes.has(file.mimetype))
});
router.post('/', allowRoles('worker', 'project_manager', 'admin'), upload.single('file'), handlePostRoot);
export default router;
