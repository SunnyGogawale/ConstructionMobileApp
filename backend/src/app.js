import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import attendanceRoutes from './routes/attendance.js';
import progressRoutes from './routes/progress.js';
import financeRoutes from './routes/finance.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/uploads.js';
import clientRoutes from './routes/clients.js';
import notificationRoutes from './routes/notifications.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';
import settingRoutes from './routes/settings.js';
import { handleGetImage, uploadDirectory } from './controllers/uploads.js';
import { authenticate } from './middleware/auth.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',').map(value => value.trim()) || true }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(uploadDirectory, { fallthrough: true, maxAge: '1d' }));
app.get('/uploads/:filename', handleGetImage);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/projects', authenticate, projectRoutes);
app.use('/api/attendance', authenticate, attendanceRoutes);
app.use('/api/progress', authenticate, progressRoutes);
app.use('/api/finance', authenticate, financeRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/clients', authenticate, clientRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/settings', authenticate, settingRoutes);
app.use('/api/uploads', authenticate, uploadRoutes);

app.use((error, _req, res, _next) => {
  const status = error.status || (error.name === 'ValidationError' ? 400 : 500);
  if (status >= 500) console.error(error);
  res.status(status).json({ message: status >= 500 ? 'An unexpected server error occurred.' : error.message });
});

export default app;
