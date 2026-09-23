import { Router, Response } from 'express';
import { 
  MeetingsModel, 
  MeetingParticipantsModel, 
  MeetingSettingsModel, 
  AdminsModel, 
  NotificationsModel, 
  AuditLogsModel,
  MeetingAudienceType
} from '../models/dbModels.js';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// Helper: check if authenticated user is Super Admin
const isSuperAdminUser = (req: AuthRequest): boolean => {
  const email = req.user?.email?.toLowerCase();
  return email === 'pranavannur9659@gmail.com' || Boolean(req.user?.admin?.is_super_admin);
};

// Middleware: Strict Super Admin access
const requireSuperAdminOnly = (req: AuthRequest, res: Response, next: any) => {
  if (!isSuperAdminUser(req)) {
    res.status(403).json({ 
      message: 'Access Denied: Only Super Admin (pranavannur9659@gmail.com) can configure meeting permissions and global controls.' 
    });
    return;
  }
  next();
};

// 1. GET /api/meetings (List meetings visible to current user)
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const isSuper = isSuperAdminUser(req);
    const isStudent = req.user?.role === 'STUDENT';
    const student = isStudent ? req.user?.student : undefined;
    const admin = !isStudent ? req.user?.admin : undefined;

    const meetings = MeetingsModel.findAll({
      student,
      admin,
      isSuperAdmin: isSuper
    });

    const enriched = meetings.map(m => {
      const participants = MeetingParticipantsModel.getParticipants(m.id);
      const activeCount = participants.filter(p => !p.left_at).length;
      const isHost = m.host_id === req.user?.id || isSuper;

      return {
        ...m,
        total_participants_count: participants.length,
        active_participants_count: activeCount,
        is_host: isHost
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch meetings.' });
  }
});

// 2. GET /api/meetings/super/settings (Super Admin control center)
router.get('/super/settings', requireAdmin, requireSuperAdminOnly, (_req: AuthRequest, res: Response) => {
  try {
    const settings = MeetingSettingsModel.getSettings();
    const allAdmins = AdminsModel.findAll();

    // Map admins with their permission to create meetings
    const adminsWithPermissions = allAdmins.map(a => {
      const isSuper = a.email.toLowerCase() === 'pranavannur9659@gmail.com' || Boolean(a.is_super_admin);
      const canCreate = isSuper || settings.allow_all_admins || (settings.permitted_admin_ids && settings.permitted_admin_ids.includes(a.id));
      return {
        id: a.id,
        name: a.name,
        email: a.email,
        department: a.department,
        is_super_admin: isSuper,
        can_create_meetings: canCreate
      };
    });

    res.json({
      settings,
      admins: adminsWithPermissions
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch meeting settings.' });
  }
});

// 3. PUT /api/meetings/super/settings (Update Super Admin meeting settings & permissions)
router.put('/super/settings', requireAdmin, requireSuperAdminOnly, (req: AuthRequest, res: Response) => {
  try {
    const { is_enabled, allow_all_admins, permitted_admin_ids, allowed_audience_types, max_participants } = req.body;

    const updated = MeetingSettingsModel.updateSettings({
      ...(typeof is_enabled === 'boolean' && { is_enabled }),
      ...(typeof allow_all_admins === 'boolean' && { allow_all_admins }),
      ...(Array.isArray(permitted_admin_ids) && { permitted_admin_ids }),
      ...(Array.isArray(allowed_audience_types) && { allowed_audience_types }),
      ...(typeof max_participants === 'number' && { max_participants })
    }, req.user?.email);

    AuditLogsModel.log(
      req.user!.id, 
      'ADMIN', 
      'UPDATE_MEETING_SETTINGS', 
      'SYSTEM', 
      'MEETING_SETTINGS', 
      { updated_by: req.user?.email }
    );

    res.json({ message: 'Meeting settings & permissions updated successfully.', settings: updated });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update meeting settings.' });
  }
});

// 4. GET /api/meetings/:id (Get single meeting by ID or Code)
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const meeting = MeetingsModel.findById(id) || MeetingsModel.findByCode(id);

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found.' });
      return;
    }

    const isSuper = isSuperAdminUser(req);
    const isStudent = req.user?.role === 'STUDENT';

    // Verify student access to this meeting
    if (isStudent) {
      const student = req.user?.student!;
      if (meeting.audience_type === 'ADMINS_ONLY') {
        res.status(403).json({ message: 'Access Denied: This meeting is restricted to Admin members only.' });
        return;
      }
      if (meeting.audience_type === 'SPECIFIC_STUDENTS') {
        if (meeting.target_department && meeting.target_department !== student.department) {
          res.status(403).json({ message: `Access Denied: Meeting is reserved for ${meeting.target_department} department.` });
          return;
        }
        if (meeting.target_year && Number(meeting.target_year) !== Number(student.year)) {
          res.status(403).json({ message: `Access Denied: Meeting is reserved for Year ${meeting.target_year} students.` });
          return;
        }
      }
    }

    const participants = MeetingParticipantsModel.getParticipants(meeting.id);
    const isHost = meeting.host_id === req.user?.id || isSuper;

    res.json({
      ...meeting,
      participants_count: participants.length,
      is_host: isHost
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching meeting.' });
  }
});

