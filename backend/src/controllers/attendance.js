import mongoose from 'mongoose';
import { z } from 'zod';
import Attendance from '../models/Attendance.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { dayKeyAt, verifyGeofence, verifyLocationAccuracy, MAX_BREAK_SECONDS } from '../domain/attendance.js';
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
  workDescription: z.string().trim().min(10).max(3000),
  photoUrls: z.array(z.string().url()).min(1).max(20)
});
async function findProject(projectId, workerId) {
  const idFilter = mongoose.isValidObjectId(projectId) ? {
    _id: projectId
  } : {
    projectId
  };
  return Project.findOne({
    ...idFilter,
    assignedWorker: workerId
  });
}
function getSiteFix(data, project) {
  if (!verifyLocationAccuracy(data.accuracy, project.location.radiusMetres).allowed) {
    const error = new Error(`GPS accuracy is ±${Math.round(data.accuracy)} m. Improve the location fix before continuing.`);
    error.status = 422;
    throw error;
  }
  const result = verifyGeofence({
    latitude: data.latitude,
    longitude: data.longitude
  }, project.location);
  if (!result.allowed) {
    const error = new Error(`You are ${result.distance} m from the project. Check-in is blocked outside the ${project.location.radiusMetres} m radius.`);
    error.status = 403;
    throw error;
  }
  return result;
}
export const handlePostCheckIn = async (req, res) => {
  const parsed = checkInSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({
    message: 'A project, GPS fix, and uploaded selfie are required.',
    errors: parsed.error.issues
  });
  const project = await findProject(parsed.data.projectId, req.user.id);
  if (!project || !['Assigned', 'In Progress'].includes(project.status)) return res.status(404).json({
    message: 'Assigned project not found.'
  });
  const geofence = getSiteFix(parsed.data, project);
  const now = new Date();
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
    if (error.code === 11000) return res.status(409).json({
      message: 'A shift has already been recorded for this worker today.'
    });
    throw error;
  }
};
export const handlePostCheckOut = async (req, res) => {
  const parsed = checkOutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({
    message: 'Check-out requires GPS, a selfie, work description, and at least one work photo.',
    errors: parsed.error.issues
  });
  const project = await findProject(parsed.data.projectId, req.user.id);
  if (!project) return res.status(404).json({
    message: 'Assigned project not found.'
  });
  const geofence = getSiteFix(parsed.data, project);
  const dayKey = dayKeyAt(new Date(), project.timeZone || 'UTC');
  const record = await Attendance.findOneAndUpdate({
    worker: req.user.id,
    project: project._id,
    dayKey,
    status: 'active',
    checkedOutAt: null
  }, {
    $set: {
      status: 'completed',
      checkedOutAt: new Date(),
      checkOutLocation: {
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        accuracyMetres: parsed.data.accuracy,
        distanceMetres: geofence.distance
      },
      checkOutSelfieUrl: parsed.data.selfieUrl,
      workDescription: parsed.data.workDescription,
      workPhotoUrls: parsed.data.photoUrls
    }
  }, {
    new: true
  });
  if (!record) return res.status(409).json({
    message: 'An active verified shift is required to check out.'
  });
  return res.json({
    attendance: record
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
  const filter = clauses.length ? {
    $and: clauses
  } : {};
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const [attendance, total] = await Promise.all([Attendance.find(filter).sort({
    checkedInAt: sortOrder
  }).skip((page - 1) * limit).limit(limit).populate('worker', 'name').populate('project', 'projectId name'), Attendance.countDocuments(filter)]);
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
