import { Router } from 'express';
import { z } from 'zod';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import { allowRoles } from '../middleware/auth.js';

const router = Router();
const createSchema = z.object({
  name: z.string().trim().min(2).max(180),
  contactName: z.string().trim().max(120).optional(),
  contactEmail: z.email().optional().or(z.literal('')),
  contactPhone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(300).optional(),
});
const updateSchema = createSchema.partial().extend({ active: z.boolean().optional() }).refine(value => Object.keys(value).length > 0);

router.get('/', allowRoles('admin', 'project_manager'), async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const search = String(req.query.search || '').trim();
  const filter = { active: req.query.active === 'false' ? false : true };
  if (search) filter.$text = { $search: search };
  if (req.user.role === 'project_manager') {
    const projects = await Project.find({ manager: req.user.id }).distinct('client.name');
    filter.$or = [{ createdBy: req.user.id }, { name: { $in: projects } }];
  }
  const [clients, total] = await Promise.all([
    Client.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit),
    Client.countDocuments(filter),
  ]);
  return res.json({ clients, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.post('/', allowRoles('admin', 'project_manager'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Client details are invalid.', errors: parsed.error.issues });
  const normalizedName = parsed.data.name.toLowerCase();
  try {
    const client = await Client.create({ ...parsed.data, normalizedName, createdBy: req.user.id });
    return res.status(201).json({ client });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A client with this name already exists.' });
    throw error;
  }
});

router.patch('/:id', allowRoles('admin', 'project_manager'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Client updates are invalid.', errors: parsed.error.issues });
  const filter = { _id: req.params.id };
  if (req.user.role === 'project_manager') filter.createdBy = req.user.id;
  const update = { ...parsed.data };
  if (update.name) update.normalizedName = update.name.toLowerCase();
  const client = await Client.findOneAndUpdate(filter, { $set: update }, { new: true, runValidators: true });
  if (!client) return res.status(404).json({ message: 'Client not found.' });
  return res.json({ client });
});

router.delete('/:id', allowRoles('admin', 'project_manager'), async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === 'project_manager') filter.createdBy = req.user.id;
  const client = await Client.findOne(filter);
  if (!client) return res.status(404).json({ message: 'Client not found.' });
  client.active = false;
  await client.save();
  return res.json({ client, deactivated: true });
});

export default router;