// 5. POST /api/meetings (Admin creates a meeting - controlled by Super Admin)
router.post('/', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const isSuper = isSuperAdminUser(req);
    const adminId = req.user!.id;
    const adminEmail = req.user!.email;

    // Check if admin is authorized by Super Admin to create meetings
    const check = MeetingSettingsModel.canAdminCreateMeeting(adminId, adminEmail, isSuper);
    if (!check.allowed) {
      res.status(403).json({ message: check.reason });
      return;
    }

    const {
      title,
      description,
      meeting_type = 'VIDEO_VOICE',
      audience_type = 'ALL_STUDENTS',
      target_department,
      target_year,
      status = 'ACTIVE',
      scheduled_start_time,
      scheduled_end_time,
      allow_screen_share = true,
      allow_student_chat = true,
      mute_on_entry = false,
      external_link
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ message: 'Meeting title is required.' });
      return;
    }

    // Verify audience type restriction if not Super Admin
    if (!isSuper) {
      const settings = MeetingSettingsModel.getSettings();
      if (settings.allowed_audience_types && !settings.allowed_audience_types.includes(audience_type as MeetingAudienceType)) {
        res.status(403).json({ 
          message: `You are not permitted to create meetings with audience type '${audience_type}'. Allowed types: ${settings.allowed_audience_types.join(', ')}.` 
        });
        return;
      }
    }

    const now = new Date().toISOString();
    const isInstant = status === 'ACTIVE';

    const newMeeting = MeetingsModel.create({
      title: title.trim(),
      description: description?.trim() || '',
      host_id: adminId,
      host_name: req.user!.name,
      host_email: adminEmail,
      meeting_type: meeting_type as any,
      audience_type: audience_type as any,
      target_department: target_department ? target_department.trim() : undefined,
      target_year: target_year ? Number(target_year) : undefined,
      status: isInstant ? 'ACTIVE' : 'SCHEDULED',
      scheduled_start_time: scheduled_start_time || now,
      scheduled_end_time: scheduled_end_time || undefined,
      actual_start_time: isInstant ? now : undefined,
      allow_screen_share: Boolean(allow_screen_share),
      allow_student_chat: Boolean(allow_student_chat),
      mute_on_entry: Boolean(mute_on_entry),
      external_link: external_link?.trim() || undefined
    });

    // Notify audience
    try {
      let notifTitle = `📹 Live Meeting: ${newMeeting.title}`;
      let notifMsg = `Host ${newMeeting.host_name} started a meeting. Click to join with code: ${newMeeting.code}`;
      if (!isInstant) {
        notifTitle = `📅 Scheduled Meeting: ${newMeeting.title}`;
        notifMsg = `Meeting scheduled for ${new Date(newMeeting.scheduled_start_time).toLocaleString()}. Code: ${newMeeting.code}`;
      }

      NotificationsModel.create({
        title: notifTitle,
        message: notifMsg,
        target_type: (newMeeting.audience_type === 'SPECIFIC_STUDENTS' && newMeeting.target_department) ? 'DEPARTMENT' : 'ALL',
        target_department: newMeeting.target_department,
        priority: isInstant ? 'IMPORTANT' : 'NORMAL'
      });
    } catch (notifErr) {
      console.warn('Notification trigger warning:', notifErr);
    }

    // Audit log
    AuditLogsModel.log(
      req.user!.id, 
      'ADMIN', 
      'CREATE_MEETING', 
      'MEETING', 
      newMeeting.id, 
      { title: newMeeting.title, code: newMeeting.code, audience: newMeeting.audience_type }
    );

    res.status(201).json(newMeeting);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create meeting.' });
  }
});

// 6. PUT /api/meetings/:id (Update meeting details or status)
router.put('/:id', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const meeting = MeetingsModel.findById(id);
    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found.' });
      return;
    }

    const isSuper = isSuperAdminUser(req);
    if (meeting.host_id !== req.user?.id && !isSuper) {
      res.status(403).json({ message: 'Access Denied: Only the meeting host or Super Admin can edit this meeting.' });
      return;
    }

    const updates = req.body;
    const updated = MeetingsModel.update(id, updates);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update meeting.' });
  }
});

// 7. POST /api/meetings/:id/end (End meeting for all participants)
router.post('/:id/end', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const meeting = MeetingsModel.findById(id);
    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found.' });
      return;
    }

    const isSuper = isSuperAdminUser(req);
    if (meeting.host_id !== req.user?.id && !isSuper) {
      res.status(403).json({ message: 'Access Denied: Only the meeting host or Super Admin can end this meeting.' });
      return;
    }

    const updated = MeetingsModel.update(id, {
      status: 'ENDED',
      actual_end_time: new Date().toISOString()
    });

    AuditLogsModel.log(
      req.user!.id,
      'ADMIN',
      'END_MEETING',
      'MEETING',
      id,
      { title: meeting.title }
    );

    res.json({ message: 'Meeting ended successfully.', meeting: updated });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to end meeting.' });
  }
});

// 8. DELETE /api/meetings/:id (Delete meeting)
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const meeting = MeetingsModel.findById(id);
    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found.' });
      return;
    }

    const isSuper = isSuperAdminUser(req);
    if (meeting.host_id !== req.user?.id && !isSuper) {
      res.status(403).json({ message: 'Access Denied: Only the meeting host or Super Admin can delete this meeting.' });
      return;
    }

    MeetingsModel.delete(id);
    AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_MEETING', 'MEETING', id, { title: meeting.title });

    res.json({ message: 'Meeting deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to delete meeting.' });
  }
});

// 9. GET /api/meetings/:id/attendance (Fetch attendance records)
router.get('/:id/attendance', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const meeting = MeetingsModel.findById(id);
    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found.' });
      return;
    }

    const isSuper = isSuperAdminUser(req);
    if (meeting.host_id !== req.user?.id && !isSuper) {
      res.status(403).json({ message: 'Access Denied: Only the meeting host or Super Admin can view attendance.' });
      return;
    }

    const participants = MeetingParticipantsModel.getParticipants(meeting.id);
    res.json({
      meeting,
      total_attended: participants.length,
      participants
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch attendance.' });
  }
});

export default router;
