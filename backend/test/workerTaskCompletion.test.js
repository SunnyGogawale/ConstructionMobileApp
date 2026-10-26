import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import Attendance from '../src/models/Attendance.js';
import Project from '../src/models/Project.js';
import ProgressUpdate from '../src/models/ProgressUpdate.js';
import Subtask from '../src/models/Subtask.js';
import { handlePatchSubtasks } from '../src/controllers/projects.js';
import { uploadDirectory } from '../src/controllers/uploads.js';

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

test('worker can complete a task with selfie and GPS without work description or progress photos', async t => {
  const workerId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  const subtaskId = new mongoose.Types.ObjectId();
  const attendanceId = new mongoose.Types.ObjectId();
  const selfieFilename = `${crypto.randomUUID()}.jpg`;
  const selfiePath = path.join(uploadDirectory, selfieFilename);
  await fs.mkdir(uploadDirectory, { recursive: true });
  await fs.writeFile(selfiePath, 'task completion selfie');
  t.after(() => fs.rm(selfiePath, { force: true }));

  const project = {
    _id: projectId,
    assignedWorker: workerId,
    status: 'In Progress',
    progress: 25,
    location: { latitude: 37.7895, longitude: -122.4012, radiusMetres: 100 },
  };
  const activeShift = { _id: attendanceId };
  const currentSubtask = {
    _id: subtaskId,
    title: 'Install framing',
    status: 'In Progress',
    taskStartedAt: new Date(),
    taskStartAttendance: attendanceId,
  };
  const completedSubtask = { ...currentSubtask, status: 'Completed' };
  t.mock.method(Project, 'findOne', () => ({
    select: () => Promise.resolve(project),
  }));
  t.mock.method(Subtask, 'findOne', () => ({
    select: () => Promise.resolve(currentSubtask),
  }));
  t.mock.method(Attendance, 'findOne', () => ({
    select: () => Promise.resolve(activeShift),
  }));
  const updateSubtask = t.mock.method(Subtask, 'findOneAndUpdate', () => ({
    populate: async () => completedSubtask,
  }));
  const createProgressUpdate = t.mock.method(ProgressUpdate, 'create', async () => {
    assert.fail('Completing a task without a work description must not create an empty progress update.');
  });
  const response = createResponse();

  await handlePatchSubtasks({
    user: { id: String(workerId), role: 'worker' },
    params: { projectId: String(projectId), subtaskId: String(subtaskId) },
    protocol: 'http',
    get: () => 'localhost',
    body: {
      status: 'Completed',
      selfieUrl: `http://localhost/uploads/${selfieFilename}`,
      latitude: 37.7895,
      longitude: -122.4012,
      accuracy: 10,
    },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.subtask, completedSubtask);
  assert.equal(updateSubtask.mock.callCount(), 1);
  assert.equal(createProgressUpdate.mock.callCount(), 0);
});
