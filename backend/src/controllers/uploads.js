import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
const uploadDirectory = path.resolve('uploads');
fs.mkdirSync(uploadDirectory, {
  recursive: true
});
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});
export { allowedTypes, storage };
export const handlePostRoot = (req, res) => {
  if (!req.file) return res.status(400).json({
    message: 'Select an image to upload.'
  });
  return res.status(201).json({
    url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
  });
};
