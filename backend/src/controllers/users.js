import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import mongoose from 'mongoose';
import { z } from 'zod';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Project from '../models/Project.js';
import { ACTIVITY_EXPORT_HEADERS, activityCsvRow } from '../domain/activityExport.js';
import { canProjectManagerViewActivity } from '../domain/activityAccess.js';
import { isPasswordResetEmailConfigured, sendPasswordResetEmail } from '../services/passwordResetEmail.js';
const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  password: z.string().min(6).max(200),
  role: z.enum(['admin', 'project_manager', 'worker']),
  managerMapping: z.union([z.string(), z.array(z.string())]).optional()
});
const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.email().optional(),
  active: z.boolean().optional(),
  role: z.enum(['admin', 'project_manager', 'worker']).optional(),
  managerMapping: z.union([z.string(), z.array(z.string()), z.null()]).optional()
}).refine(value => Object.keys(value).length > 0);
const activityTypeSchema = z.enum(['project', 'assignment', 'attendance', 'progress', 'finance', 'people', 'system']);
async function managerUserIds(managerId) {
  const projects = await Project.find({
    manager: managerId
  }).select('_id assignedWorker');
  const projectWorkerIds = projects.map(project => project.assignedWorker).filter(Boolean);
  const createdUsers = await User.find({
    createdBy: managerId,
    $or: [{
      managerMapping: null
    }, {
      managerMapping: {
        $size: 0
      }
    }, {
      managerMapping: managerId
    }]
  }).distinct('_id');
  const mappedUsers = await User.find({
    managerMapping: managerId
  }).distinct('_id');
  const legacyProjectWorkers = projectWorkerIds.length ? await User.find({
    _id: {
      $in: projectWorkerIds
    },
    $or: [{
      managerMapping: null
    }, {
      managerMapping: {
        $size: 0
      }
    }]
  }).distinct('_id') : [];
  return [...new Set([managerId, ...createdUsers.map(id => id.toString()), ...mappedUsers.map(id => id.toString()), ...legacyProjectWorkers.map(id => id.toString())])];
}
function managerMappingIds(value) {
  if (value == null) return [];
  return [...new Set((Array.isArray(value) ? value : [value]).filter(Boolean))];
}
async function validateManagerMappings(managerIds, allowedExistingIds = []) {
  if (!managerIds.length || managerIds.some(id => !mongoose.isValidObjectId(id))) return false;
  const existingIds = new Set(allowedExistingIds.map(String));
  const managers = await User.find({
    _id: {
      $in: managerIds
    },
    role: 'project_manager'
  }).select('_id active');
  return managers.length === managerIds.length && managers.every(manager => manager.active || existingIds.has(manager.id));
}
function activityFilter(query, personId) {
  const filter = {
    actor: personId
  };
  if (query.type !== undefined) {
    const type = activityTypeSchema.safeParse(query.type);
    if (!type.success) return {
      error: 'Activity type filter is invalid.'
    };
    filter.category = type.data;
  }
  const dateRange = {};
  if (query.from !== undefined) {
    const from = z.iso.date().safeParse(query.from);
    if (!from.success) return {
      error: 'Start date must use YYYY-MM-DD format.'
    };
    dateRange.$gte = new Date(`${from.data}T00:00:00.000Z`);
  }
  if (query.to !== undefined) {
    const to = z.iso.date().safeParse(query.to);
    if (!to.success) return {
      error: 'End date must use YYYY-MM-DD format.'
    };
    dateRange.$lt = new Date(new Date(`${to.data}T00:00:00.000Z`).getTime() + 86400000);
  }
  if (dateRange.$gte && dateRange.$lt && dateRange.$gte >= dateRange.$lt) {
    return {
      error: 'End date must be on or after the start date.'
    };
  }
  if (Object.keys(dateRange).length) filter.createdAt = dateRange;
  return {
    filter
  };
}
async function authorizedActivityPerson(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({
      message: 'User not found.'
    });
    return null;
  }
  const person = await User.findById(req.params.id).select('name role managerMapping createdBy');
  if (!person) {
    res.status(404).json({
      message: 'User not found.'
    });
    return null;
  }
  if (req.user.role === 'project_manager' && !canProjectManagerViewActivity(req.user.id, person)) {
    res.status(404).json({
      message: 'User not found.'
    });
    return null;
  }
  return person;
}
export const handleGetProjectManagers = async (_req, res) => {
  const managers = await User.find({
    role: 'project_manager',
    active: true
  }).select('name email').sort({
    name: 1
  });
  return res.json({
    managers
  });
};
export const handleGetActivityExport = async (req, res, next) => {
  const person = await authorizedActivityPerson(req, res);
  if (!person) return;
  const {
    filter,
    error
  } = activityFilter(req.query, person._id);
  if (error) return res.status(400).json({
    message: error
  });
  const cursor = Activity.find(filter).select('actorName action title detail status ipAddress deviceInfo createdAt').sort({
    createdAt: -1,
    _id: -1
  }).lean().cursor();
  const exportedCount = await Activity.countDocuments(filter);
  async function* csvRows() {
    yield `\uFEFF${activityCsvRow(ACTIVITY_EXPORT_HEADERS)}`;
    for await (const activity of cursor) {
      yield activityCsvRow([activity.createdAt?.toISOString() || '', activity.actorName || person.name, activity.action, activity.detail || activity.title, activity.ipAddress, activity.deviceInfo, activity.status || 'success']);
    }
  }
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="activity-${person.id}.csv"`,
    'Cache-Control': 'no-store',
    'X-Exported-Count': String(exportedCount)
  });
  try {
    await pipeline(Readable.from(csvRows()), res);
  } catch (streamError) {
    if (res.destroyed) return;
    if (res.headersSent) {
      console.error('Activity log CSV export failed:', streamError);
      res.destroy(streamError);
      return;
    }
    return next(streamError);
  }
};
export const handleGetActivity = async (req, res) => {
  const person = await authorizedActivityPerson(req, res);
  if (!person) return;
  const {
    filter,
    error
  } = activityFilter(req.query, person._id);
  if (error) return res.status(400).json({
    message: error
  });
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const [activities, total] = await Promise.all([Activity.find(filter).select('actorName action category title detail status ipAddress deviceInfo createdAt').sort({
    createdAt: -1,
    _id: -1
  }).skip((page - 1) * limit).limit(limit), Activity.countDocuments(filter)]);
  return res.json({
    person: {
      id: person.id,
      name: person.name
    },
    activities: activities.map(activity => ({
      id: activity.id,
      dateTime: activity.createdAt,
      personName: activity.actorName,
      action: activity.action,
      category: activity.category,
      description: activity.detail || activity.title,
      ipAddress: activity.ipAddress || '',
      deviceInfo: activity.deviceInfo || '',
      status: activity.status || 'success'
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};
export const handleGetRoot = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const clauses = [];
  if (req.user.role === 'project_manager') clauses.push({
    _id: {
      $in: await managerUserIds(req.user.id)
    }
  });
  if (req.query.role !== undefined) {
    const role = z.enum(['admin', 'project_manager', 'worker']).safeParse(req.query.role);
    if (!role.success) return res.status(400).json({
      message: 'User role filter is invalid.'
    });
    clauses.push({
      role: role.data
    });
  }
  if (req.query.status !== undefined) {
    const status = z.enum(['active', 'inactive']).safeParse(req.query.status);
    if (!status.success) return res.status(400).json({
      message: 'User status filter is invalid.'
    });
    clauses.push({
      active: status.data === 'active'
    });
  }
  const search = String(req.query.search || '').trim();
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');
    clauses.push({
      $or: [{
        name: pattern
      }, {
        email: pattern
      }]
    });
  }
  const filter = clauses.length ? {
    $and: clauses
  } : {};
  const [users, total] = await Promise.all([User.find(filter).select('name email role managerMapping createdBy active createdAt').populate('managerMapping', 'name email').sort({
    name: 1
  }).skip((page - 1) * limit).limit(limit), User.countDocuments(filter)]);
  return res.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};
export const handlePostRoot = async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({
    message: 'User details are invalid.',
    errors: parsed.error.issues
  });
  if (req.user.role === 'project_manager' && parsed.data.role !== 'worker') {
    return res.status(403).json({
      message: 'Project managers may invite workers but cannot assign system roles.'
    });
  }
  if (req.user.role === 'project_manager' && parsed.data.managerMapping !== undefined) {
    return res.status(403).json({
      message: 'Project managers cannot assign workers to another manager.'
    });
  }
  const managerMapping = managerMappingIds(parsed.data.managerMapping);
  if (parsed.data.role === 'worker' && req.user.role === 'admin' && !managerMapping.length) {
    return res.status(400).json({
      message: 'Select a project manager for this worker.'
    });
  }
  if (parsed.data.role !== 'worker' && parsed.data.managerMapping !== undefined) {
    return res.status(400).json({
      message: 'Manager mapping is only valid for worker accounts.'
    });
  }
  if (parsed.data.managerMapping !== undefined && !(await validateManagerMappings(managerMapping))) {
    return res.status(400).json({
      message: 'Select one or more valid, active project managers.'
    });
  }
  const email = parsed.data.email.trim().toLowerCase();
  if (await User.exists({
    email
  })) return res.status(409).json({
    message: 'An account already exists for this email.'
  });
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.create({
    name: parsed.data.name,
    email,
    passwordHash,
    role: parsed.data.role,
    ...(managerMapping.length ? {
      managerMapping
    } : {}),
    createdBy: req.user.id
  });
  await user.populate('managerMapping', 'name email');
  return res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      managerMapping: user.managerMapping,
      active: user.active
    }
  });
};
export const handlePostPasswordReset = async (req, res) => {
  if (!isPasswordResetEmailConfigured()) {
    return res.status(503).json({
      message: 'Password reset email is not configured. Contact your system administrator.'
    });
  }
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({
    message: 'User not found.'
  });
  const filter = {
    _id: req.params.id,
    active: true
  };
  if (req.user.role === 'project_manager') {
    filter._id = {
      $in: await managerUserIds(req.user.id),
      $eq: req.params.id
    };
  }
  const user = await User.findOne(filter).select('name email');
  if (!user) return res.status(404).json({
    message: 'Active team member not found.'
  });
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await User.updateOne({
    _id: user._id
  }, {
    $set: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt
    }
  });
  const resetUrl = new URL(process.env.WEB_APP_URL);
  resetUrl.searchParams.set('resetToken', token);
  try {
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl: resetUrl.toString()
    });
  } catch (error) {
    await User.updateOne({
      _id: user._id,
      passwordResetTokenHash: tokenHash
    }, {
      $unset: {
        passwordResetTokenHash: 1,
        passwordResetExpiresAt: 1
      }
    });
    console.error('Password reset email delivery failed:', error.message);
    return res.status(503).json({
      message: 'Unable to send the password reset email. Check the email service configuration and try again.'
    });
  }
  return res.json({
    message: `Password reset instructions were sent to ${user.email}.`
  });
};
export const handlePostPassword = async (req, res) => {
  const parsed = z.object({
    password: z.string().min(6).max(200)
  }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Password must be between 6 and 200 characters.'
    });
  }
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({
    message: 'User not found.'
  });
  const filter = {
    _id: req.params.id,
    active: true
  };
  if (req.user.role === 'project_manager') {
    filter._id = {
      $in: await managerUserIds(req.user.id),
      $eq: req.params.id
    };
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.findOneAndUpdate(filter, {
    $set: {
      passwordHash
    },
    $unset: {
      passwordResetTokenHash: 1,
      passwordResetExpiresAt: 1
    }
  }, {
    new: true
  }).select('_id');
  if (!user) return res.status(404).json({
    message: 'Active team member not found.'
  });
  return res.json({
    message: 'Password reset successfully.'
  });
};
export const handlePatchRoot = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({
    message: 'User not found.'
  });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({
    message: 'User updates are invalid.',
    errors: parsed.error.issues
  });
  if (req.user.role === 'project_manager' && parsed.data.role !== undefined) {
    return res.status(403).json({
      message: 'Project managers cannot change system roles.'
    });
  }
  if (req.user.role === 'project_manager' && parsed.data.managerMapping !== undefined) {
    return res.status(403).json({
      message: 'Project managers cannot change manager mappings.'
    });
  }
  const filter = {
    _id: req.params.id
  };
  if (req.user.role === 'project_manager') filter._id = {
    $in: await managerUserIds(req.user.id),
    $eq: req.params.id
  };
  const existingUser = await User.findOne(filter).select('role managerMapping');
  if (!existingUser) return res.status(404).json({
    message: 'User not found.'
  });
  if (parsed.data.active === false && req.params.id === req.user.id) {
    return res.status(409).json({
      message: 'You cannot deactivate your own account.'
    });
  }
  if (parsed.data.active !== undefined && req.user.role === 'project_manager' && existingUser.role !== 'worker') {
    return res.status(403).json({
      message: 'Project managers can only change status for workers assigned to them.'
    });
  }
  const updatedRole = parsed.data.role || existingUser.role;
  const managerMapping = parsed.data.managerMapping === undefined ? managerMappingIds(existingUser.managerMapping) : managerMappingIds(parsed.data.managerMapping);
  if (updatedRole === 'worker' && req.user.role === 'admin' && !managerMapping.length) {
    return res.status(400).json({
      message: 'Select a project manager for this worker.'
    });
  }
  if (updatedRole !== 'worker' && parsed.data.managerMapping !== undefined && managerMapping.length) {
    return res.status(400).json({
      message: 'Manager mapping is only valid for worker accounts.'
    });
  }
  if (parsed.data.managerMapping !== undefined && !(updatedRole === 'worker' && managerMapping.length === 0) && !(await validateManagerMappings(managerMapping, managerMappingIds(existingUser.managerMapping)))) {
    return res.status(400).json({
      message: 'Select one or more valid, active project managers.'
    });
  }
  const updates = {
    ...parsed.data,
    ...(parsed.data.managerMapping !== undefined ? {
      managerMapping: updatedRole === 'worker' ? managerMapping : []
    } : {}),
    ...(parsed.data.email ? {
      email: parsed.data.email.toLowerCase().trim()
    } : {}),
    ...(updatedRole !== 'worker' ? {
      managerMapping: []
    } : {})
  };
  const user = await User.findOneAndUpdate(filter, {
    $set: updates
  }, {
    new: true,
    runValidators: true
  }).select('name email role managerMapping active');
  if (!user) return res.status(404).json({
    message: 'User not found.'
  });
  await user.populate('managerMapping', 'name email');
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      managerMapping: user.managerMapping,
      active: user.active
    }
  });
};
export const handleDeleteRoot = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({
    message: 'User not found.'
  });
  if (req.params.id === req.user.id) return res.status(409).json({
    message: 'Administrators cannot delete their own account.'
  });
  if (await Project.exists({
    $or: [{
      manager: req.params.id
    }, {
      assignedWorker: req.params.id
    }]
  })) {
    return res.status(409).json({
      message: 'This user has project history. Deactivate the account to preserve project records.'
    });
  }
  const user = await User.findByIdAndDelete(req.params.id).select('name email');
  if (!user) return res.status(404).json({
    message: 'User not found.'
  });
  return res.json({
    deleted: true
  });
};
