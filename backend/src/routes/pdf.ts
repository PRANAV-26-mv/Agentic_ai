import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';
import { aiService } from '../services/aiService.js';
import { QuestionsModel, AuditLogsModel } from '../models/dbModels.js';

const router = Router();
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

// POST /api/pdf/generate-questions
router.post('/generate-questions', requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mcq_count, writing_count, difficulty } = req.body;

    const rawMcq = parseInt(mcq_count !== undefined ? String(mcq_count) : '5', 10);
    const rawWriting = parseInt(writing_count !== undefined ? String(writing_count) : '2', 10);

    const mcqCount = Math.max(0, Math.min(150, isNaN(rawMcq) ? 5 : rawMcq));
    const writingCount = Math.max(0, Math.min(50, isNaN(rawWriting) ? 2 : rawWriting));

    if (mcqCount === 0 && writingCount === 0) {
      res.status(400).json({ message: 'Please specify at least 1 question to generate (MCQ or Writing).' });
      return;
    }

    let textContent = '';
    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
        res.status(400).json({ message: 'Unable to process PDF. Please upload a valid PDF.' });
        return;
      }
      const data = await pdfParse(req.file.buffer);
      textContent = data.text;
    } else if (req.body.text) {
      textContent = req.body.text;
    } else {
      res.status(400).json({ message: 'Please upload a PDF file or provide text content.' });
      return;
    }

    if (!textContent || textContent.trim().length < 20) {
      res.status(400).json({ message: 'Unable to extract text from PDF. Ensure the PDF contains readable text.' });
      return;
    }

    // Call pluggable AI service layer
    const generatedRaw = await aiService.generateQuestions(
      textContent,
      mcqCount,
      writingCount,
      difficulty || 'Medium'
    );

    // Save generated questions to DRAFT / REVIEW state (Never auto-publish!)
    const savedQuestions = generatedRaw.map(q => QuestionsModel.create({
      ...q,
      status: 'REVIEW' // Stored in REVIEW status for Admin Review screen
    }));

    AuditLogsModel.log(
      req.user!.id,
      'ADMIN',
      'AI_GENERATE_QUESTIONS',
      'PDF',
      req.file ? req.file.originalname : 'text-input',
      { generatedCount: savedQuestions.length }
    );

    res.status(201).json({
      message: `${savedQuestions.length} questions successfully generated and saved for Admin Review.`,
      mcqCount,
      writingCount,
      questions: savedQuestions
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to process PDF. Please upload a valid PDF.' });
  }
});

export default router;
