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

test('project managers can hide their own project without changing project data', async t => {
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'project-visibility-test-secret-at-least-32-chars';
  t.after(() => {
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
  });

  const projectId = new mongoose.Types.ObjectId();
  const ownerManagerId = new mongoose.Types.ObjectId();
  const otherManagerId = new mongoose.Types.ObjectId();
  const updates = [];
  t.mock.method(Project, 'findOneAndUpdate', (filter, update, options) => {
    updates.push({ filter, update, options });
    return {
      select: async () => String(filter.manager) === String(ownerManagerId) ? { _id: projectId } : null,
    };
  });
  t.mock.method(User, 'findById', () => ({ select: async () => ({ name: 'Project Manager' }) }));
  t.mock.method(Activity, 'create', async () => ({}));

  const app = express();
  app.use(authenticate);
  app.use('/api/projects', projectRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/projects/${projectId}`;
  const managerToken = managerId => jwt.sign({ role: 'project_manager' }, process.env.JWT_SECRET, {
    subject: String(managerId),
    issuer: 'buildflow-api',
  });

  const ownerResponse = await fetch(url, { method: 'DELETE', headers: { authorization: `Bearer ${managerToken(ownerManagerId)}` } });
  assert.equal(ownerResponse.status, 200);
  assert.deepEqual(await ownerResponse.json(), { hidden: true, projectId: String(projectId) });
  assert.equal(String(updates[0].filter._id), String(projectId));
  assert.equal(String(updates[0].filter.manager), String(ownerManagerId));
  assert.equal(String(updates[0].update.$addToSet.hiddenByManagers), String(ownerManagerId));
  assert.equal(updates[0].options.new, true);

  const otherResponse = await fetch(url, { method: 'DELETE', headers: { authorization: `Bearer ${managerToken(otherManagerId)}` } });
  assert.equal(otherResponse.status, 404);
  assert.equal(String(updates[1].filter._id), String(projectId));
  assert.equal(String(updates[1].filter.manager), String(otherManagerId));
  assert.equal(String(updates[1].update.$addToSet.hiddenByManagers), String(otherManagerId));
});

