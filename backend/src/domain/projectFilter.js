import mongoose from 'mongoose';

const projectStatuses = ['Draft', 'Open', 'Assigned', 'In Progress', 'Completed', 'Closed', 'Cancelled'];
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function buildProjectFilter(query, user) {
  const filter = user.role === 'worker'
    ? { $or: [{ status: 'Open', assignedWorker: null }, { assignedWorker: user.id }] }
    : user.role === 'project_manager' ? { manager: user.id, hiddenByManagers: { $nin: [user.id] } } : {};
  if (query.status && projectStatuses.includes(String(query.status))) {
    filter.status = query.status === 'Completed'
      ? { $in: ['Completed', 'Closed'] }
      : String(query.status);
  }
  if (query.client) filter['client.name'] = new RegExp(escapeRegex(String(query.client)), 'i');
  if (query.managerId && user.role === 'admin') filter.manager = query.managerId;
  if (query.assignedWorker) {
    if (user.role === 'worker' && String(query.assignedWorker) !== user.id) {
      return { error: { status: 403, message: 'Workers may only filter their own assignments.' } };
    }
    filter.assignedWorker = query.assignedWorker;
  }
  if (query.startDate || query.endDate) {
    filter.startDate = {
      ...(query.startDate ? { $gte: new Date(String(query.startDate)) } : {}),
      ...(query.endDate ? { $lte: new Date(String(query.endDate)) } : {}),
    };
  }
  if (query.priority && ['low', 'standard', 'high', 'urgent'].includes(String(query.priority))) {
    filter.priority = String(query.priority);
  }
  if (query.search) {
    const regex = new RegExp(escapeRegex(String(query.search).trim()), 'i');
    filter.$and = [...(filter.$and || []), { $or: [{ name: regex }, { projectId: regex }, { address: regex }, { 'client.name': regex }] }];
  }
  return { filter };
}

export function buildDashboardProjectFilter(user) {
  const { filter } = buildProjectFilter({}, user);
  if (user.role !== 'project_manager') return filter;
  const managerId = new mongoose.Types.ObjectId(user.id);
  return {
    ...filter,
    manager: managerId,
    hiddenByManagers: { $nin: [managerId] },
  };
}
