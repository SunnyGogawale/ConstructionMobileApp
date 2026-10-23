import test from 'node:test';
import assert from 'node:assert/strict';
import { PROJECT_EXPORT_HEADERS, projectCsvRow } from '../src/domain/projectExport.js';

test('exports project detail columns in a stable order', () => {
  assert.deepEqual(PROJECT_EXPORT_HEADERS, [
    'Project ID',
    'Project Name',
    'Client',
    'Address',
    'Status',
    'Priority',
    'Start Date',
    'End Date',
    'Budget',
    'Progress',
    'Project Manager',
    'Assigned Worker',
    'Assigned Project Managers',
  ]);
});

test('exports database project details and assigned managers for admins', () => {
  const row = projectCsvRow({
    projectId: 'BLD-1234567',
    name: 'Harbor project',
    client: { name: 'Harbor client' },
    address: '1 Main Street',
    status: 'In Progress',
    priority: 'high',
    startDate: new Date('2026-01-02T00:00:00.000Z'),
    endDate: new Date('2026-02-03T00:00:00.000Z'),
    budget: 125000,
    progress: 45,
    manager: { name: 'Project owner' },
    assignedWorker: { name: 'Worker name' },
    assignedManagers: [{ name: 'Assigned manager' }],
  }, 'admin');

  assert.equal(row, '"BLD-1234567","Harbor project","Harbor client","1 Main Street","In Progress","high","2026-01-02T00:00:00.000Z","2026-02-03T00:00:00.000Z","125000","45","Project owner","Worker name","Assigned manager"\r\n');
});

test('does not expose assigned project managers to non-admin export rows', () => {
  const row = projectCsvRow({
    projectId: 'BLD-1234567',
    assignedManagers: [{ name: 'Private manager' }],
  }, 'project_manager');

  assert.ok(row.endsWith('"",""\r\n'));
  assert.ok(!row.includes('Private manager'));
});

test('neutralizes spreadsheet formulas in exported project values', () => {
  const row = projectCsvRow({ name: '=HYPERLINK("https://example.com")' }, 'admin');
  assert.ok(row.includes(`"'=HYPERLINK(""https://example.com"")"`));
});
