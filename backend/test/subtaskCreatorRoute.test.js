import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { authenticate } from '../src/middleware/auth.js';
import Activity from '../src/models/Activity.js';
import Project from '../src/models/Project.js';
import Subtask from '../src/models/Subtask.js';
import User from '../src/models/User.js';
import projectRoutes from '../src/routes/projects.js';

function resolvingQuery(value, populateCalls) {
  return {
    populate(path, projection) {
      populateCalls.push([path, projection]);
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject);
    },
  };
}

test('persists authenticated subtask creators and returns their names in task details', async t => {
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'subtask-route-test-secret-at-least-32-characters';
  t.after(() => {
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
  });

  const projectId = new mongoose.Types.ObjectId();
  const workerId = new mongoose.Types.ObjectId();
  const creators = [
    { role: 'admin', id: new mongoose.Types.ObjectId(), name: 'Admin Creator' },
    { role: 'project_manager', id: new mongoose.Types.ObjectId(), name: 'Manager Creator' },
  ];
  const project = { _id: projectId, manager: creators[1].id, assignedWorker: workerId };
  const createdSubtasks = [];
  const detailPopulateCalls = [];

  t.mock.method(Project, 'findOne', () => ({ select: async () => project }));
  t.mock.method(User, 'findOne', () => ({ select: async () => ({ _id: workerId }) }));
  t.mock.method(User, 'findById', () => ({ select: async () => ({ name: 'Authenticated User' }) }));
  t.mock.method(Activity, 'create', async () => ({}));
  t.mock.method(Subtask, 'create', async data => {
    const subtask = {
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date('2026-10-20T12:00:00.000Z'),
      updatedAt: new Date('2026-10-20T12:00:00.000Z'),
      ...data,
      async populate(path) {
        if (path === 'assignedWorker') this.assignedWorker = { _id: workerId, name: 'Assigned Worker' };
        return this;
      },
    };
    createdSubtasks.push(subtask);
    return subtask;
  });
  t.mock.method(Subtask, 'findOne', filter => {
    const record = createdSubtasks.find(item => String(item._id) === String(filter._id));
    const details = {
      ...record,
      project: { _id: projectId, name: 'North Wharf' },
      assignedWorker: { _id: workerId, name: 'Assigned Worker' },
      async populate(path, projection) {
        detailPopulateCalls.push([path, projection]);
        if (path === 'createdBy') {
          const creator = creators.find(item => String(item.id) === String(record.createdBy));
          this.createdBy = creator ? { _id: creator.id, name: creator.name } : null;
        }
        return this;
      },
    };
    return resolvingQuery(details, []);
  });

  const app = express();
  app.use(express.json());
  app.use(authenticate);
  app.use('/api/projects', projectRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const input = {
    title: 'Install framing',
    description: 'Frame the north wall',
    assignedWorker: String(workerId),
    startDate: '2026-10-20',
    dueDate: '2026-10-22',
  };

  for (const creator of creators) {
    const token = jwt.sign({ role: creator.role }, process.env.JWT_SECRET, {
      subject: String(creator.id),
      issuer: 'buildflow-api',
    });
    const createdResponse = await fetch(`${baseUrl}/api/projects/${projectId}/subtasks`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    assert.equal(createdResponse.status, 201);
    const { subtask: created } = await createdResponse.json();
    assert.equal(created.createdBy, String(creator.id));

    const detailsResponse = await fetch(`${baseUrl}/api/projects/${projectId}/subtasks/${created._id}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(detailsResponse.status, 200);
    const { subtask: details } = await detailsResponse.json();
    assert.equal(details.createdBy.name, creator.name);
    assert.ok(details.createdAt);
    assert.ok(details.updatedAt);
  }

  assert.ok(detailPopulateCalls.some(([path, projection]) => path === 'createdBy' && projection === 'name'));
});
