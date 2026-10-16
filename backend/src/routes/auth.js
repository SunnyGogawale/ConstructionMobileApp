import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const loginSchema = z.object({ email: z.email(), password: z.string().min(1).max(200) });

router.post('/login', loginLimit, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Enter a valid email and password.' });
  const user = await User.findOne({ email: parsed.data.email.toLowerCase(), active: true }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  const token = jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    subject: user._id.toString(), issuer: 'buildflow-api', expiresIn: '12h',
  });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', authenticate, async (req, res) => {
  const user = await User.findById(req.user.id).select('name email role active');
  if (!user?.active) return res.status(401).json({ message: 'Account is inactive.' });
  return res.json({ user });
});

export default router;
