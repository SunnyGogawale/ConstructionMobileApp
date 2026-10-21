import Activity from '../models/Activity.js';
import User from '../models/User.js';

export async function recordAuditEvent({ actorId, action, description, status, category = 'system', request }) {
  const actor = actorId ? await User.findById(actorId).select('name') : null;
  return Activity.create({
    actor: actorId || null,
    actorName: actor?.name || 'Unknown user',
    action,
    category,
    title: action,
    detail: description,
    status,
    ipAddress: String(request.ip || '').slice(0, 64),
    deviceInfo: String(request.get('user-agent') || '').slice(0, 300),
    entityType: 'user',
    entityId: actorId || null,
  });
}
