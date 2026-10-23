import assert from 'node:assert/strict';
import test from 'node:test';
import Subtask from '../src/models/Subtask.js';
import { getProjectCompletionMap } from '../src/domain/projectCompletion.js';

test('project completion counts only completed subtasks for each assigned worker', async () => {
  const originalAggregate = Subtask.aggregate;
  let pipeline;
  Subtask.aggregate = async value => {
    pipeline = value;
    return [{
      _id: 'project-1',
      total: 10,
      completed: 6
    }];
  };

  try {
    const progress = await getProjectCompletionMap([
      {
        _id: 'project-1',
        assignedWorker: 'worker-1'
      },
      {
        _id: 'project-2',
        assignedWorker: null
      }
    ]);

    assert.deepEqual(pipeline[0].$match.$or, [{
      project: 'project-1',
      assignedWorker: 'worker-1'
    }]);
    assert.equal(pipeline[1].$group.total.$sum, 1);
    assert.deepEqual(pipeline[1].$group.completed.$sum.$cond[0].$eq, ['$status', 'Completed']);
    assert.equal(progress.get('project-1'), 60);
    assert.equal(progress.get('project-2'), 0);
  } finally {
    Subtask.aggregate = originalAggregate;
  }
});

test('project completion returns zero when the assigned worker has no subtasks', async () => {
  const originalAggregate = Subtask.aggregate;
  Subtask.aggregate = async () => [];

  try {
    const progress = await getProjectCompletionMap([{
      _id: 'project-1',
      assignedWorker: 'worker-1'
    }]);
    assert.equal(progress.get('project-1'), 0);
  } finally {
    Subtask.aggregate = originalAggregate;
  }
});
