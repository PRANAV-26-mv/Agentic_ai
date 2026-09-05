import { Router, Request, Response } from 'express';
import { AssessmentAttemptsModel, StudentsModel, AssessmentsModel, QuestionsModel, AuditLogsModel, memoryDb } from '../models/dbModels.js';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';
import { aiService } from '../services/aiService.js';

const router = Router();

// GET /api/results
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const attempts = AssessmentAttemptsModel.findAll();

  if (req.user?.role === 'STUDENT') {
    const studentAttempts = attempts.filter(a => a.student_id === req.user!.id);
    const enriched = studentAttempts.map(att => {
      const assessment = AssessmentsModel.findById(att.assessment_id);
      return {
        ...att,
        assessment_title: assessment ? assessment.title : 'Assessment',
        passing_percentage: assessment ? assessment.passing_percentage : 60,
        max_marks: assessment ? assessment.max_marks : 20
      };
    });
    res.json(enriched);
    return;
  }

  // Admin view all results
  const enriched = attempts.map(att => {
    const student = StudentsModel.findById(att.student_id);
    const assessment = AssessmentsModel.findById(att.assessment_id);
    return {
      ...att,
      student_name: student ? student.name : 'Unknown Student',
      student_email: student ? student.email : '',
      student_id_code: student ? student.student_id : '',
      department: student ? student.department : '',
      assessment_title: assessment ? assessment.title : 'Assessment'
    };
  });

  res.json(enriched);
});

// GET /api/results/:attemptId (Get attempt details with student answers for writing evaluation)
router.get('/:attemptId', requireAuth, (req: AuthRequest, res: Response) => {
  const attempt = AssessmentAttemptsModel.findAll().find(a => a.id === req.params.attemptId);
  if (!attempt) {
    res.status(404).json({ message: 'Attempt not found.' });
    return;
  }

  const student = StudentsModel.findById(attempt.student_id);
  const assessment = AssessmentsModel.findById(attempt.assessment_id);
  const questions = AssessmentAttemptsModel.getAttemptQuestions(attempt);
  const answers = AssessmentAttemptsModel.getStudentAnswers(attempt.id);

  res.json({
    attempt,
    student,
    assessment,
    questions,
    answers
  });
});

// POST /api/results/:attemptId/suggest-writing-score (AI Advisory Suggestion)
router.post('/:attemptId/suggest-writing-score', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { question_id } = req.body;
    const attempt = AssessmentAttemptsModel.findAll().find(a => a.id === req.params.attemptId);
    if (!attempt) {
      res.status(404).json({ message: 'Attempt not found.' });
      return;
    }

    const question = QuestionsModel.findById(question_id);
    if (!question || question.question_type !== 'WRITING') {
      res.status(400).json({ message: 'Writing question not found.' });
      return;
    }

    const answers = AssessmentAttemptsModel.getStudentAnswers(attempt.id);
    const ans = answers.find(a => a.question_id === question_id);
    const studentAnswer = ans ? (ans.student_answer || '') : '';

    // Call pluggable AI service layer suggestWritingScore()
    const suggestion = await aiService.suggestWritingScore(
      question.question_text,
      question.expected_answer || '',
      question.rubric || '',
      studentAnswer,
      question.marks
    );

    res.json(suggestion);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/results/:attemptId/evaluate-writing (Admin Save Awarded Score & Feedback)
router.post('/:attemptId/evaluate-writing', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { question_id, awarded_marks, feedback } = req.body;
    const attempt = AssessmentAttemptsModel.findAll().find(a => a.id === req.params.attemptId);
    if (!attempt) {
      res.status(404).json({ message: 'Attempt not found.' });
      return;
    }

    const answers = AssessmentAttemptsModel.getStudentAnswers(attempt.id);
    let ans = answers.find(a => a.question_id === question_id);
    if (!ans) {
      ans = AssessmentAttemptsModel.saveAnswer(attempt.id, question_id, {});
    }

    if (ans) {
      ans.awarded_marks = parseFloat(awarded_marks);
      ans.evaluator_id = req.user!.id;
      ans.evaluator_feedback = feedback || '';
      ans.evaluated_at = new Date().toISOString();
    }

    // Recompute attempt scores after evaluation
    const questions = AssessmentAttemptsModel.getAttemptQuestions(attempt);
    let totalWriting = 0;
    for (const q of questions) {
      if (q.question_type === 'WRITING') {
        const a = answers.find(item => item.question_id === q.id);
        if (a && a.awarded_marks !== undefined && a.awarded_marks !== null) {
          totalWriting += a.awarded_marks;
        }
      }
    }

    attempt.writing_score = totalWriting;
    attempt.total_score = attempt.mcq_score + totalWriting;
    const assessment = AssessmentsModel.findById(attempt.assessment_id);
    const maxMarks = assessment?.max_marks || 20;
    attempt.percentage = Math.min(100, Math.round((attempt.total_score / maxMarks) * 100));

    memoryDb.save();

    AuditLogsModel.log(
      req.user!.id,
      'ADMIN',
      'EVALUATE_WRITING',
      'ASSESSMENT_ATTEMPT',
      attempt.id,
      { awarded_marks, feedback }
    );

    res.json({ message: 'Evaluation saved successfully.', attempt });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
