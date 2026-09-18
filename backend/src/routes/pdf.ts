import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';
import { aiService } from '../services/aiService.js';
import { QuestionsModel, AuditLogsModel } from '../models/dbModels.js';
import { generateQuestionPaperPDF, QuestionPaperOptions } from '../services/questionPaperPdfService.js';

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

// POST /api/pdf/extract-questions
// Strict Admin Only! Parses an already created question paper PDF and automatically extracts questions and options
router.post('/extract-questions', requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let textContent = '';
    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
        res.status(400).json({ message: 'Unable to process file. Please upload a valid PDF document.' });
        return;
      }
      const data = await pdfParse(req.file.buffer);
      textContent = data.text;
    } else if (req.body.text) {
      textContent = req.body.text;
    } else {
      res.status(400).json({ message: 'Please upload a question paper PDF or provide question text.' });
      return;
    }

    if (!textContent || textContent.trim().length < 20) {
      res.status(400).json({ message: 'Unable to extract text from PDF. Ensure the question paper contains readable text.' });
      return;
    }

    // Call extraction layer
    const extractedRaw = await aiService.extractExistingQuestions(textContent);

    if (extractedRaw.length === 0) {
      res.status(400).json({ message: 'No questions could be extracted. Please ensure the PDF contains numbered questions or options (A, B, C, D).' });
      return;
    }

    // Save extracted questions to REVIEW status for Admin Review screen
    const savedQuestions = extractedRaw.map(q => QuestionsModel.create({
      ...q,
      status: 'REVIEW'
    }));

    AuditLogsModel.log(
      req.user!.id,
      'ADMIN',
      'AI_EXTRACT_QUESTION_PAPER_PDF',
      'PDF',
      req.file ? req.file.originalname : 'text-input',
      { extractedCount: savedQuestions.length }
    );

    res.status(201).json({
      message: `${savedQuestions.length} questions successfully extracted from question paper for Admin Review.`,
      questions: savedQuestions,
      count: savedQuestions.length
    });
  } catch (err: any) {
    console.error('Error extracting question paper:', err);
    res.status(500).json({ message: err.message || 'Error extracting questions from PDF.' });
  }
});

// POST /api/pdf/export-questions-pdf
// Strict Admin Only! Converts generated or selected questions into an official downloadable PDF
router.post('/export-questions-pdf', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      questions, 
      question_ids,
      title, 
      subtitle, 
      institution, 
      duration_minutes, 
      total_marks, 
      instructions, 
      include_answers 
    } = req.body;

    let targetQuestions = [];

    if (Array.isArray(questions) && questions.length > 0) {
      targetQuestions = questions;
    } else if (Array.isArray(question_ids) && question_ids.length > 0) {
      targetQuestions = question_ids
        .map((id: string) => QuestionsModel.findById(id))
        .filter((q: any) => Boolean(q));
    }

    if (targetQuestions.length === 0) {
      res.status(400).json({ message: 'No questions provided to generate PDF.' });
      return;
    }

    const pdfOptions: QuestionPaperOptions = {
      title: title || 'AI GENERATED EXAMINATION QUESTION PAPER',
      subtitle: subtitle || (targetQuestions[0]?.topic ? `Subject / Topic: ${targetQuestions[0].topic}` : 'Official Assessment Paper'),
      institution: institution || 'STUDENT ASSESSMENT & LEARNING PORTAL',
      duration_minutes: duration_minutes ? parseInt(String(duration_minutes), 10) : 60,
      total_marks: total_marks ? parseFloat(String(total_marks)) : undefined,
      instructions: Array.isArray(instructions) ? instructions : undefined,
      include_answers: Boolean(include_answers)
    };

    const pdfBuffer = await generateQuestionPaperPDF(targetQuestions, pdfOptions);

    const safeTitle = (title || 'Question_Paper').replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${safeTitle}_${timestamp}.pdf`;

    AuditLogsModel.log(
      req.user!.id,
      'ADMIN',
      'AI_EXPORT_QUESTIONS_PDF',
      'PDF',
      filename,
      {
        questionCount: targetQuestions.length,
        includeAnswers: Boolean(include_answers),
        title: pdfOptions.title
      }
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('Error generating question paper PDF:', err);
    res.status(500).json({ message: err.message || 'Error generating question paper PDF.' });
  }
});

export default router;