import { Router, Request, Response } from 'express';
import multer from 'multer';
import { StudentsModel, AuditLogsModel } from '../models/dbModels.js';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';
import { bulkImportService } from '../services/bulkImportService.js';
import { generateReportCardPDF } from '../services/reportCardService.js';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/students
router.get('/', requireAdmin, (req: Request, res: Response) => {
  const { department, year, community, search, status } = req.query;
  const list = StudentsModel.findAll({
    department: department as string,
    year: year ? parseInt(year as string, 10) : undefined,
    community: community as string,
    search: search as string,
    status: status as string
  });
  res.json(list);
});

// GET /api/students/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const student = StudentsModel.findById(id);
  if (!student) {
    res.status(404).json({ message: 'Student not found.' });
    return;
  }

  if (req.user?.role === 'STUDENT' && req.user.id !== student.id) {
    res.status(403).json({ message: 'Access denied.' });
    return;
  }

  res.json(student);
});

// POST /api/students
router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { student_id, name, email, department, year, community, skill_level, profile, interest, suggested_role } = req.body;

    if (!student_id || !name || !email || !department || !year || !community || !skill_level) {
      res.status(400).json({ message: 'Missing required student fields.' });
      return;
    }

    if (StudentsModel.findByEmail(email)) {
      res.status(400).json({ message: 'A student with this email address already exists.' });
      return;
    }

    if (StudentsModel.findByStudentId(student_id)) {
      res.status(400).json({ message: 'A student with this Student ID already exists.' });
      return;
    }

    const newStudent = StudentsModel.create({
      student_id,
      name,
      email,
      department,
      year: parseInt(year, 10),
      community,
      skill_level,
      profile,
      interest,
      suggested_role
    });

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'CREATE_STUDENT', 'STUDENT', newStudent.id, { name: newStudent.name });

    res.status(201).json(newStudent);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/students/:id
router.put('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const studentId = req.params.id as string;
  const existing = StudentsModel.findById(studentId);
  if (!existing) {
    res.status(404).json({ message: 'Student not found.' });
    return;
  }

  if (req.user?.role === 'STUDENT') {
    if (req.user.id !== studentId) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    const { profile, interest, skill_level } = req.body;
    const updated = StudentsModel.update(studentId, { profile, interest, skill_level });
    res.json(updated);
    return;
  }

  const updated = StudentsModel.update(studentId, req.body);
  AuditLogsModel.log(req.user!.id, 'ADMIN', 'UPDATE_STUDENT', 'STUDENT', studentId);
  res.json(updated);
});

// DELETE /api/students/:id
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const success = StudentsModel.deactivate(id);
  if (success) {
    AuditLogsModel.log(req.user!.id, 'ADMIN', 'DEACTIVATE_STUDENT', 'STUDENT', id);
    res.json({ message: 'Student deactivated successfully.' });
  } else {
    res.status(404).json({ message: 'Student not found.' });
  }
});

// POST /api/students/bulk-import
router.post('/bulk-import', requireAdmin, upload.single('file'), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Please upload a valid CSV or XLSX file.' });
      return;
    }

    const mode = (req.body.mode === 'commit' ? 'commit' : 'dry-run') as 'dry-run' | 'commit';
    const result = bulkImportService.processImport(req.file.buffer, req.file.mimetype, mode, req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Unable to process file. Please upload a valid CSV or XLSX file.' });
  }
});

// GET /api/students/:id/report-card
router.get('/:id/report-card', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.id as string;
    if (req.user?.role === 'STUDENT' && req.user.id !== studentId) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    const pdfBuffer = await generateReportCardPDF(studentId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Report_Card_${studentId}.pdf`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error generating PDF report card.' });
  }
});

export default router;
