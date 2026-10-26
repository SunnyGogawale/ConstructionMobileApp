import test from 'node:test';
import assert from 'node:assert/strict';
import { createSubtaskSchema, isValidSubtaskDateRange, subtaskStatuses, updateSubtaskSchema, validateWorkerTaskTransition } from '../src/domain/subtasks.js';

test('accepts required subtask details and defaults status to Pending', () => {
  const result = createSubtaskSchema.safeParse({
    title: 'Install framing',
    assignedWorker: 'worker-id',
    startDate: '2026-10-20',
    dueDate: '2026-10-22',
  });
  assert.equal(result.success, true);
  assert.equal(result.data.status, 'Pending');
  assert.deepEqual(subtaskStatuses, ['Pending', 'In Progress', 'Completed']);
});

test('rejects invalid subtask statuses and missing worker assignments', () => {
  assert.equal(createSubtaskSchema.safeParse({
    title: 'Install framing',
    startDate: '2026-10-20',
    dueDate: '2026-10-22',
  }).success, false);
  assert.equal(updateSubtaskSchema.safeParse({ status: 'Blocked' }).success, false);
});

test('requires subtask due date to be on or after its start date', () => {
  assert.equal(isValidSubtaskDateRange(new Date('2026-10-20'), new Date('2026-10-20')), true);
  assert.equal(isValidSubtaskDateRange(new Date('2026-10-22'), new Date('2026-10-20')), false);
});

test('requires a fresh project-shift selfie verification for each task transition', () => {
  assert.equal(validateWorkerTaskTransition({
    currentStatus: 'Pending',
    nextStatus: 'In Progress',
  }), null);
  assert.match(validateWorkerTaskTransition({
    currentStatus: 'Pending',
    nextStatus: 'Completed',
  }), /Start the task/);
  assert.match(validateWorkerTaskTransition({
    currentStatus: 'In Progress',
    nextStatus: 'In Progress',
  }), /already been started/);
  assert.match(validateWorkerTaskTransition({
    currentStatus: 'In Progress',
    nextStatus: 'Completed',
    taskAttendanceId: 'shift-1',
    activeAttendanceId: 'shift-2',
  }), /same verified project shift/);
  assert.equal(validateWorkerTaskTransition({
    currentStatus: 'In Progress',
    nextStatus: 'Completed',
    taskAttendanceId: 'shift-1',
    activeAttendanceId: 'shift-1',
  }), null);
});
