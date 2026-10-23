import { Router } from 'express';
import mongoose from 'mongoose';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { z } from 'zod';
import Project from '../models/Project.js';
import Subtask from '../models/Subtask.js';
import SubtaskMaterial from '../models/SubtaskMaterial.js';
import User from '../models/User.js';
import { allowRoles } from '../middleware/auth.js';
import { createSubtaskSchema, isValidSubtaskDateRange, subtaskStatuses, updateSubtaskSchema } from '../domain/subtasks.js';
import { calculateSubtaskMaterialTotal, createSubtaskMaterialSchema, updateSubtaskMaterialSchema } from '../domain/subtaskMaterials.js';
import { PROJECT_EXPORT_HEADERS, projectCsvRow } from '../domain/projectExport.js';
import { buildProjectFilter } from '../domain/projectFilter.js';

const router = Router();
const projectStatuses = ['Draft', 'Open', 'Assigned', 'In Progress', 'Completed', 'Closed', 'Cancelled'];
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
  assignedManagers: z.array(z.string()).max(100).optional(),
});

function projectResponse(project, role) {
  const result = project.toObject();
  if (role !== 'admin') delete result.assignedManagers;
  return result;
}

async function resolveAssignedManagers(managerIds) {
  const uniqueIds = [...new Set(managerIds)];
  if (uniqueIds.some(id => !mongoose.isValidObjectId(id))) return null;
  const managers = await User.find({
    _id: { $in: uniqueIds },
    role: 'project_manager',
    active: true,
  }).select('_id');
  return managers.length === uniqueIds.length ? managers.map(manager => manager._id) : null;
}

function projectFilterForRequest(req, res) {
  const { filter, error } = buildProjectFilter(req.query, req.user);
  if (error) {
    res.status(error.status).json({ message: error.message });
    return null;
  }
  return filter;
}

function projectQueryForRole(filter, role) {
  const query = Project.find(filter).populate('manager', 'name').populate('assignedWorker', 'name');
  if (role === 'admin') query.populate('assignedManagers', 'name');
  else query.select('-assignedManagers');
  return query;
}

