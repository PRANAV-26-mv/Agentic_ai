import { Router, Request, Response } from 'express';
import { 
  GdSessionsModel, 
  GdParticipantsModel, 
  AuditLogsModel,
  memoryDb,
  GdSession,
  GdPeerEvaluation,
  GdLeaderboardEntry
} from '../models/dbModels.js';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/gd-sessions - List GD sessions
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const isStudent = req.user?.role === 'STUDENT';
    const student = isStudent ? req.user?.student : undefined;

    const sessions = GdSessionsModel.findAll(isStudent ? { student } : undefined);

    const enriched = sessions.map(s => {
      const participants = GdParticipantsModel.getParticipants(s.id);
      let studentParticipant = undefined;
      if (student) {
        studentParticipant = participants.find(p => p.student_id === student.id);
      }
      const isCompleted = s.status === 'COMPLETED' || Boolean(s.is_results_published);
      const submittedEvaluationsCount = participants.filter(p => p.status === 'EVALUATION_SUBMITTED').length;
      const participantCount = participants.length;

      return {
        ...s,
        participant_count: participantCount,
        max_participants: s.max_participants || 6,
        is_full: s.max_participants ? participantCount >= s.max_participants : false,
        submitted_evaluations_count: submittedEvaluationsCount,
        all_students_ranked: participantCount > 1 && submittedEvaluationsCount >= participantCount,
        is_results_published: isCompleted,
        my_status: studentParticipant?.status || null,
        my_rank: (isCompleted && studentParticipant?.rank) ? studentParticipant.rank : null,
        my_average_rank: (isCompleted && studentParticipant?.average_rank) ? studentParticipant.average_rank : null
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching GD sessions.' });
  }
});

// POST /api/gd-sessions - Admin creates a new GD session
router.post('/', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const { 
      title, 
      topic, 
      description, 
      pin, 
      max_participants, 
      target_type, 
      target_department, 
      target_community, 
      duration_minutes,
      questions 
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ message: 'Session title is required.' });
      return;
    }

    if (!topic || !topic.trim()) {
      res.status(400).json({ message: 'Discussion topic is required.' });
      return;
    }

    // Default 5 participants if not provided (min 2, max 20)
    const capacity = Math.max(2, Math.min(20, parseInt(max_participants, 10) || 5));

    // Format discussion questions
    let formattedQuestions = Array.isArray(questions) ? questions.map((q: any, idx: number) => ({
      id: q.id || `gdq-${idx + 1}`,
      question_text: typeof q === 'string' ? q : (q.question_text || `Question ${idx + 1}`),
      order: idx + 1
    })) : [];

    // If no questions given, generate standard GD evaluation dimensions
    if (formattedQuestions.length === 0) {
      formattedQuestions = [
        { id: 'gdq-1', question_text: 'Opening & Problem Introduction', order: 1 },
        { id: 'gdq-2', question_text: 'Subject Knowledge & Core Arguments', order: 2 },
        { id: 'gdq-3', question_text: 'Counter-arguments, Rebuttals & Listening', order: 3 },
        { id: 'gdq-4', question_text: 'Conclusion, Team Interaction & Summary', order: 4 }
      ];
    }

    const session = GdSessionsModel.create({
      title: title.trim(),
      topic: topic.trim(),
      description: description?.trim() || '',
      pin: pin ? pin.trim() : undefined,
      max_participants: capacity,
      target_type: target_type || 'ALL',
      target_department: target_type === 'DEPARTMENT' ? target_department : undefined,
      target_community: target_type === 'COMMUNITY' ? target_community : undefined,
      duration_minutes: parseInt(duration_minutes, 10) || 15,
      questions: formattedQuestions,
      status: 'SCHEDULED',
      created_by: req.user!.id
    });

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'CREATE_GD_SESSION', 'GD_SESSION', session.id, {
      title: session.title,
      topic: session.topic,
      max_participants: session.max_participants
    });

    res.status(201).json(session);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error creating GD session.' });
  }
});

// POST /api/gd-sessions/join - Student joins GD session via PIN or session_id
router.post('/join', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { pin, session_id } = req.body;
    if (!pin && !session_id) {
      res.status(400).json({ message: 'Join PIN or session ID is required.' });
      return;
    }

    if (req.user?.role !== 'STUDENT' || !req.user.student) {
      res.status(400).json({ message: 'Only registered students can participate in GD sessions.' });
      return;
    }

    let session: GdSession | undefined;
    if (pin) {
      session = GdSessionsModel.findByPin(pin.trim());
    } else if (session_id) {
      session = GdSessionsModel.findById(session_id);
    }

    if (!session) {
      res.status(404).json({ message: 'Invalid PIN or GD session not found.' });
      return;
    }

    if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
      res.status(400).json({ message: 'This GD session has already concluded.' });
      return;
    }

    // Verify audience target eligibility
    const student = req.user.student;
    if (session.target_type === 'DEPARTMENT' && session.target_department && session.target_department !== student.department) {
      res.status(403).json({ message: `This GD session is restricted to Department of ${session.target_department}.` });
      return;
    }
    if (session.target_type === 'COMMUNITY' && session.target_community && session.target_community !== student.community) {
      res.status(403).json({ message: `This GD session is restricted to ${session.target_community}.` });
      return;
    }

    const joinResult = GdParticipantsModel.join(session.id, student);
    if (joinResult.error) {
      res.status(400).json({ message: joinResult.error });
      return;
    }

    res.json({
      message: 'Successfully registered for GD session!',
      session_id: session.id,
      participant: joinResult.participant
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error joining GD session.' });
  }
});

