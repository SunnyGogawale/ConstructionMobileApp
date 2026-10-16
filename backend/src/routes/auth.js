import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const registerLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false });
const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });
const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  password: z.string().min(6).max(200),
});

router.post(['/register', '/signup'], registerLimit, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Account details are invalid.', errors: parsed.error.issues });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    const user = await User.create({
      name: parsed.data.name,
      email,
      passwordHash,
      role: 'worker',
    });
    return res.status(201).json({
      message: 'Your worker account has been created. You can now sign in to the mobile app.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account already exists for this email.' });
    throw error;
  }
});

router.post(['/login', '/signin'], loginLimit, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Enter a valid email and password.' });
  const email = parsed.data.email.trim().toLowerCase();
  const user = await User.findOne({ email, active: true }).select('+passwordHash');
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
