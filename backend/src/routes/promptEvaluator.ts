import { Router, Response } from 'express';
import { 
  PromptSessionsModel, 
  PromptSubmissionsModel, 
  NotificationsModel, 
  AuditLogsModel,
  PromptSession,
  PromptSubmission
} from '../models/dbModels.js';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';
import { promptEvaluatorService } from '../services/promptEvaluatorService.js';
import { emailService } from '../services/emailService.js';
import { broadcastNotification } from '../services/meetingSocketService.js';

const router = Router();

// Helper to check Super Admin privileges
const isSuperAdminUser = (req: AuthRequest): boolean => {
  const email = req.user?.email?.toLowerCase();
  return email === 'pranavannur9659@gmail.com' || Boolean(req.user?.admin?.is_super_admin);
};

// ==========================================
// SESSIONS ENDPOINTS
// ==========================================

// GET /api/prompt-evaluator/sessions - List sessions
router.get('/sessions', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'STUDENT') {
      const activeList = PromptSessionsModel.getActive();
      const student = req.user.student;
      
      // Filter sessions based on student targeting if applicable
      const filtered = activeList.filter(s => {
        if (s.target_community && student?.community && s.target_community !== 'ALL' && s.target_community !== student.community) {
          return false;
        }
        if (s.target_department && student?.department && s.target_department !== 'ALL' && s.target_department !== student.department) {
          return false;
        }
        if (s.target_year && student?.year && s.target_year > 0 && s.target_year !== student.year) {
          return false;
        }
        return true;
      });

      res.json(filtered);
    } else {
      // Admins see all sessions
      const allSessions = PromptSessionsModel.getAll();
      res.json(allSessions);
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch prompt sessions' });
  }
});

// GET /api/prompt-evaluator/sessions/:id - Get single session
router.get('/sessions/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const session = PromptSessionsModel.findById(req.params.id as string);
    if (!session) {
      res.status(404).json({ message: 'Prompt session not found' });
      return;
    }
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/prompt-evaluator/sessions - Create challenge session (Admin)
router.post('/sessions', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { title, description, task_objective, target_community, target_department, target_year, rubrics } = req.body;
    if (!title || !description) {
      res.status(400).json({ message: 'Title and description are required.' });
      return;
    }

    const session = PromptSessionsModel.create({
      title: title.trim(),
      description: description.trim(),
      task_objective: task_objective ? task_objective.trim() : '',
      target_community: target_community || 'ALL',
      target_department: target_department || 'ALL',
      target_year: target_year ? Number(target_year) : 0,
      status: 'ACTIVE',
      created_by: req.user?.name || 'Administrator',
      rubrics: rubrics || {}
    });

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'CREATE_PROMPT_SESSION', 'PROMPT_EVALUATOR', session.id, { title: session.title });
    res.status(201).json(session);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/prompt-evaluator/sessions/:id - Update session (Admin)
router.put('/sessions/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const session = PromptSessionsModel.findById(id);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    const updated = PromptSessionsModel.update(id, req.body);
    AuditLogsModel.log(req.user!.id, 'ADMIN', 'UPDATE_PROMPT_SESSION', 'PROMPT_EVALUATOR', id, { title: updated?.title });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/prompt-evaluator/sessions/:id - Delete session (Admin)
router.delete('/sessions/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const session = PromptSessionsModel.findById(id);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    PromptSessionsModel.delete(id);
    const deletedSubmissions = PromptSubmissionsModel.deleteBySession(id);
    AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_PROMPT_SESSION', 'PROMPT_EVALUATOR', id, { title: session.title, deletedSubmissions });
    res.json({ message: 'Session and all associated submissions deleted successfully', deletedSubmissions });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// EVALUATION & SUBMISSIONS ENDPOINTS
// ==========================================

// POST /api/prompt-evaluator/evaluate - Real-time Prompt Evaluation
router.post('/evaluate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ message: 'Prompt text is required.' });
      return;
    }

    let session: PromptSession | undefined;
    if (sessionId) {
      session = PromptSessionsModel.findById(sessionId);
    }

    const taskTitle = session?.title || 'General Prompt Engineering Assessment';
    const taskDescription = session?.task_objective || session?.description || 'Construct an effective, high-precision prompt with explicit persona, constraints, and format specifications.';

    // Run Dual-Engine Evaluation (Gemini AI with fallback to Heuristic Rule Engine)
    const evaluation = await promptEvaluatorService.evaluatePrompt(
      prompt.trim(),
      taskTitle,
      taskDescription
    );

    let submission: PromptSubmission | null = null;

    // If submitted by a student and associated with a session, persist the submission
    if (req.user?.role === 'STUDENT' && session) {
      const student = req.user.student!;
      submission = PromptSubmissionsModel.createOrUpdate({
        session_id: session.id,
        student_id: student.id,
        student_name: student.name,
        student_email: student.email,
        student_reg: student.student_id,
        student_department: student.department,
        student_year: student.year,
        submitted_prompt: prompt.trim(),
        score: evaluation.score,
        grade: evaluation.grade,
        metrics: evaluation.metrics,
        mistakes: evaluation.mistakes,
        strengths: evaluation.strengths,
        suggestions: evaluation.suggestions,
        improved_prompt: evaluation.improvedPrompt,
        summary_feedback: evaluation.summaryFeedback,
        engine_used: evaluation.engineUsed,
        is_published: session.results_published,
        notification_sent: false,
        email_sent: false
      });
    }

    const isResultsPublished = Boolean(session?.results_published);
    const isStudent = req.user?.role === 'STUDENT';

    // If student and results have not been officially launched by admin yet, lock ALL results (score, grade, mistakes, corrected prompt)
    let finalEvaluation: any = { ...evaluation };
    let finalSubmission: any = submission ? { ...submission } : null;

    if (isStudent && !isResultsPublished) {
      finalEvaluation = {
        ...evaluation,
        score: null,
        grade: 'PENDING',
        metrics: null,
        mistakes: [],
        strengths: [],
        suggestions: [],
        improvedPrompt: null,
        summaryFeedback: 'Your prompt has been successfully analyzed and registered. All evaluation results, score, mistakes, and corrected prompt revision are locked until released by the Administrator.',
        isResultsPublished: false,
        statusMessage: 'Prompt evaluated and registered! All results will be unlocked when the Super Admin launches the final results.'
      };

      if (finalSubmission) {
        finalSubmission = {
          ...finalSubmission,
          score: null,
          grade: 'PENDING',
          metrics: null,
          mistakes: [],
          strengths: [],
          suggestions: [],
          improved_prompt: null,
          summary_feedback: 'Your prompt has been successfully analyzed and registered. All evaluation results, score, mistakes, and corrected prompt revision are locked until released by the Administrator.',
          is_published: false
        };
      }
    } else {
      finalEvaluation.isResultsPublished = true;
    }

    res.json({
      evaluation: finalEvaluation,
      submission: finalSubmission,
      session,
      isResultsPublished
    });
  } catch (err: any) {
    console.error('Prompt Evaluation error:', err);
    res.status(500).json({ message: err.message || 'Prompt evaluation failed' });
  }
});