// GET /api/gd-sessions/:id - Get details of a GD session
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const session = GdSessionsModel.findById(id);

    if (!session) {
      res.status(404).json({ message: 'GD session not found.' });
      return;
    }

    const participants = GdParticipantsModel.getParticipants(session.id);
    const isAdmin = req.user?.role === 'ADMIN';
    const isCompleted = session.status === 'COMPLETED' || Boolean(session.is_results_published);

    let myParticipant = undefined;
    if (req.user?.role === 'STUDENT' && req.user.student) {
      myParticipant = participants.find(p => p.student_id === req.user!.id);
    }

    // Evaluations submitted by this student
    let myEvaluations: { [qId: string]: any } = {};
    if (myParticipant) {
      const allEvals = memoryDb.table('gd_peer_evaluations') as GdPeerEvaluation[];
      const studentEvals = allEvals.filter(e => e.session_id === id && e.evaluator_student_id === myParticipant!.student_id);
      for (const ev of studentEvals) {
        myEvaluations[ev.question_id] = ev.rankings;
      }
    }

    const submittedEvaluationsCount = participants.filter(p => p.status === 'EVALUATION_SUBMITTED').length;
    const participantCount = participants.length;

    // Leaderboard calculation
    let leaderboard: GdLeaderboardEntry[] = [];
    if (isCompleted || isAdmin) {
      leaderboard = GdParticipantsModel.calculateLeaderboard(id);
    }

    const myRank = myParticipant && isCompleted
      ? leaderboard.find(l => l.student_id === myParticipant.student_id)?.rank || myParticipant.rank || null
      : null;

    res.json({
      ...session,
      participants,
      participant_count: participantCount,
      max_participants: session.max_participants || 6,
      submitted_evaluations_count: submittedEvaluationsCount,
      all_students_ranked: participantCount > 1 && submittedEvaluationsCount >= participantCount,
      is_results_published: isCompleted,
      leaderboard: isCompleted || isAdmin ? leaderboard : [],
      my_participant: myParticipant ? {
        ...myParticipant,
        rank: isCompleted ? myRank : null,
        average_rank: isCompleted ? myParticipant.average_rank : null,
        question_ranks: isCompleted ? myParticipant.question_ranks : undefined
      } : undefined,
      my_evaluations: myEvaluations
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching GD session details.' });
  }
});

// POST /api/gd-sessions/:id/evaluate - Student submits peer rankings
router.post('/:id/evaluate', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const sessionId = req.params.id as string;
    const session = GdSessionsModel.findById(sessionId);

    if (!session) {
      res.status(404).json({ message: 'GD session not found.' });
      return;
    }

    if (!req.user || req.user.role !== 'STUDENT' || !req.user.student) {
      res.status(400).json({ message: 'Only participating students can submit rankings.' });
      return;
    }

    const participant = GdParticipantsModel.findBySessionAndStudent(sessionId, req.user.id);
    if (!participant) {
      res.status(400).json({ message: 'You have not joined this GD session.' });
      return;
    }

    const { evaluationsByQuestion } = req.body;
    if (!evaluationsByQuestion || typeof evaluationsByQuestion !== 'object') {
      res.status(400).json({ message: 'evaluationsByQuestion payload is required.' });
      return;
    }

    const success = GdParticipantsModel.submitEvaluations(
      sessionId,
      req.user.id,
      req.user.name,
      evaluationsByQuestion
    );

    if (!success) {
      res.status(500).json({ message: 'Failed to record peer evaluations.' });
      return;
    }

    const allParticipants = GdParticipantsModel.getParticipants(sessionId);
    const submittedCount = allParticipants.filter(p => p.status === 'EVALUATION_SUBMITTED').length;

    res.json({
      message: 'GD peer rankings submitted successfully! Results will be revealed once the admin publishes.',
      submitted_evaluations_count: submittedCount,
      participant_count: allParticipants.length,
      all_students_ranked: allParticipants.length > 1 && submittedCount >= allParticipants.length
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error submitting evaluations.' });
  }
});

// PUT /api/gd-sessions/:id/publish-results - Admin reveals results with question-based rank
router.put('/:id/publish-results', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const session = GdSessionsModel.findById(id);

    if (!session) {
      res.status(404).json({ message: 'GD session not found.' });
      return;
    }

    // Calculate final leaderboard based on questions
    const leaderboard = GdParticipantsModel.calculateLeaderboard(id);

    // Mark session as COMPLETED and publish results
    const updated = GdSessionsModel.update(id, { 
      status: 'COMPLETED',
      is_results_published: true
    });

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'PUBLISH_GD_RESULTS', 'GD_SESSION', id, {
      title: session.title,
      topic: session.topic,
      total_participants: leaderboard.length,
      top_rank: leaderboard[0]?.student_name || 'None'
    });

    res.json({
      message: 'GD results published! Cohort ranks based on question evaluation are now revealed to all participants.',
      session: updated,
      leaderboard
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error publishing GD results.' });
  }
});

// PUT /api/gd-sessions/:id/status - Admin updates session status
router.put('/:id/status', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status || !['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      res.status(400).json({ message: 'Invalid status value.' });
      return;
    }

    const updates: Partial<GdSession> = { status };
    if (status === 'COMPLETED') {
      updates.is_results_published = true;
      GdParticipantsModel.calculateLeaderboard(id);
    }

    const updated = GdSessionsModel.update(id, updates);
    if (!updated) {
      res.status(404).json({ message: 'GD session not found.' });
      return;
    }

    res.json({ message: `Session status updated to ${status}.`, session: updated });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating session status.' });
  }
});

// DELETE /api/gd-sessions/:id - Admin deletes GD session
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const success = GdSessionsModel.delete(id);
    if (!success) {
      res.status(404).json({ message: 'GD session not found.' });
      return;
    }

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_GD_SESSION', 'GD_SESSION', id, {});
    res.json({ message: 'GD session deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error deleting session.' });
  }
});

export default router;
