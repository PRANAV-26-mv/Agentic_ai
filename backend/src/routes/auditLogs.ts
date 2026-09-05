import { Router, Request, Response } from 'express';
import { AuditLogsModel } from '../models/dbModels.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/audit-logs (Immutable read-only view)
router.get('/', requireAdmin, (_req: Request, res: Response) => {
  const logs = AuditLogsModel.findAll();
  res.json(logs);
});

export default router;
