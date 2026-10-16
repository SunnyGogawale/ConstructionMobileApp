import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { allowRoles } from '../middleware/auth.js';

const router = Router();
const projectStatuses = ['Draft', 'Open', 'Assigned', 'In Progress', 'Completed', 'Closed', 'Cancelled'];
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const findProjectFilter = projectId => mongoose.isValidObjectId(projectId) ? { _id: projectId } : { projectId };
const createSchema = z.object({
  name: z.string().trim().min(2).max(180),
  description: z.string().max(5000).optional(),
  client: z.object({ name: z.string().trim().min(1), contactName: z.string().optional(), contactEmail: z.string().optional(), contactPhone: z.string().optional() }),
  address: z.string().trim().min(4),
  location: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), radiusMetres: z.number().int().min(1).max(1000).default(100) }),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budget: z.number().min(0).default(0),
  attachments: z.array(z.url()).max(20).default([]),
  priority: z.enum(['low', 'standard', 'high', 'urgent']).default('standard'),
  status: z.enum(['Draft', 'Open']).default('Open'),
});

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const filter = req.user.role === 'worker'
    ? { $or: [{ status: 'Open', assignedWorker: null }, { assignedWorker: req.user.id }] }
    : req.user.role === 'project_manager' ? { manager: req.user.id } : {};
  if (req.query.status && projectStatuses.includes(String(req.query.status))) filter.status = String(req.query.status);
  if (req.query.client) filter['client.name'] = new RegExp(escapeRegex(String(req.query.client)), 'i');
  if (req.query.managerId && req.user.role === 'admin') filter.manager = req.query.managerId;
  if (req.query.assignedWorker) {
    if (req.user.role === 'worker' && String(req.query.assignedWorker) !== req.user.id) return res.status(403).json({ message: 'Workers may only filter their own assignments.' });
    filter.assignedWorker = req.query.assignedWorker;
  }
  if (req.query.startDate || req.query.endDate) filter.startDate = { ...(req.query.startDate ? { $gte: new Date(String(req.query.startDate)) } : {}), ...(req.query.endDate ? { $lte: new Date(String(req.query.endDate)) } : {}) };
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
    filter.$and = [...(filter.$and || []), { $or: [{ name: regex }, { projectId: regex }, { address: regex }, { 'client.name': regex }] }];
  }
  const sortFields = new Set(['startDate', 'endDate', 'name', 'budget', 'status', 'updatedAt']);
  const sortBy = sortFields.has(String(req.query.sortBy)) ? String(req.query.sortBy) : 'startDate';
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ [sortBy]: sortOrder }).skip((page - 1) * limit).limit(limit).populate('manager', 'name').populate('assignedWorker', 'name'),
    Project.countDocuments(filter),
  ]);
  return res.json({ projects, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.post('/', allowRoles('admin', 'project_manager'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Project details are invalid.', errors: parsed.error.issues });
  if (parsed.data.endDate < parsed.data.startDate) return res.status(400).json({ message: 'Project end date must be after its start date.' });
  const project = await Project.create({
    ...parsed.data,
    projectId: `BLD-${Date.now().toString().slice(-7)}`,
    manager: req.user.id,
  });
  return res.status(201).json({ project });
});

router.get('/:projectId', async (req, res) => {
  const idFilter = findProjectFilter(req.params.projectId);
  const project = await Project.findOne(idFilter).populate('manager', 'name').populate('assignedWorker', 'name');
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  if (req.user.role === 'worker' && !['Open'].includes(project.status) && String(project.assignedWorker?._id || project.assignedWorker) !== req.user.id) {
    return res.status(404).json({ message: 'Project not found.' });
  }
  if (req.user.role === 'project_manager' && String(project.manager?._id || project.manager) !== req.user.id) {
    return res.status(404).json({ message: 'Project not found.' });
  }
  return res.json({ project });
});

const updateSchema = createSchema.partial().omit({ status: true }).extend({ status: z.enum(projectStatuses).optional() }).refine(value => Object.keys(value).length > 0);

router.patch('/:projectId', allowRoles('admin', 'project_manager'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Project updates are invalid.', errors: parsed.error.issues });
  if (parsed.data.startDate && parsed.data.endDate && parsed.data.endDate < parsed.data.startDate) return res.status(400).json({ message: 'Project end date must be after its start date.' });
  const filter = findProjectFilter(req.params.projectId);
  if (req.user.role === 'project_manager') filter.manager = req.user.id;
  const project = await Project.findOneAndUpdate(filter, { $set: parsed.data }, { new: true, runValidators: true }).populate('manager', 'name').populate('assignedWorker', 'name');
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  return res.json({ project });
});

router.post('/:projectId/assign', allowRoles('admin', 'project_manager'), async (req, res) => {
  const workerId = z.string().safeParse(req.body.workerId);
  if (!workerId.success || !mongoose.isValidObjectId(workerId.data)) return res.status(400).json({ message: 'A valid worker ID is required.' });
  const worker = await User.findOne({ _id: workerId.data, role: 'worker', active: true }).select('_id');
  if (!worker) return res.status(404).json({ message: 'Active worker not found.' });
  const filter = { ...findProjectFilter(req.params.projectId), status: { $in: ['Open', 'Assigned'] } };
  if (req.user.role === 'project_manager') filter.manager = req.user.id;
  const project = await Project.findOneAndUpdate(filter, { $set: { assignedWorker: worker._id, assignedAt: new Date(), status: 'Assigned' } }, { new: true, runValidators: true }).populate('assignedWorker', 'name').populate('manager', 'name');
  if (!project) return res.status(409).json({ message: 'Project is not available for assignment.' });
  return res.json({ project });
});

router.delete('/:projectId', allowRoles('admin', 'project_manager'), async (req, res) => {
  const filter = findProjectFilter(req.params.projectId);
  if (req.user.role === 'project_manager') filter.manager = req.user.id;
  const project = await Project.findOneAndUpdate(filter, { $set: { status: 'Cancelled' } }, { new: true, runValidators: true });
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  return res.json({ project, cancelled: true });
});

router.post('/:projectId/accept', allowRoles('worker'), async (req, res) => {
  const idFilter = findProjectFilter(req.params.projectId);
  const project = await Project.findOneAndUpdate(
    { ...idFilter, status: 'Open', assignedWorker: null },
    { $set: { status: 'Assigned', assignedWorker: req.user.id, assignedAt: new Date() } },
    { new: true, runValidators: true },
  );
  if (!project) return res.status(409).json({ message: 'This project is no longer available. Refresh the available-project list.' });
  return res.json({ project });
});

export default router;