router.get('/export', async (req, res, next) => {
  const filter = projectFilterForRequest(req, res);
  if (!filter) return;
  const cursor = projectQueryForRole(filter, req.user.role)
    .sort({ startDate: 1, _id: 1 })
    .lean()
    .cursor();
  const exportedCount = await Project.countDocuments(filter);
  async function* csvRows() {
    yield `\uFEFF${PROJECT_EXPORT_HEADERS.map(value => `"${value}"`).join(',')}\r\n`;
    for await (const project of cursor) yield projectCsvRow(project, req.user.role);
  }
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="projects.csv"',
    'Cache-Control': 'no-store',
    'X-Exported-Count': String(exportedCount),
  });
  try {
    await pipeline(Readable.from(csvRows()), res);
  } catch (streamError) {
    if (res.destroyed) return;
    if (res.headersSent) {
      console.error('Project CSV export failed:', streamError);
      res.destroy(streamError);
      return;
    }
    return next(streamError);
  }
});

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const filter = projectFilterForRequest(req, res);
  if (!filter) return;
  const sortFields = new Set(['startDate', 'endDate', 'name', 'budget', 'status', 'updatedAt']);
  const sortBy = sortFields.has(String(req.query.sortBy)) ? String(req.query.sortBy) : 'startDate';
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
  const projectQuery = projectQueryForRole(filter, req.user.role).sort({ [sortBy]: sortOrder }).skip((page - 1) * limit).limit(limit);
  const [projects, total] = await Promise.all([
    projectQuery,
    Project.countDocuments(filter),
  ]);
  return res.json({ projects: projects.map(project => projectResponse(project, req.user.role)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.post('/', allowRoles('admin', 'project_manager'), async (req, res) => {
  if (req.user.role !== 'admin' && req.body && Object.hasOwn(req.body, 'assignedManagers')) {
    return res.status(403).json({ message: 'Only administrators may assign project managers.' });
  }
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Project details are invalid.', errors: parsed.error.issues });
  if (parsed.data.endDate < parsed.data.startDate) return res.status(400).json({ message: 'Project end date must be after its start date.' });
  const assignedManagers = req.user.role === 'admin' && parsed.data.assignedManagers
    ? await resolveAssignedManagers(parsed.data.assignedManagers)
    : [];
  if (assignedManagers === null) return res.status(400).json({ message: 'Select only active project managers.' });
  const project = await Project.create({
    ...parsed.data,
    assignedManagers,
    projectId: `BLD-${Date.now().toString().slice(-7)}`,
    manager: req.user.id,
  });
  if (req.user.role === 'admin') await project.populate('assignedManagers', 'name');
  return res.status(201).json({ project: projectResponse(project, req.user.role) });
});

router.get('/:projectId', async (req, res) => {
  const idFilter = findProjectFilter(req.params.projectId);
  if (req.user.role === 'project_manager') {
    idFilter.manager = req.user.id;
    idFilter.hiddenByManagers = { $nin: [req.user.id] };
  }
  const projectQuery = Project.findOne(idFilter).populate('manager', 'name').populate('assignedWorker', 'name');
  if (req.user.role === 'admin') projectQuery.populate('assignedManagers', 'name');
  else projectQuery.select('-assignedManagers');
  const project = await projectQuery;
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  if (req.user.role === 'worker' && !['Open'].includes(project.status) && String(project.assignedWorker?._id || project.assignedWorker) !== req.user.id) {
    return res.status(404).json({ message: 'Project not found.' });
  }
  if (req.user.role === 'project_manager' && String(project.manager?._id || project.manager) !== req.user.id) {
    return res.status(404).json({ message: 'Project not found.' });
  }
  return res.json({ project: projectResponse(project, req.user.role) });
});

async function findSubtaskProject(projectId, user) {
  const filter = findProjectFilter(projectId);
  if (user.role === 'project_manager') {
    filter.manager = user.id;
    filter.hiddenByManagers = { $nin: [user.id] };
  }
  return Project.findOne(filter).select('_id manager assignedWorker startDate endDate');
}

async function findAuthorizedSubtask(project, subtaskId, user) {
  if (!mongoose.isValidObjectId(subtaskId)) return null;
  const filter = { _id: subtaskId, project: project._id };
  if (user.role === 'worker') filter.assignedWorker = user.id;
  return Subtask.findOne(filter).populate('assignedWorker', 'name').populate('project', 'name');
}

router.get('/:projectId/subtasks', allowRoles('admin', 'project_manager', 'worker'), async (req, res) => {
  const project = await findSubtaskProject(req.params.projectId, req.user);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const filter = { project: project._id };
  if (req.user.role === 'worker') filter.assignedWorker = req.user.id;
  const subtasks = await Subtask.find(filter).sort({ dueDate: 1, createdAt: -1 }).populate('assignedWorker', 'name');
  return res.json({ subtasks });
});

router.get('/:projectId/subtasks/:subtaskId', allowRoles('admin', 'project_manager', 'worker'), async (req, res) => {
  const project = await findSubtaskProject(req.params.projectId, req.user);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const subtask = await findAuthorizedSubtask(project, req.params.subtaskId, req.user);
  if (!subtask) return res.status(404).json({ message: 'Subtask not found.' });
  await subtask.populate('createdBy', 'name');
  return res.json({ subtask });
});

router.get('/:projectId/subtasks/:subtaskId/materials', allowRoles('admin', 'project_manager', 'worker'), async (req, res) => {
  const project = await findSubtaskProject(req.params.projectId, req.user);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const subtask = await findAuthorizedSubtask(project, req.params.subtaskId, req.user);
  if (!subtask) return res.status(404).json({ message: 'Subtask not found.' });
  const materials = await SubtaskMaterial.find({ project: project._id, subtask: subtask._id }).sort({ date: -1, createdAt: -1 });
  return res.json({ materials });
});

router.get('/:projectId/subtasks/:subtaskId/materials/:materialId', allowRoles('admin', 'project_manager', 'worker'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.materialId)) return res.status(404).json({ message: 'Material not found.' });
  const project = await findSubtaskProject(req.params.projectId, req.user);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const subtask = await findAuthorizedSubtask(project, req.params.subtaskId, req.user);
  if (!subtask) return res.status(404).json({ message: 'Subtask not found.' });
  const material = await SubtaskMaterial.findOne({
    _id: req.params.materialId,
    project: project._id,
    subtask: subtask._id,
  })
    .populate('project', 'name')
    .populate('subtask', 'title')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');
  if (!material) return res.status(404).json({ message: 'Material not found.' });
  return res.json({ material });
});

router.post('/:projectId/subtasks/:subtaskId/materials', allowRoles('admin', 'project_manager'), async (req, res) => {
  const project = await findSubtaskProject(req.params.projectId, req.user);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const subtask = await findAuthorizedSubtask(project, req.params.subtaskId, req.user);
  if (!subtask) return res.status(404).json({ message: 'Subtask not found.' });
  const parsed = createSubtaskMaterialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Material details are invalid.', errors: parsed.error.issues });
  const material = await SubtaskMaterial.create({
    ...parsed.data,
    project: project._id,
    subtask: subtask._id,
    createdBy: req.user.id,
    updatedBy: req.user.id,
    totalCost: calculateSubtaskMaterialTotal(parsed.data.quantity, parsed.data.unitPrice),
  });
  return res.status(201).json({ material });
});

router.patch('/:projectId/subtasks/:subtaskId/materials/:materialId', allowRoles('admin', 'project_manager'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.materialId)) return res.status(404).json({ message: 'Material not found.' });
  const project = await findSubtaskProject(req.params.projectId, req.user);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const subtask = await findAuthorizedSubtask(project, req.params.subtaskId, req.user);
  if (!subtask) return res.status(404).json({ message: 'Subtask not found.' });
  const parsed = updateSubtaskMaterialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Material updates are invalid.', errors: parsed.error.issues });
  const existing = await SubtaskMaterial.findOne({
    _id: req.params.materialId,
    project: project._id,
    subtask: subtask._id,
  }).select('quantity unitPrice');
  if (!existing) return res.status(404).json({ message: 'Material not found.' });
  const updates = { ...parsed.data };
  const quantity = updates.quantity ?? existing.quantity;
  const unitPrice = updates.unitPrice ?? existing.unitPrice;
  updates.totalCost = calculateSubtaskMaterialTotal(quantity, unitPrice);
  updates.updatedBy = req.user.id;
  const material = await SubtaskMaterial.findOneAndUpdate(
    { _id: existing._id, project: project._id, subtask: subtask._id },
    { $set: updates },
    { new: true, runValidators: true },
  );
  return res.json({ material });
});

