import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { authenticate } from '../src/middleware/auth.js';
import Activity from '../src/models/Activity.js';
import Project from '../src/models/Project.js';
import Subtask from '../src/models/Subtask.js';
import User from '../src/models/User.js';
import WorkerImageUpload from '../src/models/WorkerImageUpload.js';
import { uploadDirectory } from '../src/controllers/uploads.js';
import { isUploadedImage } from '../src/domain/uploadedImage.js';
import uploadRoutes from '../src/routes/uploads.js';

const pngImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jP2cAAAAASUVORK5CYII=', 'base64');
const jpegImage = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0xff, 0xd9]);
const webpImage = Buffer.alloc(30);
webpImage.write('RIFF', 0);
webpImage.writeUInt32LE(22, 4);
webpImage.write('WEBPVP8X', 8);
webpImage.writeUInt32LE(10, 16);

function createUploadServer(t) {
  const app = express();
  app.use('/api/uploads', authenticate, uploadRoutes);
  app.use('/uploads', express.static(uploadDirectory));
  const server = app.listen(0);
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
  });
  return new Promise(resolve => server.once('listening', () => resolve(server)));
}

function workerAuthorization(workerId) {
  const token = jwt.sign({ role: 'worker' }, process.env.JWT_SECRET, {
    subject: String(workerId),
    issuer: 'buildflow-api',
  });
  return `Bearer ${token}`;
}

test('stores worker task check-in selfies in StartProject and rejects invalid image bytes', async t => {
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'worker-checkin-upload-test-secret-at-least-32-chars';
  t.after(() => {
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
  });

  const workerId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  const taskId = new mongoose.Types.ObjectId();
  const savedImages = new Map();
  const imageKey = image => `${image.worker}:${image.purpose}:${image.project}:${image.sha256}`;
  let requestedSubtaskFilter;
  t.mock.method(Subtask, 'findOne', filter => {
    requestedSubtaskFilter = filter;
    return {
      populate: async () => ({ project: { _id: projectId, name: 'Skyline Tower' } }),
    };
  });
  t.mock.method(User, 'findById', () => ({
    select: async () => ({ name: 'Alex Worker' }),
  }));
  t.mock.method(Activity, 'create', async () => ({}));
  t.mock.method(WorkerImageUpload, 'findOne', filter => ({
    select: async () => savedImages.get(imageKey(filter)) || null,
  }));
  t.mock.method(WorkerImageUpload, 'create', async image => {
    savedImages.set(imageKey(image), { ...image, _id: new mongoose.Types.ObjectId() });
  });
  t.mock.method(WorkerImageUpload, 'deleteOne', async filter => {
    for (const [key, image] of savedImages) if (String(image._id) === String(filter._id)) savedImages.delete(key);
  });

  const server = await createUploadServer(t);
  let folderPath;
  t.after(async () => {
    if (folderPath) await fs.rm(folderPath, { recursive: true, force: true });
  });

  const form = new FormData();
  form.append('imagePurpose', 'check-in');
  form.append('taskId', String(taskId));
  form.append('file', new Blob([pngImage], { type: 'image/png' }), 'selfie.png');
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/uploads`, {
    method: 'POST',
    headers: { authorization: workerAuthorization(workerId) },
    body: form,
  });
  assert.equal(response.status, 201);
  assert.equal(String(requestedSubtaskFilter.assignedWorker), String(workerId));

  const { url } = await response.json();
  const [, , category, filename] = new URL(url).pathname.split('/').map(decodeURIComponent);
  assert.equal(category, 'StartProject');
  assert.match(filename, /^Skyline-Tower-Alex-Worker-\d{8}_\d{6}\.png$/);
  folderPath = path.join(uploadDirectory, category);
  assert.deepEqual(await fs.readFile(path.join(folderPath, filename)), pngImage);
  assert.equal(await isUploadedImage(url), true);

  const retryForm = new FormData();
  retryForm.append('imagePurpose', 'check-in');
  retryForm.append('taskId', String(taskId));
  retryForm.append('file', new Blob([pngImage], { type: 'image/png' }), 'selfie.png');
  const retryResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/uploads`, {
    method: 'POST',
    headers: { authorization: workerAuthorization(workerId) },
    body: retryForm,
  });
  assert.equal(retryResponse.status, 201);
  assert.equal((await retryResponse.json()).url, url);

  const imageResponse = await fetch(url);
  assert.equal(imageResponse.status, 200);
  assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), pngImage);

  const mismatchedExtensionForm = new FormData();
  mismatchedExtensionForm.append('imagePurpose', 'check-in');
  mismatchedExtensionForm.append('taskId', String(taskId));
  mismatchedExtensionForm.append('file', new Blob([pngImage], { type: 'image/png' }), 'selfie.jpg');
  const mismatchedExtensionResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/uploads`, {
    method: 'POST',
    headers: { authorization: workerAuthorization(workerId) },
    body: mismatchedExtensionForm,
  });
  assert.equal(mismatchedExtensionResponse.status, 400);
  assert.match((await mismatchedExtensionResponse.json()).message, /extension does not match/i);

  const invalidForm = new FormData();
  invalidForm.append('imagePurpose', 'check-in');
  invalidForm.append('taskId', String(taskId));
  invalidForm.append('file', new Blob(['not an image'], { type: 'image/png' }), 'selfie.png');
  const invalidResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/uploads`, {
    method: 'POST',
    headers: { authorization: workerAuthorization(workerId) },
    body: invalidForm,
  });
  assert.equal(invalidResponse.status, 400);
  assert.match((await invalidResponse.json()).message, /not a valid image/i);
});

