import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { authenticate } from '../src/middleware/auth.js';
import Project from '../src/models/Project.js';
import Subtask from '../src/models/Subtask.js';
import projectRoutes from '../src/routes/projects.js';

function projectQuery(projects) {
  return {
    populate() {
      return this;
    },
    select() {
      return this;
    },
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(projects).then(resolve, reject);
    },
  };
}

test('worker project list includes only projects with subtasks assigned to that worker', async t => {
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'worker-project-list-test-secret-at-least-32-chars';
  t.after(() => {
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
  });

  const workerId = new mongoose.Types.ObjectId();
  const assignedProjectId = new mongoose.Types.ObjectId();
  const unassignedProjectId = new mongoose.Types.ObjectId();
  let queriedProjectFilter;
  let countedProjectFilter;
  t.mock.method(Subtask, 'distinct', async (field, filter) => {
    assert.equal(field, 'project');
    assert.equal(String(filter.assignedWorker), String(workerId));
    return [assignedProjectId];
  });
  t.mock.method(Project, 'find', filter => {
    queriedProjectFilter = filter;
    return projectQuery([{
      _id: assignedProjectId,
      assignedWorker: null,
      toObject: () => ({ _id: assignedProjectId, name: 'Assigned work site' }),
    }]);
  });
  t.mock.method(Project, 'countDocuments', async filter => {
    countedProjectFilter = filter;
    return 1;
  });
  t.mock.method(Subtask, 'aggregate', async () => []);

  const app = express();
  app.use(authenticate);
  app.use('/api/projects', projectRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));

  const token = jwt.sign({ role: 'worker' }, process.env.JWT_SECRET, {
    subject: String(workerId),
    issuer: 'buildflow-api',
  });
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/projects?page=1&limit=100`, {
    headers: { authorization: `Bearer ${token}` },
  });

  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.projects.length, 1);
  assert.equal(String(result.projects[0]._id), String(assignedProjectId));
  assert.deepEqual(queriedProjectFilter.$and[1]._id.$in.map(String), [String(assignedProjectId)]);
  assert.deepEqual(countedProjectFilter, queriedProjectFilter);
  assert.notEqual(String(unassignedProjectId), String(result.projects[0]._id));
});