router.delete('/:projectId/subtasks/:subtaskId/materials/:materialId', allowRoles('admin', 'project_manager'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.materialId)) return res.status(404).json({ message: 'Material not found.' });
  const project = await findSubtaskProject(req.params.projectId, req.user);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const subtask = await findAuthorizedSubtask(project, req.params.subtaskId, req.user);
  if (!subtask) return res.status(404).json({ message: 'Subtask not found.' });
  const material = await SubtaskMaterial.findOneAndDelete({
    _id: req.params.materialId,
    project: project._id,
    subtask: subtask._id,
  });
  if (!material) return res.status(404).json({ message: 'Material not found.' });
  return res.json({ deleted: true });
});

router.post('/:projectId/subtasks', allowRoles('admin', 'project_manager'), async (req, res) => {
  const project = await findSubtaskProject(req.params.projectId, req.user);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const parsed = createSubtaskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Subtask details are invalid.', errors: parsed.error.issues });
  if (!isValidSubtaskDateRange(parsed.data.startDate, parsed.data.dueDate)) {
    return res.status(400).json({ message: 'Subtask due date must be on or after its start date.' });
  }
  if (!project.assignedWorker || String(project.assignedWorker) !== parsed.data.assignedWorker) {
    return res.status(400).json({ message: 'Select the worker assigned to this project.' });
  }
  const worker = await User.findOne({ _id: parsed.data.assignedWorker, role: 'worker', active: true }).select('_id');
  if (!worker) return res.status(400).json({ message: 'Select an active worker assigned to this project.' });
  const subtask = await Subtask.create({ ...parsed.data, project: project._id, assignedWorker: worker._id, createdBy: req.user.id });
  await subtask.populate('assignedWorker', 'name');
  return res.status(201).json({ subtask });
});

