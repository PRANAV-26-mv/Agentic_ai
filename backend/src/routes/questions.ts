import { Router, Request, Response } from 'express';
import { QuestionsModel, QuestionPoolsModel, AuditLogsModel } from '../models/dbModels.js';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';
import { aiService } from '../services/aiService.js';

const router = Router();

// GET /api/questions
router.get('/', requireAdmin, (req: Request, res: Response) => {
  const { type, difficulty, topic, status } = req.query;
  const list = QuestionsModel.findAll({
    type: type as string,
    difficulty: difficulty as string,
    topic: topic as string,
    status: status as string
  });
  res.json(list);
});

// POST /api/questions
router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { question_type, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, rubric, expected_answer, marks, difficulty, topic } = req.body;

    if (!question_text || !question_type) {
      res.status(400).json({ message: 'Question text and type are required.' });
      return;
    }

    const newQ = QuestionsModel.create({
      question_type,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      explanation,
      rubric,
      expected_answer,
      marks: parseFloat(marks || '2'),
      difficulty: difficulty || 'Medium',
      topic: topic || 'General',
      status: 'APPROVED'
    });

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'CREATE_QUESTION', 'QUESTION', newQ.id);
    res.status(201).json(newQ);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/questions/:id
router.put('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const updated = QuestionsModel.update(id, req.body);
  if (!updated) {
    res.status(404).json({ message: 'Question not found.' });
    return;
  }
  AuditLogsModel.log(req.user!.id, 'ADMIN', 'UPDATE_QUESTION', 'QUESTION', id);
  res.json(updated);
});

// POST /api/questions/:id/approve
router.post('/:id/approve', requireAdmin, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const approved = QuestionsModel.approve(id);
  if (approved) {
    AuditLogsModel.log(req.user!.id, 'ADMIN', 'APPROVE_QUESTION', 'QUESTION', id);
    res.json(approved);
  } else {
    res.status(404).json({ message: 'Question not found.' });
  }
});

// POST /api/questions/:id/reject
router.post('/:id/reject', requireAdmin, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const rejected = QuestionsModel.reject(id);
  if (rejected) {
    AuditLogsModel.log(req.user!.id, 'ADMIN', 'REJECT_QUESTION', 'QUESTION', id);
    res.json(rejected);
  } else {
    res.status(404).json({ message: 'Question not found.' });
  }
});

// POST /api/questions/:id/regenerate
router.post('/:id/regenerate', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const q = QuestionsModel.findById(id);
  if (!q) {
    res.status(404).json({ message: 'Question not found.' });
    return;
  }

  const generated = await aiService.generateQuestions(
    `Regenerate question on topic: ${q.topic || 'AI'}`,
    q.question_type === 'MCQ' ? 1 : 0,
    q.question_type === 'WRITING' ? 1 : 0,
    q.difficulty
  );

  if (generated.length > 0) {
    const updated = QuestionsModel.update(q.id, {
      question_text: generated[0].question_text,
      option_a: generated[0].option_a,
      option_b: generated[0].option_b,
      option_c: generated[0].option_c,
      option_d: generated[0].option_d,
      correct_answer: generated[0].correct_answer,
      explanation: generated[0].explanation,
      rubric: generated[0].rubric,
      expected_answer: generated[0].expected_answer,
      status: 'REVIEW'
    });
    AuditLogsModel.log(req.user!.id, 'ADMIN', 'REGENERATE_QUESTION', 'QUESTION', q.id);
    res.json(updated);
  } else {
    res.status(500).json({ message: 'AI regeneration failed.' });
  }
});

// DELETE /api/questions/all (Delete all questions)
router.delete('/all', requireAdmin, (req: AuthRequest, res: Response) => {
  QuestionsModel.deleteAll();
  AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_ALL_QUESTIONS', 'QUESTION');
  res.json({ message: 'All questions deleted successfully.' });
});

// DELETE /api/questions/:id
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (id === 'all') {
    QuestionsModel.deleteAll();
    AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_ALL_QUESTIONS', 'QUESTION');
    res.json({ message: 'All questions deleted successfully.' });
    return;
  }
  const success = QuestionsModel.delete(id);
  if (success) {
    AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_QUESTION', 'QUESTION', id);
    res.json({ message: 'Question deleted successfully.' });
  } else {
    res.status(404).json({ message: 'Question not found.' });
  }
});

// QUESTION POOLS
router.get('/pools', requireAdmin, (_req: Request, res: Response) => {
  res.json(QuestionPoolsModel.findAll());
});

router.post('/pools', requireAdmin, (req: AuthRequest, res: Response) => {
  const { name, description, question_ids } = req.body;
  if (!name) {
    res.status(400).json({ message: 'Pool name is required.' });
    return;
  }
  const pool = QuestionPoolsModel.create({ name, description, question_ids });
  AuditLogsModel.log(req.user!.id, 'ADMIN', 'CREATE_QUESTION_POOL', 'QUESTION_POOL', pool.id);
  res.status(201).json(pool);
});

router.post('/pools/:id/questions', requireAdmin, (req: AuthRequest, res: Response) => {
  const poolId = req.params.id as string;
  const { question_id } = req.body;
  QuestionPoolsModel.addQuestion(poolId, question_id);
  res.json({ message: 'Question added to pool successfully.' });
});

router.delete('/pools/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const success = QuestionPoolsModel.delete(id);
  if (success) {
    AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_QUESTION_POOL', 'QUESTION_POOL', id);
    res.json({ message: 'Question pool deleted successfully.' });
  } else {
    res.status(404).json({ message: 'Question pool not found.' });
  }
});

export default router;
