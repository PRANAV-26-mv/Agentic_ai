import { Router, Request, Response } from 'express';
import { AttendanceModel, AuditLogsModel, StudentsModel } from '../models/dbModels.js';
import { requireAuth, requireAdmin, requireStudent, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/attendance
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'STUDENT') {
    const data = AttendanceModel.getStudentAttendance(req.user.id);
    res.json(data);
  } else {
    const sessions = AttendanceModel.findAllSessions();
    const students = StudentsModel.findAll();
    res.json({ sessions, totalStudents: students.length });
  }
});

// POST /api/attendance/sessions (Admin create session)
router.post('/sessions', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { community, department, duration_minutes } = req.body;

    // Generate temporary 6-char uppercase random code (e.g. 8K4P7Q)
    const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += codeChars.charAt(Math.floor(Math.random() * codeChars.length));
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

    res.status(201).json(session);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/attendance/mark (Student mark attendance via code)
router.post('/mark', requireStudent, (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ message: 'Attendance code is required.' });
      return;
    }

    const result = AttendanceModel.markAttendance(code.trim().toUpperCase(), req.user!.id);
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
