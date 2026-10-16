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
  const clauses = [];
  if (req.user.role === 'worker') clauses.push({ worker: req.user.id });
  if (req.user.role === 'project_manager') {
    const projects = await Project.find({ manager: req.user.id }).select('_id');
    clauses.push({ project: { $in: projects.map(project => project._id) } });
  }
  if (req.query.projectId) {
    const id = String(req.query.projectId);
    const project = await Project.findOne(mongoose.isValidObjectId(id) ? { _id: id } : { projectId: id }).select('_id manager assignedWorker');
    if (!project ||
      (req.user.role === 'project_manager' && String(project.manager) !== req.user.id) ||
      (req.user.role === 'worker' && String(project.assignedWorker) !== req.user.id)) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    clauses.push({ project: project._id });
  }
  const search = String(req.query.search || '').trim();
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    clauses.push({ description: new RegExp(escaped, 'i') });
  }
  if (['Pending', 'Approved', 'Revision requested'].includes(String(req.query.status))) {
    clauses.push({ reviewStatus: String(req.query.status) });
  }
  const filter = clauses.length ? { $and: clauses } : {};
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const sortFields = new Set(['createdAt', 'workDate', 'progress', 'reviewStatus']);
  const sortBy = sortFields.has(String(req.query.sortBy)) ? String(req.query.sortBy) : 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const [updates, total] = await Promise.all([
    ProgressUpdate.find(filter).sort({ [sortBy]: sortOrder }).skip((page - 1) * limit).limit(limit).populate('worker', 'name').populate('project', 'projectId name'),
    ProgressUpdate.countDocuments(filter),
  ]);
  return res.json({ updates, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
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
  if (parsed.data.status === 'Approved') {
    await Project.updateOne(
      { _id: update.project._id },
      { $max: { progress: update.progress } },
    );
  }
  return res.json({ update });
});

export default router;
