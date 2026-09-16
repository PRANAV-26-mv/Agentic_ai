import { Router, Response } from 'express';
import { RestrictedEmailsModel, AuditLogsModel, StudentsModel, AdminsModel } from '../models/dbModels.js';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// Middleware: Strict Super Admin access check for pranavannur9659@gmail.com
const requireSuperAdminOnly = (req: AuthRequest, res: Response, next: any) => {
  const userEmail = req.user?.email?.toLowerCase();
  const isSuper = userEmail === 'pranavannur9659@gmail.com' || Boolean(req.user?.admin?.is_super_admin);

  if (!isSuper) {
    res.status(403).json({ 
      message: 'Access Denied: Only Super Admin (pranavannur9659@gmail.com) can access or manage email restrictions.' 
    });
    return;
  }
  next();
};

// GET /api/restrictions (List all restricted emails)
router.get('/', requireAdmin, requireSuperAdminOnly, (_req: AuthRequest, res: Response) => {
  try {
    const list = RestrictedEmailsModel.findAll();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch restricted emails list.' });
  }
});

// GET /api/restrictions/check?email=... (Check restriction status for an email)
router.get('/check', requireAdmin, requireSuperAdminOnly, (req: AuthRequest, res: Response) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).json({ message: 'Email query parameter is required.' });
      return;
    }
    const isRestricted = RestrictedEmailsModel.isEmailRestricted(email);
    const details = RestrictedEmailsModel.findByEmail(email);
    res.json({ is_restricted: isRestricted, details: details || null });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/restrictions (Restrict an email address)
router.post('/', requireAdmin, requireSuperAdminOnly, (req: AuthRequest, res: Response): void => {
  try {
    const { email, reason } = req.body;
    if (!email || !email.trim()) {
      res.status(400).json({ message: 'Email address is required to apply restriction.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Prevent restricting the Super Admin account
    if (cleanEmail === 'pranavannur9659@gmail.com') {
      res.status(400).json({ message: 'The Super Admin account (pranavannur9659@gmail.com) can never be restricted.' });
      return;
    }

    const restrictedBy = req.user?.email || 'pranavannur9659@gmail.com';
    const restrictedRecord = RestrictedEmailsModel.add(cleanEmail, reason, restrictedBy);

    // Audit log this security action
    AuditLogsModel.log(
      req.user!.id,
      'ADMIN',
      'RESTRICT_USER_EMAIL',
      'USER',
      restrictedRecord.id,
      { email: cleanEmail, reason: restrictedRecord.reason, restricted_by: restrictedBy }
    );

    res.status(201).json({
      message: `User email '${cleanEmail}' has been successfully restricted. They can no longer enter or access the portal.`,
      restriction: restrictedRecord
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to restrict email.' });
  }
});

// DELETE /api/restrictions/:idOrEmail (Lift restriction / Unblock user)
router.delete('/:idOrEmail', requireAdmin, requireSuperAdminOnly, (req: AuthRequest, res: Response): void => {
  try {
    const idOrEmail = req.params.idOrEmail as string;
    if (!idOrEmail) {
      res.status(400).json({ message: 'Target email or restriction ID is required.' });
      return;
    }

    const existing = RestrictedEmailsModel.findById(idOrEmail) || RestrictedEmailsModel.findByEmail(idOrEmail);
    const targetEmail = existing ? existing.email : idOrEmail;

    const removed = RestrictedEmailsModel.remove(idOrEmail);
    if (!removed) {
      res.status(404).json({ message: `No active restriction found for '${idOrEmail}'.` });
      return;
    }

    // Audit log the un-restriction
    AuditLogsModel.log(
      req.user!.id,
      'ADMIN',
      'UNRESTRICT_USER_EMAIL',
      'USER',
      existing?.id || idOrEmail,
      { email: targetEmail }
    );

    res.json({ message: `Restriction lifted for '${targetEmail}'. User can now log in and access the portal.` });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to lift restriction.' });
  }
});

export default router;
