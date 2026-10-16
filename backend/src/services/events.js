import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

export async function recordEvent({ actorId, action, category, title, detail = '', projectId = null, entityType = '', entityId = null, extraRecipients = [] }) {
  const actor = actorId ? await User.findById(actorId).select('name') : null;
  const project = projectId ? await Project.findById(projectId).select('manager assignedWorker') : null;
  const activity = await Activity.create({
    actor: actorId || null,
    actorName: actor?.name || 'System',
    action,
    category,
    title,
    detail,
    project: project?._id || null,
    entityType,
    entityId,
  });
  const recipients = new Set(extraRecipients.map(String));
  if (project?.manager) recipients.add(String(project.manager));
  if (project?.assignedWorker) recipients.add(String(project.assignedWorker));
  if (actorId) recipients.delete(String(actorId));
  if (recipients.size) {
    await Notification.insertMany([...recipients].map(recipient => ({
      recipient,
      type: action,
      category: ['project', 'assignment', 'attendance', 'progress', 'finance', 'system'].includes(category) ? category : 'system',
      title,
      message: detail || title,
      project: project?._id || null,
      recordType: entityType,
      recordId: entityId,
    })));
  }
  return activity;
}
