import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Attendance from '../src/models/Attendance.js';
import Project from '../src/models/Project.js';
import ProgressUpdate from '../src/models/ProgressUpdate.js';
import { handlePostRoot } from '../src/controllers/progress.js';

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

function createRequest(workerId, projectId) {
  return {
    user: { id: String(workerId), role: 'worker' },
    body: {
      projectId: String(projectId),
      description: 'Completed the scheduled site preparation work.',
      progress: 25,
      completedTasks: [],
      pendingTasks: [],
      photos: [],
    },
  };
}

test('worker daily progress requires an active verified project shift', async t => {
  const workerId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  const project = { _id: projectId, assignedWorker: workerId };
  let createdCount = 0;
  t.mock.method(Project, 'findOne', async filter => {
    assert.equal(String(filter._id), String(projectId));
    return project;
  });
  t.mock.method(Attendance, 'findOne', filter => {
    assert.equal(String(filter.worker), String(workerId));
    assert.equal(String(filter.project), String(projectId));
    assert.deepEqual(filter.status.$in, ['active', 'on_break']);
    assert.equal(filter.checkedOutAt, null);
    return {
      select: () => Promise.resolve(null),
    };
  });
  t.mock.method(ProgressUpdate, 'create', async () => {
    createdCount += 1;
    return {};
  });

  const response = createResponse();
  await handlePostRoot(createRequest(workerId, projectId), response);

  assert.equal(response.statusCode, 409);
  assert.equal(createdCount, 0);
});

test('worker can submit multiple daily progress entries during an active shift', async t => {
  const workerId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  const attendanceId = new mongoose.Types.ObjectId();
  const project = { _id: projectId, assignedWorker: workerId };
  const created = [];
  t.mock.method(Project, 'findOne', async () => project);
  t.mock.method(Attendance, 'findOne', () => ({
    select: () => Promise.resolve({ _id: attendanceId }),
  }));
  t.mock.method(ProgressUpdate, 'create', async update => {
    created.push(update);
    return update;
  });

  for (let index = 0; index < 2; index += 1) {
    const response = createResponse();
    await handlePostRoot(createRequest(workerId, projectId), response);
    assert.equal(response.statusCode, 201);
    assert.equal(String(response.body.update.worker), String(workerId));
    assert.equal(String(response.body.update.project), String(projectId));
    assert.ok(response.body.update.workDate instanceof Date);
  }

  assert.equal(created.length, 2);
  assert.deepEqual(created.map(update => update.photoUrls), [[], []]);
  assert.equal(created[0].attendance, undefined);
  assert.deepEqual(created.map(update => String(update.attendanceSession)), [String(attendanceId), String(attendanceId)]);
});

test('worker daily progress rejects photo references that were not uploaded', async t => {
  const workerId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  t.mock.method(Project, 'findOne', async () => ({ _id: projectId, assignedWorker: workerId }));
  t.mock.method(Attendance, 'findOne', () => ({
    select: () => Promise.resolve({ _id: new mongoose.Types.ObjectId() }),
  }));
  const create = t.mock.method(ProgressUpdate, 'create', async () => ({}));
  const request = createRequest(workerId, projectId);
  request.protocol = 'http';
  request.get = () => 'localhost';
  request.body.photos = ['https://untrusted.example/photo.jpg'];

  const response = createResponse();
  await handlePostRoot(request, response);

  assert.equal(response.statusCode, 400);
  assert.equal(create.mock.callCount(), 0);
});
