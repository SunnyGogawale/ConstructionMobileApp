import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Attendance from '../src/models/Attendance.js';
import ProgressUpdate from '../src/models/ProgressUpdate.js';
import Subtask from '../src/models/Subtask.js';
import { handleDeleteRoot } from '../src/controllers/attendance.js';

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

test('admin attendance deletion removes the record and clears optional attendance references', async t => {
  const attendanceId = new mongoose.Types.ObjectId();
  const attendance = { _id: attendanceId };
  t.mock.method(Attendance, 'findById', async id => {
    assert.equal(id, attendanceId.toString());
    return attendance;
  });
  const progressAttendance = t.mock.method(ProgressUpdate, 'updateMany', async filter => ({
    acknowledged: true,
    matchedCount: filter.attendance || filter.attendanceSession ? 1 : 0,
  }));
  const updateTasks = t.mock.method(Subtask, 'updateMany', async filter => ({
    acknowledged: true,
    matchedCount: filter.taskStartAttendance ? 1 : 0,
  }));
  const deleteRecord = t.mock.method(Attendance, 'deleteOne', async filter => {
    assert.equal(String(filter._id), String(attendanceId));
    return { deletedCount: 1 };
  });
  const response = createResponse();

  await handleDeleteRoot({ params: { id: attendanceId.toString() } }, response);

  assert.equal(response.statusCode, 200);
  assert.match(response.body.message, /deleted/i);
  assert.equal(progressAttendance.mock.callCount(), 2);
  assert.equal(updateTasks.mock.callCount(), 1);
  assert.equal(deleteRecord.mock.callCount(), 1);
});

test('attendance deletion rejects invalid and missing IDs', async t => {
  const findRecord = t.mock.method(Attendance, 'findById', async () => null);
  const deleteRecord = t.mock.method(Attendance, 'deleteOne', async () => ({ deletedCount: 1 }));
  const invalidResponse = createResponse();

  await handleDeleteRoot({ params: { id: 'not-an-id' } }, invalidResponse);

  assert.equal(invalidResponse.statusCode, 400);
  assert.equal(findRecord.mock.callCount(), 0);
  assert.equal(deleteRecord.mock.callCount(), 0);

  const missingResponse = createResponse();
  await handleDeleteRoot({ params: { id: new mongoose.Types.ObjectId().toString() } }, missingResponse);

  assert.equal(missingResponse.statusCode, 404);
  assert.equal(deleteRecord.mock.callCount(), 0);
});
