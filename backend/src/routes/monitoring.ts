import { Router, Request, Response } from 'express';
import { AssessmentAttemptsModel, StudentsModel, AssessmentsModel, memoryDb } from '../models/dbModels.js';
import { requireAuth, requireAdmin, requireStudent, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/monitoring (Admin monitoring dashboard)
router.get('/', requireAdmin, (_req: Request, res: Response) => {
  const attempts = AssessmentAttemptsModel.findAll();
  const monitoringData = attempts.map(att => {
    const student = StudentsModel.findById(att.student_id);
    const assessment = AssessmentsModel.findById(att.assessment_id);
    const events = memoryDb.table('tab_switch_events').filter((e: any) => e.attempt_id === att.id);

    return {
      attempt_id: att.id,
      student_id: att.student_id,
      student_name: student ? student.name : 'Student',
      student_email: student ? student.email : '',
      assessment_title: assessment ? assessment.title : 'Assessment',
      start_time: att.started_at,
      submit_time: att.submitted_at || null,
      status: att.status,
      tab_switches_count: att.tab_switches_count || 0,
      events
    };
  });

  res.json(monitoringData);
});

// GET /api/tab-switch-events (Admin view tab switch event timeline)
router.get('/tab-switch-events', requireAdmin, (req: Request, res: Response) => {
  const { attempt_id } = req.query;
  let events = memoryDb.table('tab_switch_events');
  if (attempt_id) {
    events = events.filter((e: any) => e.attempt_id === (attempt_id as string));
  }
  res.json(events);
});

// POST /api/tab-switch-events (Student log tab switch)
router.post('/tab-switch-events', requireStudent, (req: AuthRequest, res: Response) => {
  try {
    const { attempt_id, assessment_id, event_type } = req.body;
    if (!attempt_id || !assessment_id) {
      res.status(400).json({ message: 'Attempt ID and Assessment ID required.' });
      return;
    }

    const newCount = AssessmentAttemptsModel.recordTabSwitch(
      attempt_id,
      req.user!.id,
      assessment_id,
      event_type || 'TAB_LEAVE'
    );

    res.json({ success: true, tab_switches_count: newCount });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
