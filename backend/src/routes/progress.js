import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Project from '../models/Project.js';
import ProgressUpdate from '../models/ProgressUpdate.js';
import { allowRoles } from '../middleware/auth.js';

const router = Router();
const updateSchema = z.object({
  projectId: z.string().min(1),
  description: z.string().trim().min(10).max(3000),
  progress: z.number().int().min(0).max(100),
  completedTasks: z.array(z.string().max(240)).max(100).default([]),
  pendingTasks: z.array(z.string().max(240)).max(100).default([]),
  remarks: z.string().max(2000).optional(),
  photos: z.array(z.string().url()).max(20).default([]),
});

router.post('/', allowRoles('worker'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Progress details are invalid.', errors: parsed.error.issues });
  const idFilter = mongoose.isValidObjectId(parsed.data.projectId)
    ? { _id: parsed.data.projectId }
    : { projectId: parsed.data.projectId };
  const project = await Project.findOne({ ...idFilter, assignedWorker: req.user.id });
  if (!project) return res.status(404).json({ message: 'Assigned project not found.' });
  const update = await ProgressUpdate.create({
    project: project._id,
    worker: req.user.id,
    workDate: new Date(),
    description: parsed.data.description,
    progress: parsed.data.progress,
    completedTasks: parsed.data.completedTasks,
    pendingTasks: parsed.data.pendingTasks,
    remarks: parsed.data.remarks || '',
    photoUrls: parsed.data.photos,
  });
  return res.status(201).json({ update });
});

router.get('/', async (req, res) => {
  const filter = req.user.role === 'worker' ? { worker: req.user.id } : {};
  if (req.user.role === 'project_manager') {
    const projects = await Project.find({ manager: req.user.id }).select('_id');
    filter.project = { $in: projects.map(project => project._id) };
  }
  const updates = await ProgressUpdate.find(filter).sort({ createdAt: -1 }).limit(100).populate('worker', 'name').populate('project', 'projectId name');
  return res.json({ updates });
});

router.patch('/:updateId/review', allowRoles('admin', 'project_manager'), async (req, res) => {
  const reviewSchema = z.object({ status: z.enum(['Approved', 'Revision requested']), feedback: z.string().max(1000).optional() });
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Review status is invalid.' });
  const update = await ProgressUpdate.findById(req.params.updateId).populate('project', 'manager');
  if (!update) return res.status(404).json({ message: 'Progress update not found.' });
  if (req.user.role === 'project_manager' && String(update.project.manager) !== req.user.id) return res.status(404).json({ message: 'Progress update not found.' });
  update.reviewStatus = parsed.data.status;
  update.reviewFeedback = parsed.data.feedback || '';
  await update.save();
  return res.json({ update });
});

export default router;