router.patch('/:projectId/subtasks/:subtaskId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.subtaskId)) return res.status(404).json({ message: 'Subtask not found.' });
  const project = await findSubtaskProject(req.params.projectId, req.user);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  if (req.user.role === 'worker') {
    if (Object.keys(req.body || {}).some(field => field !== 'status')) {
      return res.status(403).json({ message: 'Workers may only update subtask status.' });
    }
    const status = z.enum(subtaskStatuses).safeParse(req.body?.status);
    if (!status.success) return res.status(400).json({ message: 'Subtask status is invalid.' });
    const subtask = await Subtask.findOneAndUpdate(
      { _id: req.params.subtaskId, project: project._id, assignedWorker: req.user.id },
      { $set: { status: status.data } },
      { new: true, runValidators: true },
    ).populate('assignedWorker', 'name');
    if (!subtask) return res.status(404).json({ message: 'Subtask not found.' });
    return res.json({ subtask });
  }
  if (!['admin', 'project_manager'].includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to update subtasks.' });
  }
  const parsed = updateSubtaskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Subtask updates are invalid.', errors: parsed.error.issues });
  const existingSubtask = await Subtask.findOne({ _id: req.params.subtaskId, project: project._id }).select('startDate dueDate');
  if (!existingSubtask) return res.status(404).json({ message: 'Subtask not found.' });
  const startDate = parsed.data.startDate || existingSubtask.startDate;
  const dueDate = parsed.data.dueDate || existingSubtask.dueDate;
  if (!isValidSubtaskDateRange(startDate, dueDate)) {
    return res.status(400).json({ message: 'Subtask due date must be on or after its start date.' });
  }
  if (parsed.data.assignedWorker && String(project.assignedWorker) !== parsed.data.assignedWorker) {
    return res.status(400).json({ message: 'Select the worker assigned to this project.' });
  }
  const updates = { ...parsed.data };
  if (updates.assignedWorker) {
    const worker = await User.findOne({ _id: updates.assignedWorker, role: 'worker', active: true }).select('_id');
    if (!worker) return res.status(400).json({ message: 'Select an active worker assigned to this project.' });
    updates.assignedWorker = worker._id;
  }
  const subtask = await Subtask.findOneAndUpdate(
    { _id: req.params.subtaskId, project: project._id },
    { $set: updates },
    { new: true, runValidators: true },
  ).populate('assignedWorker', 'name');
  if (!subtask) return res.status(404).json({ message: 'Subtask not found.' });
  return res.json({ subtask });
});

router.delete('/:projectId/subtasks/:subtaskId', allowRoles('admin', 'project_manager'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.subtaskId)) return res.status(404).json({ message: 'Subtask not found.' });
  const project = await findSubtaskProject(req.params.projectId, req.user);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const subtask = await Subtask.findOneAndDelete({ _id: req.params.subtaskId, project: project._id });
  if (!subtask) return res.status(404).json({ message: 'Subtask not found.' });
  await SubtaskMaterial.deleteMany({ project: project._id, subtask: subtask._id });
  return res.json({ deleted: true });
});

const updateSchema = createSchema.partial().omit({ status: true }).extend({ status: z.enum(projectStatuses).optional() }).refine(value => Object.keys(value).length > 0);

