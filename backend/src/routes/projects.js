import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Project from '../models/Project.js';
import { allowRoles } from '../middleware/auth.js';

const router = Router();
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
  const filter = req.user.role === 'worker'
    ? { $or: [{ status: 'Open', assignedWorker: null }, { assignedWorker: req.user.id }] }
    : req.user.role === 'project_manager' ? { manager: req.user.id } : {};
  const projects = await Project.find(filter).sort({ startDate: 1 }).limit(200).populate('manager', 'name').populate('assignedWorker', 'name');
  return res.json({ projects });
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
  const idFilter = mongoose.isValidObjectId(req.params.projectId)
    ? { _id: req.params.projectId }
    : { projectId: req.params.projectId };
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

router.post('/:projectId/accept', allowRoles('worker'), async (req, res) => {
  const idFilter = mongoose.isValidObjectId(req.params.projectId)
    ? { _id: req.params.projectId }
    : { projectId: req.params.projectId };
  const project = await Project.findOneAndUpdate(
    { ...idFilter, status: 'Open', assignedWorker: null },
    { $set: { status: 'Assigned', assignedWorker: req.user.id, assignedAt: new Date() } },
    { new: true, runValidators: true },
  );
  if (!project) return res.status(409).json({ message: 'This project is no longer available. Refresh the available-project list.' });
  return res.json({ project });
});

export default router;
