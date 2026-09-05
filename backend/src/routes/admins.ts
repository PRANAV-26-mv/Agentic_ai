import { Router, Response } from 'express';
import { AdminsModel, StudentsModel, AuditLogsModel } from '../models/dbModels.js';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/admins (List all admin members)
router.get('/', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const admins = AdminsModel.findAll();
    res.json(admins);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admins (Add a new admin member by email)
router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { email, name, department, password } = req.body;

    if (!email || !email.trim()) {
      res.status(400).json({ message: 'Email address is required to register an admin member.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name ? name.trim() : cleanEmail.split('@')[0];
    const cleanDept = department ? department.trim() : 'Computer Science & Engineering';
    const cleanPass = password && password.trim() ? password.trim() : '9488529035';

    // Check if email already registered as admin
    const existingAdmin = AdminsModel.findByEmail(cleanEmail);
    if (existingAdmin) {
      res.status(400).json({ message: `Admin member with email '${cleanEmail}' already exists.` });
      return;
    }

    // Check if email registered as student
    const existingStudent = StudentsModel.findByEmail(cleanEmail);
    if (existingStudent) {
      res.status(400).json({ message: `The email '${cleanEmail}' is registered as a Student. Please remove or update the student profile first.` });
      return;
    }

    const newAdmin = AdminsModel.create({
      email: cleanEmail,
      name: cleanName,
      department: cleanDept,
      password: cleanPass,
      role: 'ADMIN'
    });

    AuditLogsModel.log(req.user!.id, 'ADMIN', 'CREATE_ADMIN', 'ADMIN_USER', newAdmin.id, { email: cleanEmail, name: cleanName });

    res.status(201).json(newAdmin);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to add admin member.' });
  }
});

// DELETE /api/admins/:id (Delete admin member)
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = AdminsModel.findById(id);

    if (!existing) {
      res.status(404).json({ message: 'Admin member not found.' });
      return;
    }

    if (existing.email.toLowerCase() === 'pranavannur9659@gmail.com') {
      res.status(403).json({ message: 'Access Denied: Super Admin (pranavannur9659@gmail.com) cannot be deleted.' });
      return;
    }

    const success = AdminsModel.delete(id);
    if (success) {
      AuditLogsModel.log(req.user!.id, 'ADMIN', 'DELETE_ADMIN', 'ADMIN_USER', id, { email: existing.email });
      res.json({ message: `Admin member '${existing.email}' deleted successfully.` });
    } else {
      res.status(400).json({ message: 'Failed to delete admin member.' });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