router.patch('/:projectId', allowRoles('admin', 'project_manager'), async (req, res) => {
  if (req.user.role !== 'admin' && req.body && Object.hasOwn(req.body, 'assignedManagers')) {
    return res.status(403).json({ message: 'Only administrators may assign project managers.' });
  }
  if (req.user.role !== 'admin' && req.body && Object.hasOwn(req.body, 'status')) {
    return res.status(403).json({ message: 'Only administrators may update project status.' });
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Project updates are invalid.', errors: parsed.error.issues });
  if (parsed.data.startDate && parsed.data.endDate && parsed.data.endDate < parsed.data.startDate) return res.status(400).json({ message: 'Project end date must be after its start date.' });
  const updates = { ...parsed.data };
  if (Object.hasOwn(updates, 'assignedManagers')) {
    updates.assignedManagers = await resolveAssignedManagers(updates.assignedManagers);
    if (updates.assignedManagers === null) return res.status(400).json({ message: 'Select only active project managers.' });
  }
  const filter = findProjectFilter(req.params.projectId);
  if (req.user.role === 'project_manager') {
    filter.manager = req.user.id;
    filter.hiddenByManagers = { $nin: [req.user.id] };
  }
  const projectQuery = Project.findOneAndUpdate(filter, { $set: updates }, { new: true, runValidators: true }).populate('manager', 'name').populate('assignedWorker', 'name');
  if (req.user.role === 'admin') projectQuery.populate('assignedManagers', 'name');
  else projectQuery.select('-assignedManagers');
  const project = await projectQuery;
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  return res.json({ project: projectResponse(project, req.user.role) });
});

router.post('/:projectId/assign', allowRoles('admin', 'project_manager'), async (req, res) => {
  const workerId = z.string().safeParse(req.body.workerId);
  if (!workerId.success || !mongoose.isValidObjectId(workerId.data)) return res.status(400).json({ message: 'A valid worker ID is required.' });
  const worker = await User.findOne({ _id: workerId.data, role: 'worker', active: true }).select('_id');
  if (!worker) return res.status(404).json({ message: 'Active worker not found.' });
  const filter = { ...findProjectFilter(req.params.projectId), status: { $in: ['Open', 'Assigned'] } };
  if (req.user.role === 'project_manager') {
    filter.manager = req.user.id;
    filter.hiddenByManagers = { $nin: [req.user.id] };
  }
  const projectQuery = Project.findOneAndUpdate(filter, { $set: { assignedWorker: worker._id, assignedAt: new Date(), status: 'Assigned' } }, { new: true, runValidators: true }).populate('assignedWorker', 'name').populate('manager', 'name');
  if (req.user.role === 'admin') projectQuery.populate('assignedManagers', 'name');
  else projectQuery.select('-assignedManagers');
  const project = await projectQuery;
  if (!project) return res.status(409).json({ message: 'Project is not available for assignment.' });
  return res.json({ project: projectResponse(project, req.user.role) });
});

router.delete('/:projectId', allowRoles('admin', 'project_manager'), async (req, res) => {
  const filter = findProjectFilter(req.params.projectId);
  if (req.user.role === 'project_manager') {
    const project = await Project.findOneAndUpdate(
      { ...filter, manager: req.user.id },
      { $addToSet: { hiddenByManagers: req.user.id } },
      { new: true },
    ).select('_id');
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    return res.json({ hidden: true, projectId: String(project._id) });
  }
  const projectQuery = Project.findOneAndUpdate(filter, { $set: { status: 'Cancelled' } }, { new: true, runValidators: true });
  projectQuery.populate('assignedManagers', 'name');
  const project = await projectQuery;
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  return res.json({ project: projectResponse(project, req.user.role), cancelled: true });
});

router.post('/:projectId/accept', allowRoles('worker'), async (req, res) => {
  const idFilter = findProjectFilter(req.params.projectId);
  const project = await Project.findOneAndUpdate(
    { ...idFilter, status: 'Open', assignedWorker: null },
    { $set: { status: 'Assigned', assignedWorker: req.user.id, assignedAt: new Date() } },
    { new: true, runValidators: true },
  );
  if (!project) return res.status(409).json({ message: 'This project is no longer available. Refresh the available-project list.' });
  return res.json({ project: projectResponse(project, req.user.role) });
});

export default router;
