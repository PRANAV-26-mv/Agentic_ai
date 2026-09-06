import { Router, Response } from 'express';
import { AuditLogsModel, AdminsModel, StudentsModel } from '../models/dbModels.js';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// Middleware: Strict Super Admin access check for pranavannur9659@gmail.com
const requireSuperAdminOnly = (req: AuthRequest, res: Response, next: any) => {
  const userEmail = req.user?.email?.toLowerCase();
  if (userEmail !== 'pranavannur9659@gmail.com' && !req.user?.admin?.is_super_admin) {
    res.status(403).json({ message: 'Access Denied: Only Super Admin (pranavannur9659@gmail.com) can view activity logs.' });
    return;
  }
  next();
};

// GET /api/audit-logs (Immutable read-only view enriched with Name & Email ID)
router.get('/', requireAdmin, requireSuperAdminOnly, (_req: AuthRequest, res: Response) => {
  try {
    const logs = AuditLogsModel.findAll();
    const admins = AdminsModel.findAll();
    const students = StudentsModel.findAll();

    const enrichedLogs = logs.map(log => {
      let name = 'Unknown User';
      let email = log.actor_id;

      if (log.actor_role === 'ADMIN') {
        const adm = admins.find(a => a.id === log.actor_id || a.email.toLowerCase() === log.actor_id.toLowerCase());
        if (adm) {
          name = adm.name;
          email = adm.email;
        }
      } else if (log.actor_role === 'STUDENT') {
        const std = students.find(s => 
          s.id === log.actor_id || 
          s.email.toLowerCase() === log.actor_id.toLowerCase() || 
          s.student_id.toLowerCase() === log.actor_id.toLowerCase()
        );
        if (std) {
          name = std.name;
          email = std.email;
        }
      }

      // Check metadata fallback if email/name missing
      if (email === log.actor_id && log.metadata) {
        try {
          const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
          if (meta.email) email = meta.email;
          if (meta.name) name = meta.name;
        } catch (e) {
          // ignore json parse error
        }
      }

      return {
        ...log,
        actor_name: name,
        actor_email: email
      };
    });

    res.json(enrichedLogs);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch audit logs.' });
  }
});

export default router;

