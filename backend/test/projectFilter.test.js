import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProjectFilter } from '../src/domain/projectFilter.js';

test('builds the completed filter to include completed and closed projects', () => {
  const result = buildProjectFilter({ status: 'Completed' }, { role: 'admin', id: 'admin-id' });
  assert.deepEqual(result.filter.status, { $in: ['Completed', 'Closed'] });
});

test('combines search, client, priority, and date filters for list and export queries', () => {
  const result = buildProjectFilter({
    search: 'Harbor.*',
    client: 'Acme (West)',
    priority: 'high',
    startDate: '2026-01-01',
    endDate: '2026-02-01',
  }, { role: 'admin', id: 'admin-id' });

  const searchName = result.filter.$and[0].$or.find(condition => condition.name)?.name;
  assert.equal(searchName.test('Harbor.* construction'), true);
  assert.equal(searchName.test('HarborX construction'), false);
  assert.equal(result.filter['client.name'].test('ACME (WEST) Builders'), true);
  assert.equal(result.filter.priority, 'high');
  assert.equal(result.filter.startDate.$gte.toISOString(), '2026-01-01T00:00:00.000Z');
  assert.equal(result.filter.startDate.$lte.toISOString(), '2026-02-01T00:00:00.000Z');
});

test('keeps project-manager filters scoped to the manager own projects', () => {
  const result = buildProjectFilter({ managerId: 'another-manager' }, { role: 'project_manager', id: 'manager-id' });
  assert.deepEqual(result.filter, { manager: 'manager-id' });
});

test('prevents workers from filtering projects assigned to another worker', () => {
  const result = buildProjectFilter(
    { assignedWorker: 'another-worker' },
    { role: 'worker', id: 'worker-id' },
  );

  assert.deepEqual(result.error, {
    status: 403,
    message: 'Workers may only filter their own assignments.',
  });
});
