import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Attendance from '../src/models/Attendance.js';
import Project from '../src/models/Project.js';
import User from '../src/models/User.js';
import { handleGetRoot } from '../src/controllers/attendance.js';

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

function createAttendanceQuery() {
  let populateCount = 0;
  return {
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return this;
    },
    populate() {
      populateCount += 1;
      return populateCount === 2 ? Promise.resolve([]) : this;
    },
  };
}

test('attendance endpoint applies worker, project, date-range, and GPS filters before pagination', async t => {
  const workerId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  let attendanceFilter;
  t.mock.method(User, 'find', () => ({
    distinct: async () => [workerId],
  }));
  t.mock.method(Project, 'find', filter => filter && Object.keys(filter).length === 0
    ? {
      select: () => ({
        lean: async () => [{ _id: projectId, location: { radiusMetres: 100 } }],
      }),
    }
    : {
      distinct: async () => [projectId],
    });
  t.mock.method(Attendance, 'find', filter => {
    attendanceFilter = filter;
    return createAttendanceQuery();
  });
  t.mock.method(Attendance, 'countDocuments', async () => 0);
  const response = createResponse();

  await handleGetRoot({
    user: { id: new mongoose.Types.ObjectId().toString(), role: 'admin' },
    query: {
      page: '2',
      limit: '10',
      worker: 'rahul',
      project: 'villa',
      checkInFrom: '2026-10-01',
      checkInTo: '2026-10-31',
      checkOutFrom: '2026-10-02',
      checkOutTo: '2026-10-30',
      gpsFix: 'verified',
    },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.pagination.page, 2);
  assert.equal(response.body.pagination.limit, 10);
  assert.deepEqual(attendanceFilter.$and[0], { worker: { $in: [workerId] } });
  assert.deepEqual(attendanceFilter.$and[1], { project: { $in: [projectId] } });
  assert.deepEqual(attendanceFilter.$and[2], {
    checkedInAt: {
      $gte: new Date('2026-10-01T00:00:00.000Z'),
      $lt: new Date('2026-11-01T00:00:00.000Z'),
    },
  });
  assert.deepEqual(attendanceFilter.$and[3], {
    checkedOutAt: {
      $gte: new Date('2026-10-02T00:00:00.000Z'),
      $lt: new Date('2026-10-31T00:00:00.000Z'),
    },
  });
  const gpsFilter = attendanceFilter.$and[4];
  const siteRange = gpsFilter.$or[0].$and.find(condition => condition.$and?.some(
    range => range['checkInLocation.accuracyMetres']?.$lte === 100
  ));
  assert.ok(siteRange);
  assert.ok(siteRange.$and.some(condition => condition['checkInLocation.distanceMetres']?.$lte === 100));
});

test('attendance endpoint rejects invalid date ranges', async t => {
  const findAttendance = t.mock.method(Attendance, 'find', () => {
    assert.fail('Invalid date filters should not query attendance.');
  });
  const response = createResponse();

  await handleGetRoot({
    user: { id: new mongoose.Types.ObjectId().toString(), role: 'admin' },
    query: {
      checkInFrom: '2026-10-31',
      checkInTo: '2026-10-01',
    },
  }, response);

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /valid dates/i);
  assert.equal(findAttendance.mock.callCount(), 0);
});
