import { Router, Response } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';
import { CertificateSettingsModel, AuditLogsModel } from '../models/dbModels.js';

const router = Router();

// GET /api/certificate-settings - Retrieve active certificate configuration
router.get('/', requireAuth, (_req: AuthRequest, res: Response) => {
  try {
    const settings = CertificateSettingsModel.getSettings();
    res.json(settings);
  } catch (err: any) {
    console.error('Error fetching certificate settings:', err);
    res.status(500).json({ message: 'Failed to retrieve certificate settings.' });
  }
});

// PUT /api/certificate-settings - Admin updates certificate configuration
router.put('/', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const adminUser = req.user!;
    const updates = req.body;

    // Validate that updates object is provided
    if (!updates || typeof updates !== 'object') {
      res.status(400).json({ message: 'Invalid settings payload provided.' });
      return;
    }

    const updated = CertificateSettingsModel.updateSettings(updates, adminUser.name || adminUser.email);

    // Audit log this configuration change
    AuditLogsModel.log(
      adminUser.id,
      'ADMIN',
      'UPDATE_CERTIFICATE_SETTINGS',
      'SETTINGS',
      'global-cert-settings',
      {
        header_brand_name: updated.header_brand_name,
        document_title: updated.document_title,
        updated_by: adminUser.email
      }
    );

    res.json({
      message: 'Certificate configuration successfully updated.',
      settings: updated
    });
  } catch (err: any) {
    console.error('Error updating certificate settings:', err);
    res.status(500).json({ message: 'Failed to update certificate settings.' });
  }
});

// POST /api/certificate-settings/reset - Admin resets certificate configuration to default
router.post('/reset', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const adminUser = req.user!;
    const reset = CertificateSettingsModel.resetSettings(adminUser.name || adminUser.email);

    // Audit log the reset
    AuditLogsModel.log(
      adminUser.id,
      'ADMIN',
      'RESET_CERTIFICATE_SETTINGS',
      'SETTINGS',
      'global-cert-settings',
      { reset_by: adminUser.email }
    );

    res.json({
      message: 'Certificate configuration reset to AGENTIC_AI_A7 factory defaults.',
      settings: reset
    });
  } catch (err: any) {
    console.error('Error resetting certificate settings:', err);
    res.status(500).json({ message: 'Failed to reset certificate settings.' });
  }
});

export default router;
