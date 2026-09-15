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
router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      const errMsg = err.code === 'LIMIT_FILE_SIZE'
        ? 'File size exceeds maximum limit of 25MB.'
        : (err.message || 'Error uploading file.');
      res.status(400).json({ message: errMsg });
      return;
    }

    try {
      const { title, description, material_type, external_url, target_type, target_department, target_community } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ message: 'Title is required.' });
        return;
      }

      if (!material_type) {
        res.status(400).json({ message: 'Material type is required.' });
        return;
      }

      let file_url = external_url ? external_url.trim() : '';
      if (req.file) {
        file_url = `/uploads/${req.file.filename}`;
      }

      if (!file_url && material_type !== 'URL') {
        res.status(400).json({ message: 'Please select a file to upload for document types.' });
        return;
      }

      if (material_type === 'URL' && !file_url) {
        res.status(400).json({ message: 'Please provide a valid external URL.' });
        return;
      }

      const newMaterial = StudyMaterialsModel.create({
        title: title.trim(),
        description: description ? description.trim() : '',
        material_type,
        file_url,
        page_count: req.file ? Math.floor(Math.random() * 15) + 5 : undefined,
        target_type: target_type || 'ALL',
        target_department: target_department ? target_department.trim() : undefined,
        target_community: target_community ? target_community.trim() : undefined,
        created_by: req.user!.id
      });

      AuditLogsModel.log(req.user!.id, 'ADMIN', 'CREATE_MATERIAL', 'MATERIAL', newMaterial.id, { title: newMaterial.title });

      res.status(201).json(newMaterial);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Internal server error while saving study material.' });
    }
  });
});

// DELETE /api/materials/:id
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const existing = StudyMaterialsModel.findById(id);
  if (!existing) {
    res.status(404).json({ message: 'Material not found.' });
    return;
  }

  // Remove physical file from disk if stored locally in uploads/
  if (existing.file_url && existing.file_url.startsWith('/uploads/')) {
    const filename = existing.file_url.replace(/^\/uploads\//, '');
    const diskPath = path.resolve(uploadDir, filename);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (e) {
        console.error('Failed to unlink deleted study material file:', e);
      }
    }
  }

  const success = StudyMaterialsModel.delete(id);
  if (success) {
    AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_MATERIAL', 'MATERIAL', id);
    res.json({ message: 'Study material deleted successfully.' });
  } else {
    res.status(404).json({ message: 'Material not found.' });
  }
});

export default router;
