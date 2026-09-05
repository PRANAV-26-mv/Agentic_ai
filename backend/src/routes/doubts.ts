import { Router, Request, Response } from 'express';
import { DoubtsModel, StudyMaterialsModel } from '../models/dbModels.js';
import { requireStudent, AuthRequest } from '../middleware/authMiddleware.js';
import { aiService } from '../services/aiService.js';

const router = Router();

// POST /api/doubts/conversations
router.post('/conversations', requireStudent, (req: AuthRequest, res: Response) => {
  try {
    const { material_id, topic } = req.body;
    const conv = DoubtsModel.findOrCreateConversation(req.user!.id, material_id, topic);
    const messages = DoubtsModel.getMessages(conv.id);
    const material = material_id ? StudyMaterialsModel.findById(material_id) : undefined;
    res.json({ conversation: conv, messages, material });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/doubts/conversations/:id
router.get('/conversations/:id', requireStudent, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const messages = DoubtsModel.getMessages(id);
  res.json(messages);
});

// POST /api/doubts/conversations/:id/messages
router.post('/conversations/:id/messages', requireStudent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, material_id } = req.body;
    const conversationId = req.params.id as string;

    if (!content || !content.trim()) {
      res.status(400).json({ message: 'Message content is required.' });
      return;
    }

    const studentMsg = DoubtsModel.addMessage(conversationId, 'student', content);
    const student = req.user!.student!;
    let contextMaterials = StudyMaterialsModel.findAll(student);

    if (material_id) {
      const specificMat = StudyMaterialsModel.findById(material_id);
      if (specificMat) {
        contextMaterials = [specificMat];
      }
    }

    const history = DoubtsModel.getMessages(conversationId).map(m => ({
      sender: m.sender,
      content: m.content
    }));

    const aiResponse = await aiService.answerDoubt(history, content, contextMaterials);
    const aiMsg = DoubtsModel.addMessage(conversationId, 'ai', aiResponse.answer);

    res.json({
      studentMessage: studentMsg,
      aiMessage: aiMsg,
      sourceMaterialTitle: aiResponse.sourceMaterialTitle
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
