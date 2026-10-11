import { Router, Request, Response } from 'express';
import { 
  GdSessionsModel, 
  GdParticipantsModel, 
  AuditLogsModel,
  memoryDb,
  GdSession,
  GdPeerEvaluation,
  GdLeaderboardEntry,
  GdSpeakerRating
} from '../models/dbModels.js';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';
import { getSocketIO } from '../services/meetingSocketService.js';

const router = Router();

function broadcastGdUpdate(sessionId: string, event: string, payload: any) {
  try {
    const io = getSocketIO();
    if (io) {
      io.to(`gd:${sessionId}`).emit(event, payload);
      io.to(`gd:${sessionId}`).emit('gd-session-updated', { sessionId });
    }
  } catch (err) {
    console.warn(`[Socket.io] Error broadcasting GD update for ${sessionId}:`, err);
  }
}

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

    // Default 10 participants if not provided (min 2, max 500)
    const capacity = Math.max(2, Math.min(500, parseInt(max_participants, 10) || 10));
    const speakerDuration = Math.max(10, Math.min(3600, parseInt(req.body.speaker_duration_limit_seconds, 10) || 120));

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
      created_by: req.user!.id,
      speaker_duration_limit_seconds: speakerDuration
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
    const isCompleted = session.status === 'COMPLETED' || Boolean(session.is_results_published) || session.session_stage === 'COMPLETED';

    let myParticipant = undefined;
    if (req.user?.role === 'STUDENT' && req.user.student) {
      myParticipant = participants.find(p => p.student_id === req.user!.id);
    }

    // Rank-based evaluations submitted by this student
    let myEvaluations: { [qId: string]: any } = {};
    if (myParticipant) {
      const allEvals = memoryDb.table('gd_peer_evaluations') as GdPeerEvaluation[];
      const studentEvals = allEvals.filter(e => e.session_id === id && e.evaluator_student_id === myParticipant!.student_id);
      for (const ev of studentEvals) {
        myEvaluations[ev.question_id] = ev.rankings;
      }
    }

    // 10-point speaker ratings submitted by this student: { [targetStudentId]: { [qId]: marks } }
    let mySpeakerRatings: { [speakerStudentId: string]: { [qId: string]: number } } = {};
    const allSpeakerRatings = (memoryDb.table('gd_speaker_ratings') as GdSpeakerRating[]) || [];
    if (myParticipant) {
      const studentRatings = allSpeakerRatings.filter(r => r.session_id === id && r.evaluator_student_id === myParticipant!.student_id);
      for (const r of studentRatings) {
        if (!mySpeakerRatings[r.speaker_student_id]) mySpeakerRatings[r.speaker_student_id] = {};
        mySpeakerRatings[r.speaker_student_id][r.question_id] = r.marks_out_of_10;
      }
    }

    const submittedEvaluationsCount = participants.filter(p => p.status === 'EVALUATION_SUBMITTED').length;
    const participantCount = participants.length;

    // Active speaker object
    const activeSpeaker = session.active_speaker_id
      ? participants.find(p => p.student_id === session.active_speaker_id) || null
      : null;

    // Leaderboard calculation
    const leaderboard: GdLeaderboardEntry[] = GdParticipantsModel.calculateLeaderboard(id);

    const myRank = myParticipant
      ? leaderboard.find(l => l.student_id === myParticipant.student_id)?.rank || myParticipant.rank || null
      : null;

    res.json({
      ...session,
      participants,
      active_speaker: activeSpeaker,
      participant_count: participantCount,
      max_participants: session.max_participants || 10,
      submitted_evaluations_count: submittedEvaluationsCount,
      all_students_ranked: participantCount > 1 && submittedEvaluationsCount >= participantCount,
      is_results_published: isCompleted,
      leaderboard,
      my_participant: myParticipant ? {
        ...myParticipant,
        rank: isCompleted ? myRank : null,
        average_rank: isCompleted ? myParticipant.average_rank : null,
        question_ranks: isCompleted ? myParticipant.question_ranks : undefined
      } : undefined,
      my_evaluations: myEvaluations,
      my_speaker_ratings: mySpeakerRatings
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching GD session details.' });
  }
});

// POST /api/gd-sessions/:id/speaker/start - Start active speaker turn and timer
router.post('/:id/speaker/start', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const sessionId = req.params.id as string;
    const { student_id } = req.body;
    const targetStudentId = student_id || req.user?.id;

    if (!targetStudentId) {
      res.status(400).json({ message: 'Target speaker student_id is required.' });
      return;
    }

    const result = GdSessionsModel.startSpeakerTurn(sessionId, targetStudentId);
    if (!result) {
      res.status(404).json({ message: 'Session or participant not found.' });
      return;
    }

    broadcastGdUpdate(sessionId, 'gd-speaker-started', {
      session: result.session,
      speaker: result.speaker
    });

    res.json({
      message: `Speaker turn started for ${result.speaker?.student_name || 'candidate'}.`,
      session: result.session,
      speaker: result.speaker
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error starting speaker turn.' });
  }
});

