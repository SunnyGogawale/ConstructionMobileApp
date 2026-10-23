import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectRoutes from '../src/routes/projects.js';
import { authenticate } from '../src/middleware/auth.js';
import Activity from '../src/models/Activity.js';
import Project from '../src/models/Project.js';
import Subtask from '../src/models/Subtask.js';
import SubtaskMaterial from '../src/models/SubtaskMaterial.js';
import User from '../src/models/User.js';

function resolvingQuery(value, populateCalls = []) {
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

test('stores admin and project manager creator IDs and populates the creator name', async t => {
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'route-test-jwt-secret-at-least-32-characters';
  t.after(() => {
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
  });

  const projectId = new mongoose.Types.ObjectId();
  const subtaskId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  const managerId = new mongoose.Types.ObjectId();
  const project = { _id: projectId, manager: managerId };
  const subtask = { _id: subtaskId, project: projectId };
  const createdMaterials = [];
  const detailPopulateCalls = [];

  t.mock.method(Project, 'findOne', () => ({ select: async () => project }));
  t.mock.method(Subtask, 'findOne', () => resolvingQuery(subtask));
  t.mock.method(SubtaskMaterial, 'create', async data => {
    const material = { _id: new mongoose.Types.ObjectId(), ...data };
    createdMaterials.push(material);
    return material;
  });
  t.mock.method(SubtaskMaterial, 'findOne', () => resolvingQuery({
    ...createdMaterials[1],
    project: { _id: projectId, name: 'North Wharf' },
    subtask: { _id: subtaskId, title: 'Foundation' },
    createdBy: { _id: managerId, name: 'Project Manager' },
  }, detailPopulateCalls));
  t.mock.method(User, 'findById', () => ({ select: async () => ({ name: 'Authenticated User' }) }));
  t.mock.method(Activity, 'create', async () => ({}));

  const app = express();
  app.use(express.json());
  app.use(authenticate);
  app.use('/api/projects', projectRoutes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const path = `/api/projects/${projectId}/subtasks/${subtaskId}/materials`;
  const materialInput = {
    name: 'Cement',
    quantity: 2,
    unit: 'bags',
    unitPrice: 10,
    date: '2026-10-23',
  };

  const unauthenticatedResponse = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(materialInput),
  });
  assert.equal(unauthenticatedResponse.status, 401);

  for (const [role, id] of [['admin', adminId], ['project_manager', managerId]]) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${jwt.sign({ role }, process.env.JWT_SECRET, { subject: String(id), issuer: 'buildflow-api' })}`,
        'content-type': 'application/json',
        'x-user-id': String(role === 'admin' ? managerId : adminId),
      },
      body: JSON.stringify(materialInput),
    });
    assert.equal(response.status, 201);
  }

  assert.deepEqual(createdMaterials.map(material => String(material.createdBy)), [String(adminId), String(managerId)]);

  const detailResponse = await fetch(`${baseUrl}${path}/${createdMaterials[1]._id}`, {
    headers: {
      authorization: `Bearer ${jwt.sign({ role: 'project_manager' }, process.env.JWT_SECRET, { subject: String(managerId), issuer: 'buildflow-api' })}`,
    },
  });
  assert.equal(detailResponse.status, 200);
  const { material } = await detailResponse.json();
  assert.equal(material.createdBy.name, 'Project Manager');
  assert.ok(detailPopulateCalls.some(([pathName, projection]) => pathName === 'createdBy' && projection === 'name'));
});