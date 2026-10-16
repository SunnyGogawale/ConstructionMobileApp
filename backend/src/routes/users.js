import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { z } from 'zod';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { allowRoles } from '../middleware/auth.js';

const router = Router();
const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  password: z.string().min(12).max(200),
  role: z.enum(['admin', 'project_manager', 'worker']),
});
const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.email().optional(),
  active: z.boolean().optional(),
  role: z.enum(['admin', 'project_manager', 'worker']).optional(),
}).refine(value => Object.keys(value).length > 0);

async function managerUserIds(managerId) {
  const projects = await Project.find({ manager: managerId }).select('_id assignedWorker');
  const createdUsers = await User.find({ createdBy: managerId }).distinct('_id');
  return [...new Set([managerId, ...createdUsers.map(id => id.toString()), ...projects.map(project => project.assignedWorker).filter(Boolean).map(id => id.toString())])];
}

router.get('/', allowRoles('admin', 'project_manager'), async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { _id: { $in: await managerUserIds(req.user.id) } };
  const users = await User.find(filter).select('name email role active createdAt').sort({ name: 1 }).limit(500);
  return res.json({ users });
});

router.post('/', allowRoles('admin', 'project_manager'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'User details are invalid.', errors: parsed.error.issues });
  if (req.user.role === 'project_manager' && parsed.data.role !== 'worker') {
    return res.status(403).json({ message: 'Project managers may invite workers but cannot assign system roles.' });
  }
  const email = parsed.data.email.trim().toLowerCase();
  if (await User.exists({ email })) return res.status(409).json({ message: 'An account already exists for this email.' });
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.create({ name: parsed.data.name, email, passwordHash, role: parsed.data.role, createdBy: req.user.id });
  return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active } });
});

router.patch('/:id', allowRoles('admin', 'project_manager'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'User not found.' });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'User updates are invalid.', errors: parsed.error.issues });
  if (req.user.role === 'project_manager' && parsed.data.role !== undefined) {
    return res.status(403).json({ message: 'Project managers cannot change system roles.' });
  }
  const filter = { _id: req.params.id };
  if (req.user.role === 'project_manager') filter._id = { $in: await managerUserIds(req.user.id), $eq: req.params.id };
  const user = await User.findOneAndUpdate(filter, {
    $set: { ...parsed.data, ...(parsed.data.email ? { email: parsed.data.email.toLowerCase().trim() } : {}) },
  }, { new: true, runValidators: true }).select('name email role active');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  return res.json({ user });
});

router.delete('/:id', allowRoles('admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'User not found.' });
  if (req.params.id === req.user.id) return res.status(409).json({ message: 'Administrators cannot delete their own account.' });
  if (await Project.exists({ $or: [{ manager: req.params.id }, { assignedWorker: req.params.id }] })) {
    return res.status(409).json({ message: 'This user has project history. Deactivate the account to preserve project records.' });
  }
  const user = await User.findByIdAndDelete(req.params.id).select('name email');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  return res.json({ deleted: true });
});

export default router;