// POST /api/gd-sessions/:id/speaker/stop - Stop speaker turn, record duration, enter rating mode
router.post('/:id/speaker/stop', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const sessionId = req.params.id as string;
    const session = GdSessionsModel.findById(sessionId);
    if (!session) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }

    const targetStudentId = req.body.student_id || session.active_speaker_id || req.user?.id;
    if (!targetStudentId) {
      res.status(400).json({ message: 'No active speaker found to stop.' });
      return;
    }

    const durationSeconds = typeof req.body.duration_seconds === 'number'
      ? Math.max(1, req.body.duration_seconds)
      : undefined;

    const result = GdSessionsModel.stopSpeakerTurn(sessionId, targetStudentId, durationSeconds);
    if (!result) {
      res.status(404).json({ message: 'Failed to conclude speaker turn.' });
      return;
    }

    broadcastGdUpdate(sessionId, 'gd-speaker-stopped', {
      session: result.session,
      speaker: result.speaker,
      duration_seconds: result.speaker?.speaking_time_seconds
    });

    res.json({
      message: `Speaker turn concluded. Speaking time recorded: ${result.speaker?.speaking_time_seconds}s.`,
      session: result.session,
      speaker: result.speaker
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error stopping speaker turn.' });
  }
});

// POST /api/gd-sessions/:id/speaker/rate - Remaining peers submit marks out of 10 for the speaker
router.post('/:id/speaker/rate', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const sessionId = req.params.id as string;
    const { speaker_student_id, ratings } = req.body;

    if (!speaker_student_id) {
      res.status(400).json({ message: 'speaker_student_id is required.' });
      return;
    }

    if (!Array.isArray(ratings) || ratings.length === 0) {
      res.status(400).json({ message: 'ratings array is required.' });
      return;
    }

    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (req.user.id === speaker_student_id) {
      res.status(400).json({ message: 'Self-rating is not permitted. Only peers evaluate the speaker.' });
      return;
    }

    const result = GdSessionsModel.submitSpeakerRatings(
      sessionId,
      req.user.id,
      req.user.name || 'Peer Candidate',
      speaker_student_id,
      ratings
    );

    if (!result.success) {
      res.status(400).json({ message: 'Failed to record ratings for the candidate.' });
      return;
    }

    broadcastGdUpdate(sessionId, 'gd-rating-submitted', {
      speaker_student_id,
      evaluator_student_id: req.user.id,
      speaker: result.speaker
    });

    res.json({
      message: 'Marks recorded successfully for candidate.',
      speaker: result.speaker
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error recording speaker ratings.' });
  }
});

// POST /api/gd-sessions/:id/speaker/next - Advance to next candidate in queue
router.post('/:id/speaker/next', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const sessionId = req.params.id as string;
    const result = GdSessionsModel.nextSpeakerTurn(sessionId);

    if (!result) {
      res.status(404).json({ message: 'GD Session not found or no participants.' });
      return;
    }

    broadcastGdUpdate(sessionId, 'gd-speaker-advanced', {
      session: result.session,
      nextSpeaker: result.nextSpeaker,
      completed: result.completed
    });

    res.json({
      message: result.completed
        ? 'All candidates have concluded their speaking turns!'
        : `Advanced to candidate ${result.nextSpeaker?.student_name || 'next speaker'}.`,
      session: result.session,
      next_speaker: result.nextSpeaker,
      completed: result.completed
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error advancing to next speaker.' });
  }
});

// POST /api/gd-sessions/:id/speaker/reset - Reset speaker turns and timers
router.post('/:id/speaker/reset', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const sessionId = req.params.id as string;
    const session = GdSessionsModel.resetSpeakerTurns(sessionId);
    if (!session) {
      res.status(404).json({ message: 'GD Session not found.' });
      return;
    }

    broadcastGdUpdate(sessionId, 'gd-session-reset', { session });

    res.json({ message: 'Speaker turns and timers reset successfully.', session });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error resetting speaker turns.' });
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

// PUT /api/gd-sessions/:id/capacity - Admin updates participant limit or duration limit
router.put('/:id/capacity', requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const id = req.params.id as string;
    const { max_participants, speaker_duration_limit_seconds } = req.body;
    const session = GdSessionsModel.findById(id);

    if (!session) {
      res.status(404).json({ message: 'GD session not found.' });
      return;
    }

    const updates: Partial<GdSession> = {};
    if (max_participants !== undefined) {
      const newLimit = Math.max(2, Math.min(500, parseInt(max_participants, 10) || 10));
      updates.max_participants = newLimit;
    }
    if (speaker_duration_limit_seconds !== undefined) {
      updates.speaker_duration_limit_seconds = Math.max(10, Math.min(3600, parseInt(speaker_duration_limit_seconds, 10) || 120));
    }

    const updated = GdSessionsModel.update(id, updates);
    broadcastGdUpdate(id, 'gd-session-updated', { session: updated });

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'UPDATE_GD_CAPACITY', 'GD_SESSION', id, {
      max_participants: updated?.max_participants,
      speaker_duration_limit_seconds: updated?.speaker_duration_limit_seconds
    });

    res.json({
      message: `Candidate capacity limit updated to ${updated?.max_participants} candidates.`,
      session: updated
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating capacity limit.' });
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
