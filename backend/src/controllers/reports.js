import { z } from 'zod';
import Attendance from '../models/Attendance.js';
import FinanceRecord from '../models/FinanceRecord.js';
import ProgressUpdate from '../models/ProgressUpdate.js';
import Project from '../models/Project.js';
import { getProjectCompletionMap } from '../domain/projectCompletion.js';
const reportTypes = ['projects', 'attendance', 'progress', 'finance', 'expenses', 'worker-performance'];
const rangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});
export const handleGetRoot = async (req, res) => {
  if (!reportTypes.includes(req.params.type)) return res.status(404).json({
    message: 'Report type not found.'
  });
  const range = rangeSchema.safeParse(req.query);
  if (!range.success) return res.status(400).json({
    message: 'Report date range is invalid.'
  });
  const {
    from,
    to
  } = range.data;
  if (from && to && from > to) return res.status(400).json({
    message: 'Report start date must be before the end date.'
  });
  const projectFilter = req.user.role === 'project_manager' ? {
    manager: req.user.id
  } : {};
  if (req.query.projectId) projectFilter.projectId = String(req.query.projectId);
  if (req.query.client) projectFilter['client.name'] = String(req.query.client);
  const type = req.params.type;
  const projects = await Project.find(projectFilter).select('_id projectId name status budget progress manager assignedWorker startDate endDate client').lean();
  const progressByProject = type === 'projects' ? await getProjectCompletionMap(projects) : new Map();
  const projectIds = projects.map(project => project._id);
  const createdAt = {
    ...(from ? {
      $gte: from
    } : {}),
    ...(to ? {
      $lte: to
    } : {})
  };
  let rows = [];
  if (type === 'projects') {
    rows = projects.map(project => ({
      projectId: project.projectId,
      name: project.name,
      status: project.status,
      budget: project.budget,
      progress: progressByProject.get(String(project._id)) ?? 0,
      client: project.client?.name,
      startDate: project.startDate,
      endDate: project.endDate
    }));
  } else if (type === 'attendance') {
    rows = await Attendance.aggregate([{
      $match: {
        project: {
          $in: projectIds
        },
        ...(Object.keys(createdAt).length ? {
          checkedInAt: createdAt
        } : {})
      }
    }, {
      $group: {
        _id: '$project',
        checkIns: {
          $sum: 1
        },
        completedShifts: {
          $sum: {
            $cond: [{
              $eq: ['$status', 'completed']
            }, 1, 0]
          }
        },
        averageBreakSeconds: {
          $avg: {
            $cond: [{
              $and: ['$breakStartedAt', '$breakEndedAt']
            }, {
              $divide: [{
                $subtract: ['$breakEndedAt', '$breakStartedAt']
              }, 1000]
            }, 0]
          }
        }
      }
    }, {
      $lookup: {
        from: 'projects',
        localField: '_id',
        foreignField: '_id',
        as: 'project'
      }
    }, {
      $unwind: '$project'
    }, {
      $project: {
        projectId: '$project.projectId',
        projectName: '$project.name',
        checkIns: 1,
        completedShifts: 1,
        averageBreakSeconds: {
          $round: ['$averageBreakSeconds', 0]
        }
      }
    }, {
      $sort: {
        projectName: 1
      }
    }]);
  } else if (type === 'progress') {
    rows = await ProgressUpdate.find({
      project: {
        $in: projectIds
      },
      ...(Object.keys(createdAt).length ? {
        workDate: createdAt
      } : {})
    }).sort({
      workDate: -1
    }).limit(500).populate('worker', 'name').populate('project', 'projectId name').lean();
  } else if (type === 'worker-performance') {
    rows = await ProgressUpdate.aggregate([{
      $match: {
        project: {
          $in: projectIds
        },
        ...(Object.keys(createdAt).length ? {
          workDate: createdAt
        } : {})
      }
    }, {
      $group: {
        _id: '$worker',
        updates: {
          $sum: 1
        },
        averageProgress: {
          $avg: '$progress'
        },
        approvals: {
          $sum: {
            $cond: [{
              $eq: ['$reviewStatus', 'Approved']
            }, 1, 0]
          }
        }
      }
    }, {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'worker'
      }
    }, {
      $unwind: '$worker'
    }, {
      $project: {
        name: '$worker.name',
        updates: 1,
        approvals: 1,
        averageProgress: {
          $round: ['$averageProgress', 1]
        }
      }
    }, {
      $sort: {
        updates: -1
      }
    }]);
  } else {
    const recordType = type === 'expenses' ? 'expense' : {
      $in: ['invoice', 'payment']
    };
    rows = await FinanceRecord.find({
      project: {
        $in: projectIds
      },
      recordType,
      ...(Object.keys(createdAt).length ? {
        createdAt
      } : {})
    }).sort({
      createdAt: -1
    }).limit(500).populate('project', 'projectId name').lean();
  }
  return res.json({
    report: {
      type,
      generatedAt: new Date(),
      filters: {
        from,
        to,
        projectId: req.query.projectId || null,
        client: req.query.client || null
      },
      rows
    }
  });
};
