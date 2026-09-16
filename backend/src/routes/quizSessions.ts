import { Router, Request, Response } from 'express';
import { 
  QuizSessionsModel, 
  QuizSessionParticipantsModel, 
  QuestionsModel, 
  AssessmentsModel,
  AuditLogsModel 
} from '../models/dbModels.js';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/quiz-sessions - List quiz sessions
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const isStudent = req.user?.role === 'STUDENT';
    const student = isStudent ? req.user?.student : undefined;

    const sessions = QuizSessionsModel.findAll({
      student
    });

    // Attach participant counts and student performance details
    const enriched = sessions.map(s => {
      const participants = QuizSessionParticipantsModel.getParticipants(s.id);
      let studentParticipant = undefined;
      if (student) {
        studentParticipant = participants.find(p => p.student_id === student.id);
      }
      const leaderboard = QuizSessionParticipantsModel.getLeaderboard(s.id);
      const myRank = studentParticipant && studentParticipant.status === 'SUBMITTED'
        ? leaderboard.find(l => l.student_id === studentParticipant.student_id)?.rank || studentParticipant.rank || null
        : null;

      return {
        ...s,
        participant_count: participants.length,
        submitted_count: participants.filter(p => p.status === 'SUBMITTED').length,
        my_status: studentParticipant?.status || null,
        my_score: studentParticipant?.score ?? null,
        my_max_score: studentParticipant?.max_score ?? null,
        my_percentage: studentParticipant?.percentage ?? null,
        my_time_taken_seconds: studentParticipant?.time_taken_seconds ?? null,
        my_rank: myRank
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching quiz sessions.' });
  }
});

// POST /api/quiz-sessions - Admin creates a new quiz session
router.post('/', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const { 
      title, 
      description, 
      pin, 
      assessment_id, 
      question_ids, 
      target_type, 
      target_department, 
      target_community, 
      duration_minutes, 
      start_time, 
      end_time,
      status 
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ message: 'Session title is required.' });
      return;
    }

    let finalQuestionIds: string[] = Array.isArray(question_ids) ? question_ids : [];

    // If an assessment was chosen, pull its question ids
    if (assessment_id && finalQuestionIds.length === 0) {
      const assessment = AssessmentsModel.findById(assessment_id);
      if (assessment && assessment.question_ids) {
        finalQuestionIds = assessment.question_ids;
      }
    }

    if (finalQuestionIds.length === 0) {
      // Pick 5 approved questions automatically as fallback
      const available = QuestionsModel.findAll({ status: 'APPROVED', type: 'MCQ' });
      finalQuestionIds = available.slice(0, 5).map(q => q.id);
      if (finalQuestionIds.length === 0) {
        const anyQuestions = QuestionsModel.findAll();
        finalQuestionIds = anyQuestions.slice(0, 5).map(q => q.id);
      }
    }

    const duration = parseInt(duration_minutes || '15', 10);
    const now = new Date();
    const startTime = start_time || now.toISOString();
    const endTime = end_time || new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const session = QuizSessionsModel.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      pin: pin ? pin.trim() : undefined,
      assessment_id: assessment_id || undefined,
      question_ids: finalQuestionIds,
      target_type: target_type || 'ALL',
      target_department: target_department ? target_department.trim() : undefined,
      target_community: target_community ? target_community.trim() : undefined,
      duration_minutes: duration > 0 ? duration : 15,
      start_time: startTime,
      end_time: endTime,
      status: (status as any) || 'ACTIVE',
      created_by: req.user!.id
    });

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'CREATE_QUIZ_SESSION', 'QUIZ_SESSION', session.id, {
      title: session.title,
      pin: session.pin
    });

    res.status(201).json(session);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create quiz session.' });
  }
});

// POST /api/quiz-sessions/join - Student enters 6-digit PIN to join session
router.post('/join', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { pin, session_id } = req.body;
    let session = undefined;

    if (pin && typeof pin === 'string') {
      session = QuizSessionsModel.findByPin(pin.trim());
    } else if (session_id) {
      session = QuizSessionsModel.findById(session_id);
    }

    if (!session) {
      res.status(404).json({ message: 'Invalid Session PIN. Please check the code and try again.' });
      return;
    }

    if (session.status === 'CANCELLED') {
      res.status(400).json({ message: 'This quiz session has been cancelled by the administrator.' });
      return;
    }

    if (session.status === 'COMPLETED') {
      res.status(400).json({ message: 'This quiz session has already ended.' });
      return;
    }

    // Cohort check for students
    if (req.user?.role === 'STUDENT' && req.user.student) {
      const student = req.user.student;
      if (session.target_type === 'DEPARTMENT' && session.target_department && session.target_department !== student.department) {
        res.status(403).json({ message: `Access Restricted: This quiz session is designated for the ${session.target_department} department.` });
        return;
      }
      if (session.target_type === 'COMMUNITY' && session.target_community && session.target_community !== student.community) {
        res.status(403).json({ message: `Access Restricted: This quiz session is reserved for the ${session.target_community} community.` });
        return;
      }

      // Register student in session lobby
      const participant = QuizSessionParticipantsModel.join(session.id, student);
      res.json({
        message: 'Successfully joined quiz session lobby!',
        session_id: session.id,
        participant
      });
      return;
    }

    res.json({
      message: 'Admin access granted to quiz session',
      session_id: session.id
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error joining quiz session.' });
  }
});

