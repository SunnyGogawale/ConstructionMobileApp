import { access } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { findStoredUpload } from '../services/uploadStorage.js';
import { uploadDirectory } from '../services/uploadDirectory.js';

const uploadedImagePattern = /^\/uploads\/(?:(?:StartProject|EndProject|Daily-Attendance|Check-In|Check-out)\/[a-z\d-]{1,180}-\d{8}_\d{6}(?:-[a-f\d]{8})?\.(?:jpe?g|png|webp|heic)|(?:[a-z\d-]{1,180}\/)?[0-9a-f-]{36}\.(?:jpe?g|png|webp|heic))$/i;
export function uploadedImageFilename(imageUrl) {
  try {
    const parsed = new URL(imageUrl);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.search || parsed.hash || !uploadedImagePattern.test(parsed.pathname)) return null;
    return parsed.pathname.slice('/uploads/'.length);
  } catch {
    return null;
  }
}

export async function isUploadedImage(imageUrl) {
  const filename = uploadedImageFilename(imageUrl);
  if (!filename) return false;
  const filePath = path.resolve(uploadDirectory, filename);
  const relativePath = path.relative(uploadDirectory, filePath);
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) return false;
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      if (mongoose.connection.readyState !== 1) return false;
      return Boolean(await findStoredUpload(filename));
    }
    throw error;
  }
}
