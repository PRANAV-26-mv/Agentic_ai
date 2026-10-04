import { Router, Request, Response } from 'express';
import { NotificationsModel, AuditLogsModel } from '../models/dbModels.js';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';
import { broadcastNotification } from '../services/meetingSocketService.js';

const router = Router();

// Helper to determine if user is Super Admin
const isSuperAdminUser = (req: AuthRequest): boolean => {
  const email = req.user?.email?.toLowerCase();
  return email === 'pranavannur9659@gmail.com' || Boolean(req.user?.admin?.is_super_admin);
};

// GET /api/notifications
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'STUDENT') {
    const list = NotificationsModel.getForStudent(req.user.student!);
    res.json(list);
  } else {
    // Admin gets notifications filtered for admin audience or all (Super admin sees all)
    const list = NotificationsModel.getForAdmin(req.user?.admin);
    res.json(list);
  }
});

// POST /api/notifications/test (Trigger test desktop notification)
router.post('/test', requireAuth, (req: AuthRequest, res: Response) => {
  const isSuper = isSuperAdminUser(req);
  const testNotif = {
    id: `test-${Date.now()}`,
    title: '🔔 Desktop Notification Tested!',
    message: `Test desktop notification triggered by ${req.user?.name || 'Administrator'}. Real-time alerts outside the browser are active.`,
    priority: 'IMPORTANT' as const,
    target_type: 'ALL' as const,
    target_user_id: req.user?.id, // Send to the requester directly
    created_at: new Date().toISOString(),
    sender_role: isSuper ? 'SUPER_ADMIN' as const : 'ADMIN' as const,
    sender_name: req.user?.name || 'Admin',
    action_url: '/notifications'
  };

  broadcastNotification(testNotif);
  res.json({ message: 'Test notification broadcasted to desktop successfully.', notification: testNotif });
});

// POST /api/notifications (Create & Broadcast)
router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { title, message, target_type, target_department, target_community, priority, action_url } = req.body;

    if (!title || !message) {
      res.status(400).json({ message: 'Title and message are required.' });
      return;
    }

    const isSuper = isSuperAdminUser(req);

    const notif = NotificationsModel.create({
      title: title.trim(),
      message: message.trim(),
      target_type: target_type || 'ALL',
      target_department: target_department ? target_department.trim() : undefined,
      target_community: target_community ? target_community.trim() : undefined,
      priority: priority || 'NORMAL',
      action_url: action_url ? action_url.trim() : undefined,
      sender_role: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
      sender_name: req.user!.name
    });

    // Broadcast in real-time to desktop clients via WebSockets
    broadcastNotification(notif);

    AuditLogsModel.log(
      req.user!.id, 
      'ADMIN', 
      'CREATE_NOTIFICATION', 
      'NOTIFICATION', 
      notif.id, 
      { title: notif.title, target: notif.target_type, isSuper }
    );

    res.status(201).json(notif);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/:id (Edit)
router.put('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, message, target_type, target_department, target_community, priority, action_url } = req.body;

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
      priority,
      action_url
    });

    if (updated) {
      broadcastNotification({ ...updated, is_update: true });
    }

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

// POST /api/notifications/:id/read (Mark as read for Students & Admins)
router.post('/:id/read', requireAuth, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  NotificationsModel.markRead(id, req.user!.id);
  res.json({ message: 'Notification marked as read.' });
});

export default router;
