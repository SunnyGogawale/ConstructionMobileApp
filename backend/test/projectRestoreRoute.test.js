import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { authenticate } from '../src/middleware/auth.js';
import Activity from '../src/models/Activity.js';
import Project from '../src/models/Project.js';
import User from '../src/models/User.js';
import projectRoutes from '../src/routes/projects.js';

test('admins restore visibility for only the selected manager', async t => {
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'project-restore-test-secret-at-least-32-chars';
  t.after(() => {
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
  });

  const projectId = new mongoose.Types.ObjectId();
  const managerId = new mongoose.Types.ObjectId();
  const otherManagerId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  let actualFilter;
  let actualUpdate;
  const restoredProject = {
    _id: projectId,
    name: 'Visible to other managers',
    status: 'In Progress',
    hiddenByManagers: [managerId, otherManagerId],
    toObject() {
      return {
        _id: this._id,
        name: this.name,
        status: this.status,
        hiddenByManagers: this.hiddenByManagers,
      };
    },
  };
  t.mock.method(Project, 'findOneAndUpdate', (filter, update) => {
    actualFilter = filter;
    actualUpdate = update;
    const query = {
      populate() {
        return this;
      },
      then(resolve, reject) {
        restoredProject.hiddenByManagers = restoredProject.hiddenByManagers.filter(id => String(id) !== String(managerId));
        return Promise.resolve(restoredProject).then(resolve, reject);
      },
    };
    return query;
  });
  t.mock.method(User, 'findById', () => ({ select: async () => ({ name: 'Admin' }) }));
  t.mock.method(Activity, 'create', async () => ({}));

  const app = express();
  app.use(express.json());
  app.use(authenticate);
  app.use('/api/projects', projectRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/projects/${projectId}/restore`;
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, {
    subject: String(adminId),
    issuer: 'buildflow-api',
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ managerId: String(managerId) }),
  });

  assert.equal(response.status, 200);
  assert.equal(String(actualFilter._id), String(projectId));
  assert.equal(actualFilter.hiddenByManagers, String(managerId));
  assert.deepEqual(actualUpdate, { $pull: { hiddenByManagers: String(managerId) } });
  const result = await response.json();
  assert.equal(result.project.status, 'In Progress');
  assert.deepEqual(result.hiddenByManagers.map(String), [String(otherManagerId)]);
});

test('rejects invalid manager IDs when restoring project visibility', async t => {
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'project-restore-test-secret-at-least-32-chars';
  t.after(() => {
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
  });
  t.mock.method(User, 'findById', () => ({ select: async () => ({ name: 'Admin' }) }));
  t.mock.method(Activity, 'create', async () => ({}));

  const app = express();
  app.use(express.json());
  app.use(authenticate);
  app.use('/api/projects', projectRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const adminId = new mongoose.Types.ObjectId();
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, {
    subject: String(adminId),
    issuer: 'buildflow-api',
  });

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/projects/${new mongoose.Types.ObjectId()}/restore`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ managerId: 'not-an-object-id' }),
  });

  assert.equal(response.status, 400);
});
