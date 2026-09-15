import { Router, Request, Response } from 'express';
import { AttendanceModel, AuditLogsModel, StudentsModel } from '../models/dbModels.js';
import { requireAuth, requireAdmin, requireStudent, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

const escapeCsv = (val: any) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

// GET /api/attendance
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'STUDENT') {
    const data = AttendanceModel.getStudentAttendance(req.user.id);
    res.json(data);
  } else {
    const rawSessions = AttendanceModel.findAllSessions();
    const students = StudentsModel.findAll();

    // Attach real-time attendee counts
    const sessions = rawSessions.map(s => {
      const attendees = AttendanceModel.getSessionAttendees(s.id);
      return {
        ...s,
        attendee_count: attendees.length
      };
    });

    res.json({ sessions, totalStudents: students.length });
  }
});

// POST /api/attendance/sessions (Admin creates session with strictly numeric OTP)
router.post('/sessions', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { community, department, duration_minutes } = req.body;

    // Generate strictly 6-digit numeric OTP (e.g. 748291) - NO characters
    let code = Math.floor(100000 + Math.random() * 900000).toString();

    // Ensure uniqueness among active sessions
    const existingSessions = AttendanceModel.findAllSessions();
    while (existingSessions.some(s => s.code === code)) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const duration = parseInt(duration_minutes || '60', 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 60 * 1000).toISOString();

    const session = AttendanceModel.createSession({
      community: community || 'ALL',
      department: department || 'ALL',
      date: now.toISOString().split('T')[0],
      code,
      expires_at: expiresAt,
      created_by: req.user!.id
    });

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'CREATE_ATTENDANCE_SESSION', 'ATTENDANCE_SESSION', session.id, { code: session.code });

    res.status(201).json({
      ...session,
      attendee_count: 0
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/sessions/:id/attendees (Admin view who put the OTP)
router.get('/sessions/:id/attendees', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const sessionId = req.params.id as string;
    const session = AttendanceModel.findAllSessions().find(s => s.id === sessionId || s.code === sessionId);
    if (!session) {
      res.status(404).json({ message: 'Attendance session not found.' });
      return;
    }

    const attendees = AttendanceModel.getSessionAttendees(sessionId);
    res.json({
      session: {
        ...session,
        attendee_count: attendees.length
      },
      attendees
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching attendees.' });
  }
});

// GET /api/attendance/sessions/:id/export (Admin download attendance report CSV for a session)
router.get('/sessions/:id/export', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const sessionId = req.params.id as string;
    const session = AttendanceModel.findAllSessions().find(s => s.id === sessionId || s.code === sessionId);
    if (!session) {
      res.status(404).json({ message: 'Attendance session not found.' });
      return;
    }

    const attendees = AttendanceModel.getSessionAttendees(sessionId);

    // CSV Headers
    const headers = [
      'S.No',
      'Student Name',
      'Register Number',
      'Department',
      'Community',
      'Email',
      'Session Date',
      'OTP Code',
      'Marked At (ISO)',
      'Marked At (Local Time)',
      'Status'
    ];

    const rows = attendees.map((a, idx) => [
      idx + 1,
      escapeCsv(a.student_name),
      escapeCsv(a.student_reg),
      escapeCsv(a.student_department),
      escapeCsv(a.student_community),
      escapeCsv(a.student_email),
      escapeCsv(a.session_date),
      escapeCsv(a.session_code),
      escapeCsv(a.marked_at),
      escapeCsv(new Date(a.marked_at).toLocaleString()),
      escapeCsv(a.status)
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${session.code}_${session.date}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error exporting attendance report.' });
  }
});

// GET /api/attendance/export-all (Admin download all attendance records across all sessions)
router.get('/export-all', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const attendees = AttendanceModel.getAllAttendees();

    const headers = [
      'S.No',
      'Student Name',
      'Register Number',
      'Department',
      'Community',
      'Email',
      'Session Date',
      'OTP Code',
      'Marked At (Local Time)',
      'Status'
    ];

    const rows = attendees.map((a, idx) => [
      idx + 1,
      escapeCsv(a.student_name),
      escapeCsv(a.student_reg),
      escapeCsv(a.student_department),
      escapeCsv(a.student_community),
      escapeCsv(a.student_email),
      escapeCsv(a.session_date),
      escapeCsv(a.session_code),
      escapeCsv(new Date(a.marked_at).toLocaleString()),
      escapeCsv(a.status)
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    const todayStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="master_attendance_report_${todayStr}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error exporting master attendance.' });
  }
});

// POST /api/attendance/mark (Student mark attendance via numeric OTP)
router.post('/mark', requireStudent, (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ message: 'Attendance OTP is required.' });
      return;
    }

    const cleanCode = String(code).trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      res.status(400).json({ message: 'Invalid OTP format. Please enter a valid 6-digit numeric OTP.' });
      return;
    }

    const result = AttendanceModel.markAttendance(cleanCode, req.user!.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
