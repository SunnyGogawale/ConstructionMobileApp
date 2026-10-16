import { Router } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import ProgressUpdate from '../models/ProgressUpdate.js';
import FinanceRecord from '../models/FinanceRecord.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';
import { allowRoles } from '../middleware/auth.js';

const router = Router();
const EMPTY = [];

router.get('/', allowRoles('admin', 'project_manager'), async (req, res) => {
  const projectFilter = req.user.role === 'project_manager' ? { manager: req.user.id } : {};
  const [projects, totalProjects, workerIds, visibleUserIds] = await Promise.all([
    Project.find(projectFilter).select('_id projectId name status budget progress startDate endDate client manager assignedWorker').populate('manager', 'name').sort({ updatedAt: -1 }).limit(250),
    Project.countDocuments(projectFilter),
    Project.find(projectFilter).distinct('assignedWorker'),
    req.user.role === 'admin' ? User.find({}).distinct('_id') : User.find({ $or: [{ createdBy: req.user.id }, { _id: req.user.id }] }).distinct('_id'),
  ]);
  const projectIds = projects.map(project => project._id);
  const userFilter = req.user.role === 'admin' ? { active: true } : { _id: { $in: [...new Set([...workerIds.map(String), ...visibleUserIds.map(String)])] } };
  const financeFilter = { project: { $in: projectIds } };
  const scopedActivity = req.user.role === 'admin'
    ? {}
    : { $or: [{ project: { $in: projectIds } }, { actor: req.user.id, project: null }] };
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 6 * 86400000);
  const [
    totalUsers, activeWorkers, attendanceToday, projectStatusRows, invoiceTotals,
    receivedTotals, monthlyRevenue, attendanceTrend, performanceRows, completionTrend,
    activities, pendingProgress, pendingExpenses, overdueInvoices, notifications,
  ] = await Promise.all([
    User.countDocuments(userFilter),
    User.countDocuments({ ...userFilter, role: 'worker', active: true }),
    Attendance.countDocuments({ project: { $in: projectIds }, dayKey: today }),
    Project.aggregate([{ $match: projectFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    FinanceRecord.aggregate([{ $match: { ...financeFilter, recordType: 'invoice', status: { $nin: ['Cancelled'] } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    FinanceRecord.aggregate([{ $match: { ...financeFilter, recordType: 'payment', status: { $in: ['Paid', 'Partially Paid'] } } }, { $group: { _id: null, total: { $sum: '$amountReceived' } } }]),
    FinanceRecord.aggregate([{ $match: { ...financeFilter, recordType: 'payment', status: { $in: ['Paid', 'Partially Paid'] }, paidAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } }, revenue: { $sum: '$amountReceived' } } }, { $sort: { _id: 1 } }]),
    Attendance.aggregate([{ $match: { project: { $in: projectIds }, checkedInAt: { $gte: sevenDaysAgo } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$checkedInAt' } }, workers: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ProgressUpdate.aggregate([{ $match: { project: { $in: projectIds } } }, { $group: { _id: '$worker', updates: { $sum: 1 }, averageProgress: { $avg: '$progress' } } }, { $sort: { updates: -1 } }, { $limit: 10 }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'worker' } }, { $unwind: { path: '$worker', preserveNullAndEmptyArrays: true } }, { $project: { worker: '$worker.name', updates: 1, averageProgress: { $round: ['$averageProgress', 1] } } }]),
    Project.aggregate([{ $match: { ...projectFilter, status: { $in: ['Completed', 'Closed'] }, updatedAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } }, completed: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Activity.find(scopedActivity).sort({ createdAt: -1 }).limit(8).populate('actor', 'name').populate('project', 'projectId name'),
    ProgressUpdate.find({ project: { $in: projectIds }, reviewStatus: 'Pending' }).sort({ createdAt: -1 }).limit(8).populate('worker', 'name').populate('project', 'projectId name'),
    FinanceRecord.find({ ...financeFilter, recordType: 'expense', status: 'Pending approval' }).sort({ createdAt: -1 }).limit(8).populate('project', 'projectId name'),
    FinanceRecord.find({ ...financeFilter, recordType: 'invoice', dueDate: { $lt: now }, status: { $in: ['Pending', 'Partially Paid'] } }).sort({ dueDate: 1 }).limit(8).populate('project', 'projectId name'),
    Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(8).populate('project', 'projectId name'),
  ]);
  const statusMap = Object.fromEntries(projectStatusRows.map(row => [row._id, row.count]));
  const projectStatus = [
    { name: 'In progress', value: statusMap['In Progress'] || 0, color: '#e87524' },
    { name: 'Awaiting crew', value: statusMap.Open || 0, color: '#d6a04e' },
    { name: 'Completed', value: (statusMap.Completed || 0) + (statusMap.Closed || 0), color: '#338264' },
    { name: 'Cancelled', value: statusMap.Cancelled || 0, color: '#9aa7aa' },
  ];
  const invoiceTotal = invoiceTotals[0]?.total || 0;
  const receivedTotal = receivedTotals[0]?.total || 0;
  const activeProjects = (statusMap.Open || 0) + (statusMap.Assigned || 0) + (statusMap['In Progress'] || 0);
  const pendingApprovals = [...pendingProgress, ...pendingExpenses];
  return res.json({
    summary: {
      totalUsers,
      activeWorkers,
      totalProjects,
      activeProjects,
      completedProjects: (statusMap.Completed || 0) + (statusMap.Closed || 0),
      attendanceToday,
      totalRevenue: receivedTotal,
      pendingPayments: Math.max(0, invoiceTotal - receivedTotal),
    },
    projectStatus,
    monthlyRevenue: monthlyRevenue.map(row => ({ month: row._id, revenue: row.revenue })),
    attendanceTrend: attendanceTrend.map(row => ({ day: row._id, workers: row.workers })),
    workerPerformance: performanceRows,
    completionTrend,
    projects: projects.slice(0, 8),
    activities,
    pendingApprovals,
    overdueInvoices,
    notifications,
  });
});

export default router;