// GET /api/prompt-evaluator/my-submissions - Student Submissions History
router.get('/my-submissions', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'STUDENT') {
      res.status(403).json({ message: 'Only students have personal submission logs' });
      return;
    }
    const student = req.user.student!;
    const submissions = PromptSubmissionsModel.findByStudent(student.id);
    const sessions = PromptSessionsModel.getAll();

    const withSessionInfo = submissions.map(sub => {
      const session = sessions.find(s => s.id === sub.session_id);
      const isPublished = Boolean(session?.results_published || sub.is_published);
      return {
        ...sub,
        score: isPublished ? sub.score : null,
        grade: isPublished ? sub.grade : 'PENDING',
        metrics: isPublished ? sub.metrics : null,
        mistakes: isPublished ? sub.mistakes : [],
        strengths: isPublished ? sub.strengths : [],
        suggestions: isPublished ? sub.suggestions : [],
        improved_prompt: isPublished ? sub.improved_prompt : null,
        summary_feedback: isPublished ? sub.summary_feedback : 'Locked pending release by Administrator.',
        session_title: session?.title || 'Unknown Session',
        session_published: isPublished
      };
    });

    res.json(withSessionInfo);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/prompt-evaluator/sessions/:id/submissions - Admin view all submissions for session
router.get('/sessions/:id/submissions', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.params.id as string;
    const session = PromptSessionsModel.findById(sessionId);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    const submissions = PromptSubmissionsModel.findBySession(sessionId);
    res.json({
      session,
      submissions
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// SUPER ADMIN LAUNCH & BROADCAST FINAL RESULTS
// ==========================================

// POST /api/prompt-evaluator/sessions/:id/launch-results
router.post('/sessions/:id/launch-results', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const isSuper = isSuperAdminUser(req);
    if (!isSuper) {
      res.status(403).json({ 
        message: 'Permission Denied: Only the Super Admin can launch and broadcast official final results.' 
      });
      return;
    }

    const sessionId = req.params.id as string;
    const session = PromptSessionsModel.findById(sessionId);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    // 1. Mark session as published
    const updatedSession = PromptSessionsModel.publishResults(sessionId);

    // 2. Mark all submissions in this session as published
    const submissions = PromptSubmissionsModel.markPublishedForSession(sessionId);

    if (submissions.length === 0) {
      res.json({ 
        success: true, 
        message: 'Session results marked as published. Note: No student submissions were recorded yet for this session.',
        publishedCount: 0 
      });
      return;
    }

    let notificationsCreated = 0;
    let emailsSent = 0;

    // 3. Dispatch individualized notifications and emails with concrete mistakes to each student
    for (const sub of submissions) {
      try {
        // Prepare mistakes summary text
        const mistakesList = sub.mistakes.length > 0
          ? sub.mistakes.map((m, idx) => `${idx + 1}. [${m.severity}] ${m.title} (-${m.penaltyMarks} pts): ${m.description} -> Fix: ${m.howToFix}`).join('\n\n')
          : 'None detected! Outstanding execution.';

        const notifTitle = `🎯 Final Prompt Evaluation: ${session.title}`;
        const notifMessage = `Your prompt evaluation result is published! Score: ${sub.score}/100 (Grade ${sub.grade}). Found ${sub.mistakes.length} mistakes/areas of improvement. View your full report and improved revision in the Prompt Evaluator.`;

        // Create in-portal notification
        const notif = NotificationsModel.create({
          title: notifTitle,
          message: notifMessage,
          target_type: 'STUDENTS_ONLY',
          priority: 'IMPORTANT',
          action_url: `/prompt-evaluator?sessionId=${sessionId}`,
          sender_role: 'SUPER_ADMIN',
          sender_name: req.user?.name || 'Super Admin'
        });

        // Broadcast real-time toast to desktop / browser
        broadcastNotification(notif);
        notificationsCreated++;

        // Dispatch official Email with score, mistakes, and suggestions
        if (sub.student_email) {
          const emailMessage = `Dear ${sub.student_name},

Your official prompt evaluation results for "${session.title}" have been reviewed and published by the Super Administrator!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 OFFICIAL SCORE: ${sub.score} / 100  (Grade: ${sub.grade})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PERFORMANCE BREAKDOWN:
• Clarity & Specificity: ${sub.metrics?.clarityAndSpecificity ?? 0} / 20
• Persona & Role Assignment: ${sub.metrics?.personaAndRole ?? 0} / 20
• Constraints & Guardrails: ${sub.metrics?.constraintsAndGuardrails ?? 0} / 20
• Output Formatting Rules: ${sub.metrics?.outputFormatting ?? 0} / 20
• Security & Prompt Injection Defense: ${sub.metrics?.securityAndRobustness ?? 0} / 20

⚠️ MISTAKES & HOW TO FIX:
${mistakesList}

💡 KEY STRENGTHS:
${sub.strengths.length > 0 ? sub.strengths.map(s => `• ${s}`).join('\n') : '• Attempted prompt structure.'}

🚀 ACTIONABLE RECOMMENDATIONS:
${sub.suggestions.length > 0 ? sub.suggestions.map(s => `• ${s}`).join('\n') : '• Review the improved prompt provided in your portal dashboard.'}

Login to the portal at any time to review your side-by-side prompt diff and AI-optimized template!`;

          await emailService.sendBroadcast({
            subject: `🎯 Final Result: Prompt Evaluator - ${session.title} (Score: ${sub.score}/100)`,
            message: emailMessage,
            recipients: [sub.student_email],
            senderName: req.user?.name || 'Super Administrator',
            senderEmail: req.user?.email || 'admin@portal.edu',
            category: 'ASSESSMENT'
          });

          // Mark email_sent and notification_sent on submission
          PromptSubmissionsModel.update(sub.id, {
            notification_sent: true,
            email_sent: true
          });

          emailsSent++;
        }
      } catch (subErr: any) {
        console.error(`Error notifying student ${sub.student_email}:`, subErr.message);
      }
    }

    AuditLogsModel.log(
      req.user!.id,
      'ADMIN',
      'LAUNCH_PROMPT_FINAL_RESULTS',
      'PROMPT_EVALUATOR',
      sessionId,
      {
        sessionTitle: session.title,
        studentsPublished: submissions.length,
        notificationsCreated,
        emailsSent
      }
    );

    res.json({
      success: true,
      message: `Final results officially launched! Published ${submissions.length} student scores. In-app notifications sent to ${notificationsCreated} students and emails dispatched to ${emailsSent} students.`,
      session: updatedSession,
      publishedCount: submissions.length,
      notificationsCreated,
      emailsSent
    });
  } catch (err: any) {
    console.error('Launch Final Results error:', err);
    res.status(500).json({ message: err.message || 'Failed to launch final results' });
  }
});

export default router;
