import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { recordAuditEvent } from '../services/audit.js';

const router = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const registerLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false });
const passwordResetLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false });
const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });
const passwordResetSchema = z.object({
  token: z.string().min(32).max(200),
  password: z.string().min(6).max(200),
});

async function recordAuthAudit(event) {
  try {
    await recordAuditEvent(event);
  } catch (error) {
    console.error('Authentication activity logging failed:', error);
  }
}
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
    if (user) {
      await recordAuthAudit({
        actorId: user._id,
        action: 'Login',
        description: 'Sign-in attempt failed because the password was incorrect.',
        status: 'failure',
        request: req,
      });
    }
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  await recordAuthAudit({
    actorId: user._id,
    action: 'Login',
    description: 'Signed in successfully.',
    status: 'success',
    request: req,
  });
  const token = jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    subject: user._id.toString(), issuer: 'buildflow-api', expiresIn: '12h',
  });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post('/logout', authenticate, (_req, res) => {
  return res.json({ message: 'Signed out.' });
});

router.post('/password-reset', passwordResetLimit, async (req, res) => {
  const parsed = passwordResetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'A valid reset link and password of at least 6 characters are required.' });
  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.findOneAndUpdate({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
    active: true,
  }, {
    $set: { passwordHash },
    $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 },
  }, { new: true }).select('_id');
  if (!user) return res.status(400).json({ message: 'This password reset link is invalid or expired. Request a new reset link.' });
  await recordAuthAudit({
    actorId: user._id,
    action: 'Password reset',
    description: 'Password changed using a one-time reset link.',
    status: 'success',
    request: req,
  });
  return res.json({ message: 'Your password has been reset. You can now sign in with your new password.' });
});

router.get('/me', authenticate, async (req, res) => {
  const user = await User.findById(req.user.id).select('name email role active');
  if (!user?.active) return res.status(401).json({ message: 'Account is inactive.' });
  return res.json({ user });
});

export default router;