test('stores check-out and daily progress images in their required folders with sanitized database names', async t => {
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'worker-attendance-naming-test-secret-at-least-32-chars';
  t.after(() => {
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
  });

  const workerId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-25T09:30:15.000Z') });
  t.after(() => t.mock.timers.reset());
  const savedImages = new Map();
  const imageKey = image => `${image.worker}:${image.purpose}:${image.project}:${image.sha256}`;
  t.mock.method(Project, 'findOne', async filter => {
    assert.equal(String(filter._id), String(projectId));
    return { _id: projectId, assignedWorker: workerId, name: 'Skyline / Tower #2' };
  });
  t.mock.method(User, 'findById', () => ({
    select: async () => ({ name: 'Rahul Sharma (West)' }),
  }));
  t.mock.method(Activity, 'create', async () => ({}));
  t.mock.method(WorkerImageUpload, 'findOne', filter => ({
    select: async () => savedImages.get(imageKey(filter)) || null,
  }));
  t.mock.method(WorkerImageUpload, 'create', async image => {
    savedImages.set(imageKey(image), { ...image, _id: new mongoose.Types.ObjectId() });
  });
  t.mock.method(WorkerImageUpload, 'deleteOne', async filter => {
    for (const [key, image] of savedImages) if (String(image._id) === String(filter._id)) savedImages.delete(key);
  });

  const server = await createUploadServer(t);
  const createdPaths = [];
  t.after(async () => {
    await Promise.all(createdPaths.map(filePath => fs.rm(filePath, { force: true })));
  });

  const upload = async (imagePurpose, filename, image = jpegImage, mimetype = 'image/jpeg') => {
    const form = new FormData();
    form.append('imagePurpose', imagePurpose);
    form.append('projectId', String(projectId));
    form.append('file', new Blob([image], { type: mimetype }), filename);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/uploads`, {
      method: 'POST',
      headers: { authorization: workerAuthorization(workerId) },
      body: form,
    });
    assert.equal(response.status, 201);
    const { url } = await response.json();
    const [, , category, storedFilename] = new URL(url).pathname.split('/').map(decodeURIComponent);
    createdPaths.push(path.join(uploadDirectory, category, storedFilename));
    return { category, filename: storedFilename, url };
  };

  const checkOut = await upload('check-out', 'original.jpeg');
  const collidingCheckOut = await upload('check-out', 'different.jpeg', Buffer.from([0xff, 0xd8, 0xff, 0x01, 0xff, 0xd9]));
  const dailyAttendance = await upload('daily-attendance', 'original.jpg');
  const webpProgress = await upload('daily-attendance', 'progress.webp', webpImage, 'image/webp');

  assert.equal(checkOut.category, 'EndProject');
  assert.equal(checkOut.filename, 'Skyline-Tower-2-Rahul-Sharma-West-20261025_093015.jpeg');
  assert.equal(collidingCheckOut.category, 'EndProject');
  assert.match(collidingCheckOut.filename, /^Skyline-Tower-2-Rahul-Sharma-West-20261025_093015-[a-f\d]{8}\.jpeg$/);
  assert.equal(dailyAttendance.category, 'Daily-Attendance');
  assert.match(dailyAttendance.filename, /^Rahul-Sharma-West-\d{8}_\d{6}\.jpg$/);
  assert.equal(webpProgress.category, 'Daily-Attendance');
  assert.match(webpProgress.filename, /^Rahul-Sharma-West-\d{8}_\d{6}\.webp$/);
  assert.equal(await isUploadedImage(checkOut.url), true);
  assert.equal(await isUploadedImage(dailyAttendance.url), true);
});
