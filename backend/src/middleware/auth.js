import jwt from 'jsonwebtoken';
import { recordAuditEvent } from '../services/audit.js';

export function authenticate(req, res, next) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'buildflow-api' });
    req.user = { id: payload.sub, role: payload.role };
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      res.once('finish', () => {
        const route = req.route?.path || req.path;
        const endpoint = `${req.baseUrl}${route}`.slice(0, 300);
        const status = res.statusCode >= 400 ? 'failure' : res.statusCode >= 300 ? 'info' : 'success';
        const category = req.baseUrl === '/api/projects' && endpoint.includes('/assign')
          ? 'assignment'
          : ({
              '/api/projects': 'project',
              '/api/attendance': 'attendance',
              '/api/progress': 'progress',
              '/api/finance': 'finance',
              '/api/users': 'people',
              '/api/clients': 'people',
            })[req.baseUrl] || 'system';
        recordAuditEvent({
          actorId: req.user.id,
          action: `${req.method} ${endpoint}`,
          description: `Request completed with HTTP ${res.statusCode}.`,
          status,
          category,
          request: req,
        }).catch(error => console.error('Activity audit logging failed:', error));
      });
    }
    return next();
  } catch {
    return res.status(401).json({ message: 'Session is invalid or expired.' });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    return next();
  };
}
