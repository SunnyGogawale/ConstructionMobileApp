import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import Attendance from '../src/models/Attendance.js';
import Project from '../src/models/Project.js';
import Subtask from '../src/models/Subtask.js';
import ProgressUpdate from '../src/models/ProgressUpdate.js';
import { uploadDirectory } from '../src/controllers/uploads.js';
import { handlePostCheckIn, handlePostCheckOut } from '../src/controllers/attendance.js';

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function createStoredImage(t) {
  const filename = `${crypto.randomUUID()}.jpg`;
  const filePath = path.join(uploadDirectory, filename);
  await fs.mkdir(uploadDirectory, { recursive: true });
  await fs.writeFile(filePath, 'attendance-session-test-image');
  t.after(() => fs.rm(filePath, { force: true }));
  return `http://localhost/uploads/${filename}`;
}

test('check-in from a second entry point reuses the active project attendance', async t => {
  const workerId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  const existingShift = {
    _id: new mongoose.Types.ObjectId(),
    project: projectId,
    status: 'active',
  };
  const selfieUrl = await createStoredImage(t);
  t.mock.method(Project, 'findOne', async () => ({
    _id: projectId,
    assignedWorker: workerId,
    status: 'Assigned',
    timeZone: 'UTC',
    location: { latitude: 37.7895, longitude: -122.4012, radiusMetres: 100 },
  }));
  t.mock.method(Attendance, 'findOne', async () => existingShift);
  const create = t.mock.method(Attendance, 'create', async () => {
    assert.fail('A second entry point must not create another attendance record.');
  });
  const response = createResponse();

  await handlePostCheckIn({
    user: { id: String(workerId), role: 'worker' },
    body: {
      projectId: String(projectId),
      selfieUrl,
      latitude: 37.7895,
      longitude: -122.4012,
      accuracy: 10,
    },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.attendance, existingShift);
  assert.equal(create.mock.callCount(), 0);
});

test('project check-out is blocked while a task linked to the attendance is in progress', async t => {
  const workerId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  const shiftId = new mongoose.Types.ObjectId();
  const imageUrl = await createStoredImage(t);
  t.mock.method(Project, 'findOne', async () => ({
    _id: projectId,
    assignedWorker: workerId,
    timeZone: 'UTC',
    location: { latitude: 37.7895, longitude: -122.4012, radiusMetres: 100 },
    progress: 10,
  }));
  t.mock.method(Attendance, 'findOne', () => ({
    select: () => Promise.resolve({
      _id: shiftId,
      status: 'active',
      breakStartedAt: null,
      breakEndedAt: null,
      breakAutoEnded: false,
    }),
  }));
  t.mock.method(Subtask, 'exists', async filter => {
    assert.equal(String(filter.project), String(projectId));
    assert.equal(String(filter.assignedWorker), String(workerId));
    assert.equal(String(filter.taskStartAttendance), String(shiftId));
    assert.equal(filter.status, 'In Progress');
    return { _id: new mongoose.Types.ObjectId() };
  });
  const update = t.mock.method(Attendance, 'findOneAndUpdate', async () => {
    assert.fail('Attendance must not be closed while a linked task is active.');
  });
  const response = createResponse();

  await handlePostCheckOut({
    user: { id: String(workerId), role: 'worker' },
    body: {
      projectId: String(projectId),
      selfieUrl: imageUrl,
      photoUrls: [imageUrl],
      workDescription: 'Completed the project update for this session.',
      latitude: 37.7895,
      longitude: -122.4012,
      accuracy: 10,
    },
  }, response);

  assert.equal(response.statusCode, 409);
  assert.match(response.body.message, /in-progress project tasks/i);
  assert.equal(update.mock.callCount(), 0);
});

test('a retried project check-out returns the existing attendance and progress records', async t => {
  const workerId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  const attendanceId = new mongoose.Types.ObjectId();
  const imageUrl = await createStoredImage(t);
  const completedShift = {
    _id: attendanceId,
    status: 'completed',
    workDescription: 'Completed the site preparation work.',
    checkOutSelfieUrl: imageUrl,
    workPhotoUrls: [imageUrl],
  };
  const update = { _id: new mongoose.Types.ObjectId(), attendance: attendanceId };
  t.mock.method(Project, 'findOne', async () => ({
    _id: projectId,
    assignedWorker: workerId,
    timeZone: 'UTC',
    location: { latitude: 37.7895, longitude: -122.4012, radiusMetres: 100 },
  }));
  t.mock.method(Attendance, 'findOne', filter => filter.status === 'completed'
    ? { sort: async () => completedShift }
    : { select: () => Promise.resolve(null) });
  t.mock.method(ProgressUpdate, 'findOne', async filter => {
    assert.equal(String(filter.attendance), String(attendanceId));
    return update;
  });
  const create = t.mock.method(Attendance, 'findOneAndUpdate', async () => {
    assert.fail('A retried check-out must not modify the completed attendance record.');
  });

  const response = createResponse();
  await handlePostCheckOut({
    user: { id: String(workerId), role: 'worker' },
    body: {
      projectId: String(projectId),
      selfieUrl: imageUrl,
      photoUrls: [imageUrl],
      workDescription: completedShift.workDescription,
      latitude: 37.7895,
      longitude: -122.4012,
      accuracy: 10,
    },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.attendance, completedShift);
  assert.equal(response.body.update, update);
  assert.equal(create.mock.callCount(), 0);
});
