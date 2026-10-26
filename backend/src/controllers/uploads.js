import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import mongoose from 'mongoose';
import Subtask from '../models/Subtask.js';
import User from '../models/User.js';
import WorkerImageUpload from '../models/WorkerImageUpload.js';
import { findStoredUpload, getUploadBucket } from '../services/uploadStorage.js';
import { uploadDirectory } from '../services/uploadDirectory.js';
import { findWorkerAssignedProject } from '../domain/workerProject.js';

export { uploadDirectory };
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
const imageCategory = new Map([
  ['check-in', 'StartProject'],
  ['check-out', 'EndProject'],
  ['daily-attendance', 'Daily-Attendance']
]);
const compatibleExtensions = new Map([
  ['image/jpeg', new Set(['.jpg', '.jpeg'])],
  ['image/png', new Set(['.png'])],
  ['image/webp', new Set(['.webp'])],
  ['image/heic', new Set(['.heic'])]
]);

function safeFilenamePart(value) {
  const safe = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return safe || 'Unknown';
}

function formatUploadDate(date) {
  const timeZone = process.env.UPLOAD_TIME_ZONE || 'UTC';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}_${values.hour}${values.minute}${values.second}`;
}

function getOriginalExtension(file) {
  const originalExtension = path.extname(file.originalname || '').toLowerCase();
  if (!compatibleExtensions.get(file.mimetype)?.has(originalExtension)) {
    const error = new Error('The image file extension does not match its image type. Choose a JPEG, PNG, WebP, or HEIC image and retry.');
    error.status = 400;
    throw error;
  }
  return originalExtension;
}

async function resolveImageStorage(req, extension) {
  const purpose = req.body?.imagePurpose;
  const category = imageCategory.get(purpose);
  if (!category) return null;
  if (req.user?.role !== 'worker') {
    const error = new Error('Only workers may upload attendance images.');
    error.status = 403;
    throw error;
  }

  let projectName;
  let projectId;
  if (req.body.taskId) {
    if (!mongoose.isValidObjectId(req.body.taskId)) {
      const error = new Error('Task identifier is invalid.');
      error.status = 400;
      throw error;
    }
    const subtask = await Subtask.findOne({
      _id: req.body.taskId,
      assignedWorker: req.user.id
    }).populate('project', '_id name');
    if (!subtask || !subtask.project) {
      const error = new Error('Assigned task not found for this image upload.');
      error.status = 404;
      throw error;
    }
    projectName = subtask.project.name;
    projectId = subtask.project._id;
  } else if (req.body.projectId) {
    const project = await findWorkerAssignedProject(req.body.projectId, req.user.id);
    if (!project) {
      const error = new Error('Assigned project not found for this image upload.');
      error.status = 404;
      throw error;
    }
    projectName = project.name;
    projectId = project._id;
  } else if (purpose !== 'daily-attendance') {
    const error = new Error('An assigned task or project is required for attendance image uploads.');
    error.status = 400;
    throw error;
  }
  const worker = await User.findById(req.user.id).select('name');
  if (!worker) {
    const error = new Error('Worker account not found for this image upload.');
    error.status = 404;
    throw error;
  }
  req.workerImageContext = { worker: worker._id, purpose, project: projectId || null };
  const filenamePrefix = purpose === 'daily-attendance'
    ? safeFilenamePart(worker.name)
    : `${safeFilenamePart(projectName)}-${safeFilenamePart(worker.name)}`;
  const timestamp = formatUploadDate(new Date());
  const filename = `${filenamePrefix}-${timestamp}${extension}`;
  return path.join(uploadDirectory, category, filename);
}

function hasValidImageContent(content, trailingContent, mimetype, size) {
  if (mimetype === 'image/jpeg') {
    return size >= 4 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff
      && trailingContent[trailingContent.length - 2] === 0xff && trailingContent[trailingContent.length - 1] === 0xd9;
  }
  if (mimetype === 'image/png') {
    return size >= 45
      && content.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      && content.readUInt32BE(8) === 13
      && content.toString('ascii', 12, 16) === 'IHDR'
      && content.readUInt32BE(16) > 0
      && content.readUInt32BE(20) > 0
      && trailingContent.subarray(0, 4).equals(Buffer.alloc(4))
      && trailingContent.toString('ascii', 4, 8) === 'IEND';
  }
  if (mimetype === 'image/webp') {
    return size >= 30
      && content.toString('ascii', 0, 4) === 'RIFF'
      && content.readUInt32LE(4) + 8 === size
      && content.toString('ascii', 8, 12) === 'WEBP'
      && ['VP8 ', 'VP8L', 'VP8X'].includes(content.toString('ascii', 12, 16))
      && content.readUInt32LE(16) + 20 <= size;
  }
  if (mimetype === 'image/heic') {
    return size >= 16
      && content.toString('ascii', 4, 8) === 'ftyp'
      && ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(content.toString('ascii', 8, 12));
  }
  return false;
}

async function hashFile(filePath) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

function storedImagePath(relativePath) {
  if (typeof relativePath !== 'string' || !relativePath) return null;
  const absolutePath = path.resolve(uploadDirectory, relativePath);
  const relative = path.relative(uploadDirectory, absolutePath);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative) ? absolutePath : null;
}

async function findReusableImage(req, sha256) {
  const context = req.workerImageContext;
  if (!context) return null;
  const record = await WorkerImageUpload.findOne({ ...context, sha256 }).select('relativePath');
  if (!record) return null;
  const filePath = storedImagePath(record.relativePath);
  if (!filePath) {
    const error = new Error('The saved image reference is invalid. Contact support before retrying this upload.');
    error.status = 500;
    throw error;
  }
  try {
    await fs.access(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await WorkerImageUpload.deleteOne({ _id: record._id });
    return null;
  }
  req.uploadRelativePath = record.relativePath;
  return {
    destination: path.dirname(filePath),
    filename: path.basename(filePath),
    path: filePath
  };
}

function storeInGridFs(file, sourcePath, callback) {
  const filename = `${crypto.randomUUID()}${getOriginalExtension(file)}`;
  const uploadStream = getUploadBucket().openUploadStream(filename, {
    metadata: { contentType: file.mimetype }
  });
  let settled = false;
  const finish = (error, info) => {
    if (settled) return;
    settled = true;
    callback(error, info);
  };
  const source = createReadStream(sourcePath);
  const fail = error => {
    if (settled) return;
    source.destroy();
    uploadStream.destroy();
    Promise.resolve().then(() => uploadStream.id ? getUploadBucket().delete(uploadStream.id) : null)
      .catch(cleanupError => console.error('Failed to remove incomplete GridFS image upload:', cleanupError))
      .finally(() => finish(error));
  };
  uploadStream.once('error', fail);
  uploadStream.once('finish', () => finish(null, {
    id: uploadStream.id,
    filename,
    size: uploadStream.length
  }));
  source.once('error', fail);
  source.pipe(uploadStream);
}

async function storeValidatedImage(req, file, destination, callback) {
  const stagingDirectory = destination ? path.dirname(destination) : path.join(uploadDirectory, '.staging');
  await fs.mkdir(stagingDirectory, { recursive: true });
  const temporaryPath = path.join(stagingDirectory, `.upload-${crypto.randomUUID()}.tmp`);
  let settled = false;
  let size = 0;
  file.stream.on('data', chunk => {
    size += chunk.length;
  });
  const finish = async (error, info) => {
    if (settled) return;
    settled = true;
    if (error) {
      try {
        await fs.unlink(temporaryPath);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') console.error('Failed to remove incomplete image upload:', cleanupError);
      }
      callback(error);
      return;
    }
    callback(null, info);
  };
  const fail = async (error, output) => {
    output?.destroy();
    finish(error);
  };
  const output = createWriteStream(temporaryPath, { flags: 'wx' });
  output.once('error', error => fail(error, output));
  file.stream.once('error', error => fail(error, output));
  output.once('finish', async () => {
    try {
      const handle = await fs.open(temporaryPath, 'r');
      const content = Buffer.alloc(32);
      const trailingContent = Buffer.alloc(Math.min(size, 12));
      let bytesRead;
      try {
        ({ bytesRead } = await handle.read(content, 0, content.length, 0));
        await handle.read(trailingContent, 0, trailingContent.length, size - trailingContent.length);
      } finally {
        await handle.close();
      }
      if (!hasValidImageContent(content.subarray(0, bytesRead), trailingContent, file.mimetype, size)) {
        const error = new Error('The uploaded file is not a valid image matching its declared type.');
        error.status = 400;
        await finish(error);
        return;
      }
      if (destination) {
        const context = req.workerImageContext;
        const sha256 = context ? await hashFile(temporaryPath) : null;
        const reusableImage = sha256 ? await findReusableImage(req, sha256) : null;
        if (reusableImage) {
          await fs.unlink(temporaryPath);
          await finish(null, { ...reusableImage, size });
          return;
        }
        const extension = path.extname(destination);
        let filePath = destination;
        for (let attempt = 0; attempt < 20; attempt += 1) {
          try {
            await fs.link(temporaryPath, filePath);
            const relativePath = path.relative(uploadDirectory, filePath).split(path.sep).join('/');
            if (context) {
              try {
                await WorkerImageUpload.create({ ...context, sha256, relativePath });
              } catch (error) {
                if (error.code === 11000) {
                  const concurrentImage = await findReusableImage(req, sha256);
                  if (concurrentImage) {
                    await fs.unlink(filePath);
                    await fs.unlink(temporaryPath);
                    await finish(null, { ...concurrentImage, size });
                    return;
                  }
                }
                await fs.unlink(filePath);
                throw error;
              }
            }
            req.uploadRelativePath = relativePath;
            try {
              await fs.unlink(temporaryPath);
            } catch (cleanupError) {
              console.error('Failed to remove staged image upload:', cleanupError);
            }
            await finish(null, {
              destination: path.dirname(filePath),
              filename: path.basename(filePath),
              path: filePath,
              size
            });
            return;
          } catch (error) {
            if (error.code !== 'EEXIST') throw error;
            const filename = `${path.basename(destination, extension)}-${crypto.randomBytes(4).toString('hex')}${extension}`;
            filePath = path.join(path.dirname(destination), filename);
          }
        }
        throw new Error('Could not generate a unique image filename after repeated collisions.');
      }
      storeInGridFs(file, temporaryPath, async (error, info) => {
        try {
          await fs.unlink(temporaryPath);
        } catch (cleanupError) {
          if (cleanupError.code !== 'ENOENT') console.error('Failed to remove staged image upload:', cleanupError);
        }
        await finish(error, info);
      });
    } catch (error) {
      await finish(error);
    }
  });
  file.stream.pipe(output);
}

const storage = {
  _handleFile(req, file, callback) {
    Promise.resolve().then(() => getOriginalExtension(file)).then(extension => {
      return resolveImageStorage(req, extension);
    }).then(destination => {
      return storeValidatedImage(req, file, destination, callback);
    }).catch(callback);
  },
  _removeFile(_req, file, callback) {
    if (file.id) {
      getUploadBucket().delete(file.id).then(() => callback(null), callback);
      return;
    }
    fs.unlink(file.path).then(() => callback(null), error => error.code === 'ENOENT' ? callback(null) : callback(error));
  }
};

export { allowedTypes, storage };

export const handleGetImage = async (req, res, next) => {
  try {
    const filePath = path.resolve(uploadDirectory, req.params.filename);
    const relativePath = path.relative(uploadDirectory, filePath);
    if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) return res.status(404).json({
      message: 'Image not found.'
    });
    try {
      await fs.access(filePath);
      return res.sendFile(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const file = await findStoredUpload(req.params.filename);
    if (!file || !allowedTypes.has(file.metadata?.contentType)) return res.status(404).json({
      message: 'Image not found.'
    });
    res.set({
      'Content-Type': file.metadata.contentType,
      'Content-Length': String(file.length),
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff'
    });
    const downloadStream = getUploadBucket().openDownloadStream(file._id);
    downloadStream.on('error', error => {
      if (res.headersSent) res.destroy(error);
      else next(error);
    });
    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const handlePostRoot = (req, res) => {
  if (!req.file) return res.status(400).json({
    message: 'Select an image to upload.'
  });
  const relativePath = req.uploadRelativePath
    ? req.uploadRelativePath
    : req.file.filename;
  const url = new URL(`/uploads/${relativePath.split('/').map(encodeURIComponent).join('/')}`, `${req.protocol}://${req.get('host')}`);
  return res.status(201).json({
    url: url.toString()
  });
};
