import { Router, Request, Response } from 'express';
import { NotificationsModel, AuditLogsModel } from '../models/dbModels.js';
import { requireAuth, requireAdmin, requireStudent, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/notifications
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'STUDENT') {
    const list = NotificationsModel.getForStudent(req.user.student!);
    res.json(list);
  } else {
    // Admin gets all notifications
    const all = NotificationsModel.findAll();
    res.json(all);
  }
});

// POST /api/notifications (Create)
router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { title, message, target_type, target_department, target_community, priority } = req.body;

    if (!title || !message) {
      res.status(400).json({ message: 'Title and message are required.' });
      return;
    }

    const notif = NotificationsModel.create({
      title,
      message,
      target_type: target_type || 'ALL',
      target_department,
      target_community,
      priority: priority || 'NORMAL'
    });

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'CREATE_NOTIFICATION', 'NOTIFICATION', notif.id, { title: notif.title });

    res.status(201).json(notif);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/:id (Edit)
router.put('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, message, target_type, target_department, target_community, priority } = req.body;

    const existing = NotificationsModel.findById(id);
    if (!existing) {
      res.status(404).json({ message: 'Notification not found.' });
      return;
    }

    const updated = NotificationsModel.update(id, {
      title,
      message,
      target_type,
      target_department,
      target_community,
      priority
    });

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'UPDATE_NOTIFICATION', 'NOTIFICATION', id, { title });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notifications/:id (Delete)
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = NotificationsModel.findById(id);
    if (!existing) {
      res.status(404).json({ message: 'Notification not found.' });
      return;
    }

    const success = NotificationsModel.delete(id);
    if (success) {
      AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_NOTIFICATION', 'NOTIFICATION', id, { title: existing.title });
      res.json({ message: 'Notification deleted successfully.' });
    } else {
      res.status(400).json({ message: 'Failed to delete notification.' });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notifications/:id/read (Student mark as read)
router.post('/:id/read', requireStudent, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  NotificationsModel.markRead(id, req.user!.id);
  res.json({ message: 'Notification marked as read.' });
});

export default router;
