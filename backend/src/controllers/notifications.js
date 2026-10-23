import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
function scopeFor(user, projectIds = null) {
  if (user.role === 'worker') return {
    recipient: user.id
  };
  if (user.role === 'project_manager') return {
    recipient: user.id,
    ...(projectIds ? {
      $or: [{
        project: {
          $in: projectIds
        }
      }, {
        project: null
      }]
    } : {})
  };
  return {
    recipient: user.id
  };
}
export const handleGetRoot = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const filter = {
    recipient: req.user.id
  };
  if (req.query.unread === 'true') filter.readAt = null;
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.search) filter.$text = {
    $search: String(req.query.search).trim()
  };
  if (req.user.role === 'project_manager') {
    const projectIds = await Project.find({
      manager: req.user.id
    }).distinct('_id');
    filter.$or = [{
      project: {
        $in: projectIds
      }
    }, {
      project: null
    }];
  }
  const [notifications, total, unread] = await Promise.all([Notification.find(filter).sort({
    createdAt: -1
  }).skip((page - 1) * limit).limit(limit).populate('project', 'projectId name'), Notification.countDocuments(filter), Notification.countDocuments({
    ...filter,
    readAt: null
  })]);
  return res.json({
    notifications,
    unread,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};
export const handlePatchReadAll = async (req, res) => {
  await Notification.updateMany({
    recipient: req.user.id,
    readAt: null
  }, {
    $set: {
      readAt: new Date()
    }
  });
  return res.json({
    updated: true
  });
};
export const handlePatchRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate({
    _id: req.params.id,
    recipient: req.user.id
  }, {
    $set: {
      readAt: new Date()
    }
  }, {
    new: true
  });
  if (!notification) return res.status(404).json({
    message: 'Notification not found.'
  });
  return res.json({
    notification
  });
};
