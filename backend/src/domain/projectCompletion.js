import Subtask from '../models/Subtask.js';

function completionPercentage(completed, total) {
  return total ? Math.round(completed / total * 100) : 0;
}

export async function getProjectCompletionMap(projects) {
  const progressByProject = new Map(projects.map(project => [String(project._id), 0]));
  for (let index = 0; index < projects.length; index += 100) {
    const projectBatch = projects.slice(index, index + 100);
    const projectWorkerPairs = projectBatch.flatMap(project => {
      const assignedWorker = project.assignedWorker?._id || project.assignedWorker;
      return assignedWorker ? [{
        project: project._id,
        assignedWorker
      }] : [];
    });
    if (!projectWorkerPairs.length) continue;

    const totals = await Subtask.aggregate([
      {
        $match: {
          $or: projectWorkerPairs
        }
      },
      {
        $group: {
          _id: '$project',
          total: {
            $sum: 1
          },
          completed: {
            $sum: {
              $cond: [{
                $eq: ['$status', 'Completed']
              }, 1, 0]
            }
          }
        }
      }
    ]);
    for (const { _id, total, completed } of totals) {
      progressByProject.set(String(_id), completionPercentage(completed, total));
    }
  }
  return progressByProject;
}
