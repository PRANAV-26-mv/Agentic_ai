import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { StudyMaterialsModel, AuditLogsModel } from '../models/dbModels.js';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

// GET /api/materials
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const student = req.user?.role === 'STUDENT' ? req.user.student : undefined;
  const materials = StudyMaterialsModel.findAll(student);
  res.json(materials);
});

// POST /api/materials
router.post('/', requireAdmin, upload.single('file'), (req: AuthRequest, res: Response) => {
  try {
    const { title, description, material_type, external_url, target_type, target_department, target_community } = req.body;

    if (!title || !material_type) {
      res.status(400).json({ message: 'Title and material type are required.' });
      return;
    }

    let file_url = external_url || '';
    if (req.file) {
      file_url = `/uploads/${req.file.filename}`;
    }

    if (!file_url && material_type !== 'URL') {
      res.status(400).json({ message: 'File upload is required for document types.' });
      return;
    }

    const newMaterial = StudyMaterialsModel.create({
      title,
      description,
      material_type,
      file_url,
      page_count: req.file ? Math.floor(Math.random() * 15) + 5 : undefined,
      target_type: target_type || 'ALL',
      target_department,
      target_community,
      created_by: req.user!.id
    });

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'CREATE_MATERIAL', 'MATERIAL', newMaterial.id, { title: newMaterial.title });

    res.status(201).json(newMaterial);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/materials/:id
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const success = StudyMaterialsModel.delete(id);
  if (success) {
    AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_MATERIAL', 'MATERIAL', id);
    res.json({ message: 'Study material deleted successfully.' });
  } else {
    res.status(404).json({ message: 'Material not found.' });
  }
});

export default router;
