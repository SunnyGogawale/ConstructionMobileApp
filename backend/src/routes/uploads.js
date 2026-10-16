import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { allowRoles } from '../middleware/auth.js';

const router = Router();
const uploadDirectory = path.resolve('uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(allowedTypes.has(file.mimetype) ? null : new Error('Only image uploads are accepted.'), allowedTypes.has(file.mimetype)),
});

router.post('/', allowRoles('worker', 'project_manager', 'admin'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Select an image to upload.' });
  return res.status(201).json({ url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` });
});

export default router;
