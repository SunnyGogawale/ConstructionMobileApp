import { Router } from 'express';
import { z } from 'zod';
import SystemSetting from '../models/SystemSetting.js';
import { allowRoles } from '../middleware/auth.js';

const router = Router();
const settingSchema = z.object({ value: z.unknown() });
const workspaceProfileSchema = z.object({
  companyName: z.string().trim().max(180),
  primaryContact: z.string().trim().max(120),
  businessEmail: z.email().or(z.literal('')),
  attendanceRadius: z.union([z.number().int().min(1).max(1000), z.literal('')]),
}).strict();

router.get('/', allowRoles('admin'), async (_req, res) => {
  const settings = await SystemSetting.find().sort({ key: 1 }).lean();
  return res.json({ settings });
});

router.put('/:key', allowRoles('admin'), async (req, res) => {
  if (!/^[a-z][a-zA-Z0-9_.-]{1,79}$/.test(req.params.key)) return res.status(400).json({ message: 'Setting key is invalid.' });
  const parsed = settingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Setting value is invalid.' });
  if (req.params.key === 'workspace.profile') {
    const profile = workspaceProfileSchema.safeParse(parsed.data.value);
    if (!profile.success) return res.status(400).json({ message: 'Workspace profile details are invalid.', errors: profile.error.issues });
    parsed.data.value = profile.data;
  }
  const setting = await SystemSetting.findOneAndUpdate(
    { key: req.params.key },
    { $set: { value: parsed.data.value, updatedBy: req.user.id } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
  return res.json({ setting });
});

export default router;
