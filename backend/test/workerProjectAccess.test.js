import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import Attendance from '../src/models/Attendance.js';
import Project from '../src/models/Project.js';
import Subtask from '../src/models/Subtask.js';
import { uploadDirectory } from '../src/controllers/uploads.js';
import { handlePostCheckIn } from '../src/controllers/attendance.js';
import { findWorkerAssignedProject } from '../src/domain/workerProject.js';

test('worker access accepts a directly assigned project', async t => {
  const projectId = new mongoose.Types.ObjectId();
  const workerId = new mongoose.Types.ObjectId();
  const project = { _id: projectId, assignedWorker: workerId };
  t.mock.method(Project, 'findOne', async filter => {
    assert.equal(String(filter._id), String(projectId));
    return project;
  });
  t.mock.method(Subtask, 'exists', async () => {
    assert.fail('Direct project assignment should not query subtasks.');
  });

  assert.equal(await findWorkerAssignedProject(String(projectId), workerId), project);
});

test('worker access accepts a project with a subtask assigned to that worker', async t => {
  const projectId = new mongoose.Types.ObjectId();
  const workerId = new mongoose.Types.ObjectId();
  const project = { _id: projectId, assignedWorker: null };
  t.mock.method(Project, 'findOne', async filter => {
    assert.equal(filter.projectId, 'BLD-42');
    return project;
  });
  t.mock.method(Subtask, 'exists', async filter => {
    assert.equal(String(filter.project), String(projectId));
    assert.equal(String(filter.assignedWorker), String(workerId));
    return { _id: new mongoose.Types.ObjectId() };
  });

  assert.equal(await findWorkerAssignedProject('BLD-42', workerId), project);
});

test('worker access rejects a project with no assignment to that worker', async t => {
  const projectId = new mongoose.Types.ObjectId();
  const workerId = new mongoose.Types.ObjectId();
  t.mock.method(Project, 'findOne', async () => ({ _id: projectId, assignedWorker: null }));
  t.mock.method(Subtask, 'exists', async filter => {
    assert.equal(String(filter.assignedWorker), String(workerId));
    return null;
  });

  assert.equal(await findWorkerAssignedProject(String(projectId), workerId), null);
});

test('worker can check in to an open project containing their assigned subtask', async t => {
  const projectId = new mongoose.Types.ObjectId();
  const workerId = new mongoose.Types.ObjectId();
  const imageName = `${crypto.randomUUID()}.jpg`;
  const imagePath = path.join(uploadDirectory, imageName);
  await fs.mkdir(uploadDirectory, { recursive: true });
  await fs.writeFile(imagePath, 'test selfie');
  t.after(() => fs.rm(imagePath, { force: true }));

  const project = {
    _id: projectId,
    assignedWorker: null,
    status: 'Open',
    timeZone: 'UTC',
    location: { latitude: 37.7895, longitude: -122.4012, radiusMetres: 100 },
  };
  t.mock.method(Project, 'findOne', async filter => {
    assert.equal(String(filter._id), String(projectId));
    return project;
  });
  t.mock.method(Subtask, 'exists', async filter => {
    assert.equal(String(filter.project), String(projectId));
    assert.equal(String(filter.assignedWorker), String(workerId));
    return { _id: new mongoose.Types.ObjectId() };
  });
  t.mock.method(Attendance, 'findOne', async () => null);
  const attendanceCreate = t.mock.method(Attendance, 'create', async record => record);

  const response = {
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
  await handlePostCheckIn({
    user: { id: String(workerId), role: 'worker' },
    protocol: 'http',
    get: () => 'localhost',
    body: {
      projectId: String(projectId),
      selfieUrl: `http://localhost/uploads/${imageName}`,
      latitude: 37.7895,
      longitude: -122.4012,
      accuracy: 10,
    },
  }, response);

  assert.equal(response.statusCode, 201);
  assert.equal(String(attendanceCreate.mock.calls[0].arguments[0].worker), String(workerId));
  assert.equal(response.body.attendance.checkInSelfieUrl, `http://localhost/uploads/${imageName}`);
});
