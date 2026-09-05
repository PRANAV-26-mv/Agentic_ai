import { Router, Request, Response } from 'express';
import { AssessmentsModel, AssessmentAttemptsModel, AuditLogsModel, QuestionsModel, ensureDefaultQuestions } from '../models/dbModels.js';
import { requireAuth, requireAdmin, requireStudent, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/assessments
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'STUDENT') {
    const assigned = AssessmentsModel.findAssignedForStudent(req.user.student!);
    res.json(assigned);
  } else {
    res.json(AssessmentsModel.findAll());
  }
});

// GET /api/assessments/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const assessment = AssessmentsModel.findById(id);
  if (!assessment) {
    res.status(404).json({ message: 'Assessment not found.' });
    return;
  }

  let questions: any[] = [];
  if (assessment.question_selection_mode === 'FIXED' && assessment.question_ids && assessment.question_ids.length > 0) {
    questions = assessment.question_ids.map(qid => QuestionsModel.findById(qid)).filter(Boolean);
  } else {
    questions = QuestionsModel.findAll({ status: 'APPROVED' }).slice(0, 5);
  }

  if (questions.length === 0) {
    questions = ensureDefaultQuestions();
  }

  res.json({ ...assessment, questions });
});

// POST /api/assessments (Admin create assessment)
router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { title, description, type, question_selection_mode, pool_id, draw_count, target_type, community, department, duration_minutes, start_time, end_time, passing_percentage, max_marks, question_ids } = req.body;

    if (!title || !duration_minutes || !start_time || !end_time) {
      res.status(400).json({ message: 'Missing required assessment fields.' });
      return;
    }

    const newAss = AssessmentsModel.create({
      title,
      description,
      type: type || 'HYBRID',
      question_selection_mode: question_selection_mode || 'FIXED',
      pool_id,
      draw_count: draw_count ? parseInt(draw_count, 10) : undefined,
      target_type: target_type || 'ALL',
      community,
      department,
      duration_minutes: parseInt(duration_minutes, 10),
      start_time,
      end_time,
      passing_percentage: parseFloat(passing_percentage || '60'),
      max_marks: parseFloat(max_marks || '20'),
      status: 'PUBLISHED',
      created_by: req.user!.id,
      question_ids: question_ids || []
    });

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'CREATE_ASSESSMENT', 'ASSESSMENT', newAss.id, { title: newAss.title });

    res.status(201).json(newAss);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/assessments/:id/duplicate
router.post('/:id/duplicate', requireAdmin, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const duplicated = AssessmentsModel.duplicate(id);
  if (!duplicated) {
    res.status(404).json({ message: 'Assessment not found to duplicate.' });
    return;
  }
  AuditLogsModel.log(req.user!.id, 'ADMIN', 'DUPLICATE_ASSESSMENT', 'ASSESSMENT', duplicated.id);
  res.status(201).json(duplicated);
});

// PUT /api/assessments/:id
router.put('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const updated = AssessmentsModel.update(id, req.body);
  if (!updated) {
    res.status(404).json({ message: 'Assessment not found.' });
    return;
  }
  AuditLogsModel.log(req.user!.id, 'ADMIN', 'UPDATE_ASSESSMENT', 'ASSESSMENT', id);
  res.json(updated);
});

// DELETE /api/assessments/:id
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const success = AssessmentsModel.delete(id);
  if (success) {
    AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_ASSESSMENT', 'ASSESSMENT', id);
    res.json({ message: 'Assessment deleted successfully.' });
  } else {
    res.status(404).json({ message: 'Assessment not found.' });
  }
});

// POST /api/assessments/:id/start
router.post('/:id/start', requireStudent, (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const assessmentId = req.params.id as string;

    const assessment = AssessmentsModel.findById(assessmentId);
    if (!assessment) {
      res.status(404).json({ message: 'Unable to load assessment. Please try again.' });
      return;
    }

    const now = new Date();
    if (new Date(assessment.end_time) < now) {
      res.status(400).json({ message: 'This assessment is no longer available.' });
      return;
    }

    let existingAttempt = AssessmentAttemptsModel.findAttempt(studentId, assessmentId);
    if (existingAttempt) {
      if (existingAttempt.status === 'COMPLETED' || existingAttempt.status === 'AUTO_SUBMITTED') {
        res.status(400).json({ message: 'You have already completed this assessment.' });
        return;
      }

      if (new Date(existingAttempt.expires_at) < now) {
        const submitted = AssessmentAttemptsModel.submitAttempt(existingAttempt.id, true);
        res.json({ attempt: submitted, questions: [], expired: true });
        return;
      }

      const questions = AssessmentAttemptsModel.getAttemptQuestions(existingAttempt);
      const answers = AssessmentAttemptsModel.getStudentAnswers(existingAttempt.id);

      res.json({ attempt: existingAttempt, questions, answers });
      return;
    }

    const { attempt, questions } = AssessmentAttemptsModel.createAttempt(studentId, assessment);
    AuditLogsModel.log(studentId, 'STUDENT', 'START_ASSESSMENT', 'ASSESSMENT_ATTEMPT', attempt.id);

    res.json({ attempt, questions, answers: [] });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/assessments/:id/answer
router.post('/:id/answer', requireStudent, (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const assessmentId = req.params.id as string;
    const { attempt_id, question_id, selected_option, student_answer } = req.body;

    const attempt = AssessmentAttemptsModel.findAttempt(studentId, assessmentId);
    if (!attempt || attempt.id !== attempt_id) {
      res.status(400).json({ message: 'Invalid assessment attempt.' });
      return;
    }

    if (attempt.status !== 'IN_PROGRESS') {
      res.status(400).json({ message: 'Assessment attempt has already been submitted or expired.' });
      return;
    }

    const saved = AssessmentAttemptsModel.saveAnswer(attempt_id, question_id, { selected_option, student_answer });
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/assessments/:id/submit
router.post('/:id/submit', requireStudent, (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const assessmentId = req.params.id as string;
    const { attempt_id } = req.body;

    const attempt = AssessmentAttemptsModel.findAttempt(studentId, assessmentId);
    if (!attempt || attempt.id !== attempt_id) {
      res.status(400).json({ message: 'Invalid assessment attempt.' });
      return;
    }

    if (attempt.status === 'COMPLETED' || attempt.status === 'AUTO_SUBMITTED') {
      res.json(attempt);
      return;
    }

    const submitted = AssessmentAttemptsModel.submitAttempt(attempt_id, false);
    AuditLogsModel.log(studentId, 'STUDENT', 'SUBMIT_ASSESSMENT', 'ASSESSMENT_ATTEMPT', attempt_id, { score: submitted.total_score });

    res.json(submitted);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
