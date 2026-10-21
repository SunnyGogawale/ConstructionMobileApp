import test from 'node:test';
import assert from 'node:assert/strict';
import { canProjectManagerViewActivity } from '../src/domain/activityAccess.js';

test('allows a project manager to view an explicitly mapped worker', () => {
  assert.equal(canProjectManagerViewActivity('manager-1', {
    role: 'worker',
    managerMapping: 'manager-1',
    createdBy: 'admin-1',
  }), true);
});

test('allows each manager in a worker multi-mapping to view the worker', () => {
  const worker = {
    role: 'worker',
    managerMapping: ['manager-1', 'manager-2'],
    createdBy: 'admin-1',
  };
  assert.equal(canProjectManagerViewActivity('manager-1', worker), true);
  assert.equal(canProjectManagerViewActivity('manager-2', worker), true);
  assert.equal(canProjectManagerViewActivity('manager-3', worker), false);
});

test('does not allow access when a worker is mapped to another manager', () => {
  assert.equal(canProjectManagerViewActivity('manager-1', {
    role: 'worker',
    managerMapping: 'manager-2',
    createdBy: 'manager-1',
  }), false);
});

test('does not use creator fallback when a worker is mapped to someone else', () => {
  assert.equal(canProjectManagerViewActivity('manager-1', {
    role: 'worker',
    managerMapping: ['manager-2'],
    createdBy: 'manager-1',
  }), false);
});

test('allows legacy workers created by the manager when no mapping exists', () => {
  assert.equal(canProjectManagerViewActivity('manager-1', {
    role: 'worker',
    managerMapping: null,
    createdBy: 'manager-1',
  }), true);
});

test('never allows access to an administrator or another project manager', () => {
  assert.equal(canProjectManagerViewActivity('manager-1', {
    role: 'admin',
    createdBy: 'manager-1',
  }), false);
  assert.equal(canProjectManagerViewActivity('manager-1', {
    role: 'project_manager',
    createdBy: 'manager-1',
  }), false);
});
