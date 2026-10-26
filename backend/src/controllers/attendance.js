import mongoose from 'mongoose';
import { z } from 'zod';
import Attendance from '../models/Attendance.js';
import Project from '../models/Project.js';
import Subtask from '../models/Subtask.js';
import ProgressUpdate from '../models/ProgressUpdate.js';
import User from '../models/User.js';
import { breakEndAt, dayKeyAt, verifySiteLocation, MAX_BREAK_SECONDS } from '../domain/attendance.js';
import { isUploadedImage } from '../domain/uploadedImage.js';
import { getProjectCompletionMap } from '../domain/projectCompletion.js';
import { findWorkerAssignedProject } from '../domain/workerProject.js';
const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().max(10000)
});
const checkInSchema = locationSchema.extend({
  projectId: z.string().min(1),
  selfieUrl: z.string().url()
});
const checkOutSchema = locationSchema.extend({
  projectId: z.string().min(1),
  selfieUrl: z.string().url(),
  workDescription: z.string().trim().max(3000).optional().default(''),
  photoUrls: z.array(z.string().url()).max(20).optional().default([])
});
async function findProject(projectId, workerId) {
  return findWorkerAssignedProject(projectId, workerId);
}
function sameUrls(first = [], second = []) {
  return first.length === second.length && first.every((url, index) => url === second[index]);
}
export const handlePostCheckIn = async (req, res) => {
  const parsed = checkInSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({
    message: 'A project, GPS fix, and uploaded selfie are required.',
    errors: parsed.error.issues
  });
  if (!await isUploadedImage(parsed.data.selfieUrl)) return res.status(400).json({
    message: 'The uploaded selfie could not be verified in storage. Upload it again and retry.'
  });
  const project = await findProject(parsed.data.projectId, req.user.id);
  if (!project || !['Open', 'Assigned', 'In Progress'].includes(project.status)) return res.status(404).json({
    message: 'Assigned project not found.'
  });
  const geofence = verifySiteLocation(parsed.data, project);
  const now = new Date();
  const existingShift = await Attendance.findOne({
    worker: req.user.id,
    status: { $in: ['active', 'on_break'] },
    checkedOutAt: null
  });
  if (existingShift) {
    if (String(existingShift.project) !== String(project._id)) return res.status(409).json({
      message: 'Check out of your current project before checking in to another project.'
    });
    return res.status(200).json({
      attendance: existingShift
    });
  }
  try {
    const record = await Attendance.create({
      worker: req.user.id,
      project: project._id,
      dayKey: dayKeyAt(now, project.timeZone || 'UTC'),
      timeZone: project.timeZone || 'UTC',
      checkedInAt: now,
      checkInLocation: {
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        accuracyMetres: parsed.data.accuracy,
        distanceMetres: geofence.distance
      },
      checkInSelfieUrl: parsed.data.selfieUrl
    });
    return res.status(201).json({
      attendance: record
    });
  } catch (error) {
    if (error.code === 11000) {
      const concurrentShift = await Attendance.findOne({
        worker: req.user.id,
        status: { $in: ['active', 'on_break'] },
        checkedOutAt: null
      });
      if (concurrentShift && String(concurrentShift.project) === String(project._id)) {
        return res.status(200).json({
          attendance: concurrentShift
        });
      }
      return res.status(409).json({
        message: concurrentShift
          ? 'Check out of your current project before checking in to another project.'
          : 'A shift has already been recorded for this worker today.'
      });
    }
    throw error;
  }
};
export const handlePostCheckOut = async (req, res) => {
  const parsed = checkOutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({
    message: 'Check-out requires GPS and an uploaded selfie.',
    errors: parsed.error.issues
  });
  if (!await isUploadedImage(parsed.data.selfieUrl)) return res.status(400).json({
    message: 'The uploaded selfie could not be verified in storage. Upload it again and retry.'
  });
  if (!await Promise.all(parsed.data.photoUrls.map(url => isUploadedImage(url))).then(results => results.every(Boolean))) {
    return res.status(400).json({
      message: 'Upload valid work photos before checking out.'
    });
  }
  const project = await findProject(parsed.data.projectId, req.user.id);
  if (!project) return res.status(404).json({
    message: 'Assigned project not found.'
  });
  const geofence = verifySiteLocation(parsed.data, project);
  const now = new Date();
  const activeShift = await Attendance.findOne({
    worker: req.user.id,
    project: project._id,
    status: { $in: ['active', 'on_break'] },
    checkedOutAt: null
  }).select('_id status breakStartedAt breakEndedAt breakAutoEnded');
  if (!activeShift) {
    const completedShift = await Attendance.findOne({
      worker: req.user.id,
      project: project._id,
      status: 'completed',
      checkOutSelfieUrl: parsed.data.selfieUrl
    }).sort({ checkedOutAt: -1 });
    if (completedShift
      && completedShift.workDescription === parsed.data.workDescription
      && sameUrls(completedShift.workPhotoUrls, parsed.data.photoUrls)) {
      const update = await ProgressUpdate.findOne({ attendance: completedShift._id });
      return res.status(200).json({ attendance: completedShift, update });
    }
    return res.status(409).json({
      message: 'An active verified shift is required to check out.'
    });
  }
  const activeTask = await Subtask.exists({
    project: project._id,
    assignedWorker: req.user.id,
    taskStartAttendance: activeShift._id,
    status: 'In Progress'
  });
  if (activeTask) return res.status(409).json({
    message: 'Complete or reset your in-progress project tasks before checking out of this session.'
  });
  if (activeShift.status === 'on_break' && !activeShift.breakStartedAt) return res.status(409).json({
    message: 'The active break record is incomplete. Resume the shift before checking out.'
  });
  const breakEndedAt = activeShift.status === 'on_break' ? breakEndAt(activeShift.breakStartedAt, now) : activeShift.breakEndedAt;
  const breakAutoEnded = activeShift.status === 'on_break'
    ? now >= new Date(activeShift.breakStartedAt.getTime() + MAX_BREAK_SECONDS * 1000)
    : activeShift.breakAutoEnded;
  const record = await Attendance.findOneAndUpdate({
    _id: activeShift._id,
    status: activeShift.status,
    checkedOutAt: null
  }, {
    $set: {
      status: 'completed',
      checkedOutAt: now,
      checkOutLocation: {
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        accuracyMetres: parsed.data.accuracy,
        distanceMetres: geofence.distance
      },
      checkOutSelfieUrl: parsed.data.selfieUrl,
      workDescription: parsed.data.workDescription,
      workPhotoUrls: parsed.data.photoUrls,
      breakEndedAt,
      breakAutoEnded
    }
  }, {
    new: true
  });
  if (!record) return res.status(409).json({
    message: 'An active verified shift is required to check out.'
  });
  let update;
  if (parsed.data.workDescription) {
    const completionByProject = await getProjectCompletionMap([project]);
    try {
      [update] = await ProgressUpdate.create([{
        project: project._id,
        worker: req.user.id,
        attendance: record._id,
        workDate: now,
        description: parsed.data.workDescription,
        progress: completionByProject.get(String(project._id)) ?? 0,
        photoUrls: parsed.data.photoUrls
      }]);
    } catch (error) {
      try {
        const rollback = await Attendance.updateOne({
          _id: record._id,
          status: 'completed',
          checkedOutAt: now
        }, {
          $set: {
            status: activeShift.status,
            checkedOutAt: null,
            checkOutLocation: null,
            checkOutSelfieUrl: null,
            workDescription: '',
            workPhotoUrls: [],
            breakEndedAt: activeShift.breakEndedAt,
            breakAutoEnded: activeShift.breakAutoEnded
          }
        });
        if (!rollback.modifiedCount) console.error('Attendance checkout rollback did not match the completed shift:', record._id);
      } catch (rollbackError) {
        console.error('Attendance checkout rollback failed:', rollbackError);
      }
      throw error;
    }
  }
  return res.json({
    attendance: record,
    update
  });
};
export const handlePostBreakStart = async (req, res) => {
  const now = new Date();
  const project = await findProject(req.body.projectId || '', req.user.id);
  if (!project) return res.status(404).json({
    message: 'Assigned project not found.'
  });
  const dayKey = dayKeyAt(now, project.timeZone || 'UTC');
  const record = await Attendance.findOneAndUpdate({
    worker: req.user.id,
    dayKey,
    status: 'active',
    breakUsed: false,
    breakStartedAt: null,
    checkedOutAt: null
  }, {
    $set: {
      status: 'on_break',
      breakStartedAt: now,
      breakUsed: true
    }
  }, {
    new: true
  });
  if (!record) return res.status(409).json({
    message: 'A verified active shift with no previous break is required. Only one break is allowed per workday.'
  });
  return res.json({
    attendance: record,
    breakLimitSeconds: MAX_BREAK_SECONDS
  });
};
export const handlePostBreakResume = async (req, res) => {
  const project = await findProject(req.body.projectId || '', req.user.id);
  if (!project) return res.status(404).json({
    message: 'Assigned project not found.'
  });
  const dayKey = dayKeyAt(new Date(), project.timeZone || 'UTC');
  const record = await Attendance.findOne({
    worker: req.user.id,
    dayKey,
    status: 'on_break'
  });
  if (!record) return res.status(409).json({
    message: 'There is no active break to resume.'
  });
  const now = new Date();
  const maximumEnd = new Date(record.breakStartedAt.getTime() + MAX_BREAK_SECONDS * 1000);
  record.breakEndedAt = now < maximumEnd ? now : maximumEnd;
  record.breakAutoEnded = now >= maximumEnd;
  record.status = 'active';
  await record.save();
  return res.json({
    attendance: record,
    breakDurationSeconds: Math.min(Math.floor((record.breakEndedAt - record.breakStartedAt) / 1000), MAX_BREAK_SECONDS)
  });
};
export const handleGetMe = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const filter = {
    worker: req.user.id
  };
  const [attendance, total] = await Promise.all([Attendance.find(filter).sort({
    checkedInAt: -1
  }).skip((page - 1) * limit).limit(limit).populate('project', 'projectId name address location'), Attendance.countDocuments(filter)]);
  return res.json({
    attendance,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};
export const handleDeleteRoot = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({
    message: 'Invalid attendance record ID.'
  });
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) return res.status(404).json({
    message: 'Attendance record not found.'
  });
  await Promise.all([
    ProgressUpdate.updateMany({
      attendance: attendance._id
    }, {
      $set: {
        attendance: null
      }
    }),
    ProgressUpdate.updateMany({
      attendanceSession: attendance._id
    }, {
      $set: {
        attendanceSession: null
      }
    }),
    Subtask.updateMany({
      taskStartAttendance: attendance._id
    }, {
      $set: {
        taskStartAttendance: null
      }
    })
  ]);
  await Attendance.deleteOne({
    _id: attendance._id
  });
  return res.json({
    message: 'Attendance record deleted.'
  });
};
export const handleGetRoot = async (req, res) => {
  const clauses = [];
  if (req.user.role === 'project_manager') clauses.push({
    project: {
      $in: await Project.find({
        manager: req.user.id
      }).distinct('_id')
    }
  });
  if (req.query.projectId) {
    const id = String(req.query.projectId);
    const project = await Project.findOne(mongoose.isValidObjectId(id) ? {
      _id: id
    } : {
      projectId: id
    }).select('_id manager');
    if (!project || req.user.role === 'project_manager' && String(project.manager) !== req.user.id) {
      return res.status(404).json({
        message: 'Project not found.'
      });
    }
    clauses.push({
      project: project._id
    });
  }
  const status = String(req.query.status || '');
  if (['active', 'on_break', 'completed'].includes(status)) clauses.push({
    status
  });
  const search = String(req.query.search || '').trim();
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');
    const [workerIds, projectIds] = await Promise.all([User.find({
      name: pattern
    }).distinct('_id'), Project.find({
      $or: [{
        name: pattern
      }, {
        projectId: pattern
      }]
    }).distinct('_id')]);
    clauses.push({
      $or: [{
        worker: {
          $in: workerIds
        }
      }, {
        project: {
          $in: projectIds
        }
      }, {
        status: pattern
      }]
    });
  }
  const workerName = String(req.query.worker || '').trim();
  if (workerName) {
    const escaped = workerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const workerIds = await User.find({
      name: new RegExp(escaped, 'i')
    }).distinct('_id');
    clauses.push({
      worker: {
        $in: workerIds
      }
    });
  }
  const projectName = String(req.query.project || '').trim();
  if (projectName) {
    const escaped = projectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const projectIds = await Project.find({
      $or: [{
        name: new RegExp(escaped, 'i')
      }, {
        projectId: new RegExp(escaped, 'i')
      }]
    }).distinct('_id');
    clauses.push({
      project: {
        $in: projectIds
      }
    });
  }
  const addDateRange = (field, fromValue, toValue) => {
    const parseDate = value => {
      if (!value) return null;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
      const date = new Date(`${value}T00:00:00.000Z`);
      return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? undefined : date;
    };
    const from = parseDate(fromValue);
    const to = parseDate(toValue);
    if (from === undefined || to === undefined || from && to && from > to) return false;
    const range = {};
    if (from) range.$gte = from;
    if (to) {
      const exclusiveEnd = new Date(to);
      exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
      range.$lt = exclusiveEnd;
    }
    if (Object.keys(range).length) clauses.push({
      [field]: range
    });
    return true;
  };
  if (!addDateRange('checkedInAt', String(req.query.checkInFrom || ''), String(req.query.checkInTo || ''))
    || !addDateRange('checkedOutAt', String(req.query.checkOutFrom || ''), String(req.query.checkOutTo || ''))) {
    return res.status(400).json({
      message: 'Attendance date filters must use valid dates and start before end.'
    });
  }
  const gpsFix = String(req.query.gpsFix || '');
  const gpsFields = ['latitude', 'longitude', 'accuracyMetres', 'distanceMetres'];
  const validGpsFix = {
    $and: gpsFields.map(field => ({
      [`checkInLocation.${field}`]: {
        $exists: true,
        $ne: null
      }
    })).concat([
      {
        'checkInLocation.latitude': {
          $gte: -90,
          $lte: 90
        }
      },
      {
        'checkInLocation.longitude': {
          $gte: -180,
          $lte: 180
        }
      },
      {
        'checkInLocation.accuracyMetres': {
          $gt: 0
        }
      },
      {
        'checkInLocation.distanceMetres': {
          $gte: 0
        }
      }
    ])
  };
  if (gpsFix === 'available') {
    clauses.push(validGpsFix);
  } else if (gpsFix === 'verified' || gpsFix === 'recorded') {
    const projects = await Project.find({}).select('_id location.radiusMetres').lean();
    const projectGroups = new Map();
    for (const project of projects) {
      const radius = project.location?.radiusMetres;
      const hasRadius = radius !== null && radius !== undefined && radius !== '' && Number.isFinite(Number(radius));
      const key = hasRadius ? String(Number(radius)) : 'unavailable';
      const group = projectGroups.get(key) || {
        radius: hasRadius ? Number(radius) : null,
        projectIds: []
      };
      group.projectIds.push(project._id);
      projectGroups.set(key, group);
    }
    const gpsProjectMatches = [...projectGroups.values()].flatMap(group => {
        const siteRange = group.radius === null
          ? null
          : gpsFix === 'verified'
            ? {
              $and: [
                { 'checkInLocation.accuracyMetres': { $lte: group.radius } },
                { 'checkInLocation.distanceMetres': { $lte: group.radius } }
              ]
            }
            : {
              $or: [
                { 'checkInLocation.accuracyMetres': { $gt: group.radius } },
                { 'checkInLocation.distanceMetres': { $gt: group.radius } }
              ]
            };
        if (gpsFix === 'verified' && group.radius === null) return [];
        return [{
          $and: [
            { project: { $in: group.projectIds } },
            validGpsFix,
            ...(siteRange ? [siteRange] : [])
          ]
        }];
      });
    clauses.push(gpsProjectMatches.length ? {
      $or: gpsProjectMatches
    } : {
      project: {
        $in: []
      }
    });
  } else if (gpsFix === 'unavailable') {
    clauses.push({
      $or: gpsFields.map(field => ({
        [`checkInLocation.${field}`]: {
          $exists: false
        }
      })).concat([
        {
          'checkInLocation.latitude': null
        },
        {
          'checkInLocation.longitude': null
        },
        {
          'checkInLocation.accuracyMetres': null
        },
        {
          'checkInLocation.distanceMetres': null
        },
        {
          'checkInLocation.latitude': {
            $lt: -90
          }
        },
        {
          'checkInLocation.latitude': {
            $gt: 90
          }
        },
        {
          'checkInLocation.longitude': {
            $lt: -180
          }
        },
        {
          'checkInLocation.longitude': {
            $gt: 180
          }
        },
        {
          'checkInLocation.accuracyMetres': {
            $lte: 0
          }
        },
        {
          'checkInLocation.distanceMetres': {
            $lt: 0
          }
        }
      ])
    });
  }
  const filter = clauses.length ? {
    $and: clauses
  } : {};
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const [attendance, total] = await Promise.all([Attendance.find(filter).sort({
    checkedInAt: sortOrder
  }).skip((page - 1) * limit).limit(limit).populate('worker', 'name').populate('project', 'projectId name address location'), Attendance.countDocuments(filter)]);
  return res.json({
    attendance,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};
