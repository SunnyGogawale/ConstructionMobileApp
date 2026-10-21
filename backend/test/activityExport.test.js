import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITY_EXPORT_HEADERS, activityCsvRow, csvCell } from '../src/domain/activityExport.js';

test('exports the required activity columns in order', () => {
  assert.deepEqual(ACTIVITY_EXPORT_HEADERS, [
    'Date & Time',
    'Person Name',
    'Action',
    'Description',
    'IP Address',
    'Device Information',
    'Status',
  ]);
});

test('quotes CSV values and escapes embedded quotes', () => {
  assert.equal(csvCell('Updated "site"'), '"Updated ""site"""');
});

test('neutralizes spreadsheet formula values', () => {
  assert.equal(csvCell('=HYPERLINK("https://example.com")'), `"'=HYPERLINK(""https://example.com"")"`);
  assert.equal(csvCell('  @SUM(A1:A2)'), '"\'  @SUM(A1:A2)"');
});

test('writes rows as comma-separated UTF-8-compatible CSV lines', () => {
  assert.equal(activityCsvRow(['Alex', 'Login', 'success']), '"Alex","Login","success"\r\n');
});