// GET /api/quiz-sessions/:id - Get session details & questions
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const session = QuizSessionsModel.findById(id);

    if (!session) {
      res.status(404).json({ message: 'Quiz session not found.' });
      return;
    }

    const participants = QuizSessionParticipantsModel.getParticipants(session.id);
    const leaderboard = QuizSessionParticipantsModel.getLeaderboard(session.id);

    let myParticipant = undefined;
    if (req.user?.role === 'STUDENT' && req.user.student) {
      myParticipant = participants.find(p => p.student_id === req.user!.id);
    }

    // Resolve questions
    const allQuestions = session.question_ids
      .map(qId => QuestionsModel.findById(qId))
      .filter(Boolean);

    // If student has NOT submitted yet, omit correct answers & explanations to prevent cheating
    const isSubmitted = myParticipant?.status === 'SUBMITTED';
    const isAdmin = req.user?.role === 'ADMIN';

    const sanitizedQuestions = allQuestions.map(q => {
      if (!q) return null;
      if (isAdmin || isSubmitted) {
        return q;
      }
      const { correct_answer, explanation, rubric, expected_answer, ...studentSafe } = q;
      return studentSafe;
    });

    res.json({
      ...session,
      participants,
      leaderboard,
      my_participant: myParticipant,
      questions: sanitizedQuestions
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching session details.' });
  }
});

// POST /api/quiz-sessions/:id/start-quiz - Student transitions from lobby to in-progress
router.post('/:id/start-quiz', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const sessionId = req.params.id as string;
    const session = QuizSessionsModel.findById(sessionId);

    if (!session) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }

    if (session.status !== 'ACTIVE') {
      res.status(400).json({ message: 'This quiz session is not active yet. Please wait in the lobby until the host opens the session.' });
      return;
    }

    if (!req.user || req.user.role !== 'STUDENT') {
      res.status(400).json({ message: 'Only students can take quiz sessions.' });
      return;
    }

    const participant = QuizSessionParticipantsModel.startQuiz(sessionId, req.user.id);
    res.json({ message: 'Quiz session started!', participant });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error starting quiz.' });
  }
});

// POST /api/quiz-sessions/:id/submit - Student submits answers
router.post('/:id/submit', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const sessionId = req.params.id as string;
    const session = QuizSessionsModel.findById(sessionId);

    if (!session) {
      res.status(404).json({ message: 'Quiz session not found.' });
      return;
    }

    if (!req.user || req.user.role !== 'STUDENT') {
      res.status(400).json({ message: 'Only students can submit answers.' });
      return;
    }

    const { answers } = req.body;
    const questions = session.question_ids
      .map(qId => QuestionsModel.findById(qId))
      .filter((q): q is NonNullable<typeof q> => Boolean(q));

    const participant = QuizSessionParticipantsModel.submit(
      sessionId,
      req.user.id,
      answers || {},
      questions
    );

    if (!participant) {
      res.status(400).json({ message: 'Participant record not found for this session. Please join the lobby first.' });
      return;
    }

    const leaderboard = QuizSessionParticipantsModel.getLeaderboard(sessionId);
    const myRank = leaderboard.find(entry => entry.student_id === req.user!.id)?.rank || 1;

    res.json({
      message: 'Quiz submitted successfully!',
      participant,
      rank: myRank,
      total_participants: leaderboard.length,
      leaderboard,
      questions
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error submitting quiz.' });
  }
});

// PUT /api/quiz-sessions/:id/status - Admin updates session status
router.put('/:id/status', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status || !['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      res.status(400).json({ message: 'Invalid status.' });
      return;
    }

    const updated = QuizSessionsModel.update(id, { status });
    if (!updated) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'UPDATE_QUIZ_SESSION_STATUS', 'QUIZ_SESSION', id, { status });

    res.json({ message: `Session status updated to ${status}.`, session: updated });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating session status.' });
  }
});

// GET /api/quiz-sessions/:id/leaderboard - Real-time leaderboard
router.get('/:id/leaderboard', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const leaderboard = QuizSessionParticipantsModel.getLeaderboard(id);
    res.json(leaderboard);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching leaderboard.' });
  }
});

// POST /api/quiz-sessions/bulk-delete - Admin deletes multiple quiz sessions
router.post('/bulk-delete', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const { session_ids } = req.body;
    if (!Array.isArray(session_ids) || session_ids.length === 0) {
      res.status(400).json({ message: 'List of session IDs required.' });
      return;
    }
    let count = 0;
    for (const id of session_ids) {
      if (QuizSessionsModel.delete(id)) {
        AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_QUIZ_SESSION', 'QUIZ_SESSION', id);
        count++;
      }
    }
    res.json({ message: `Successfully deleted ${count} quiz sessions.`, deleted_count: count });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error bulk deleting quiz sessions.' });
  }
});

// DELETE /api/quiz-sessions/:id - Admin deletes quiz session
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const success = QuizSessionsModel.delete(id);
    if (success) {
      AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_QUIZ_SESSION', 'QUIZ_SESSION', id);
      res.json({ message: 'Quiz session deleted successfully.' });
    } else {
      res.status(404).json({ message: 'Quiz session not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error deleting quiz session.' });
  }
});

export default router;
