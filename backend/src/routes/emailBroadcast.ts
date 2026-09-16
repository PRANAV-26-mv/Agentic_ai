import { Router, Response } from 'express';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';
import { StudentsModel, AdminsModel, EmailLogsModel, AuditLogsModel } from '../models/dbModels.js';
import { emailService } from '../services/emailService.js';

const router = Router();

// GET /api/email-broadcast/recipients (List eligible student and admin recipients)
router.get('/recipients', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const students = StudentsModel.findAll();
    const admins = AdminsModel.findAll();

    const studentList = students.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      student_id: s.student_id,
      department: s.department,
      year: s.year,
      community: s.community,
      status: s.status
    }));

    const adminList = admins.map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
      department: a.department,
      is_super_admin: Boolean(a.is_super_admin || a.email.toLowerCase() === 'pranavannur9659@gmail.com')
    }));

    const currentAdmin = AdminsModel.findById(req.user!.id);
    const hasCredentials = Boolean(
      currentAdmin?.email_app_password ||
      (process.env.SMTP_USER?.toLowerCase() === req.user?.email.toLowerCase() && process.env.SMTP_PASS)
    );

    res.json({
      students: studentList,
      admins: adminList,
      smtp_status: emailService.getStatus(),
      current_admin: {
        id: req.user!.id,
        name: req.user!.name,
        email: req.user!.email,
        has_credentials: hasCredentials
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to retrieve recipient list.' });
  }
});

// GET /api/email-broadcast/history (List past sent email broadcasts)
router.get('/history', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const history = EmailLogsModel.findAll();
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to retrieve email broadcast history.' });
  }
});

// POST /api/email-broadcast/send (Dispatch email to selected recipients)
router.post('/send', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subject, message, selected_emails, category, recipient_breakdown } = req.body;

    if (!subject || !subject.trim()) {
      res.status(400).json({ message: 'Email Subject is required.' });
      return;
    }

    if (!message || !message.trim()) {
      res.status(400).json({ message: 'Email Message body is required.' });
      return;
    }

    if (!Array.isArray(selected_emails) || selected_emails.length === 0) {
      res.status(400).json({ message: 'At least one recipient email address must be selected.' });
      return;
    }

    const sender = req.user!;
    const senderName = sender.name || 'Portal Administrator';
    const senderEmail = sender.email;
    const currentAdmin = AdminsModel.findById(sender.id);

    // Send broadcast through emailService with current admin's email and credentials
    const result = await emailService.sendBroadcast({
      subject: subject.trim(),
      message: message.trim(),
      recipients: selected_emails,
      senderName,
      senderEmail,
      category: category || 'GENERAL',
      senderPass: currentAdmin?.email_app_password
    });

    if (!result.success) {
      res.status(500).json({ message: result.message, error: result.error });
      return;
    }

    // Persist email log in database
    const emailLog = EmailLogsModel.create({
      subject: subject.trim(),
      message: message.trim(),
      recipients_count: result.recipientsCount,
      recipients: result.validRecipients,
      recipient_types: {
        students: recipient_breakdown?.students || 0,
        admins: recipient_breakdown?.admins || 0,
        custom: recipient_breakdown?.custom || 0
      },
      sent_by_id: sender.id,
      sent_by_name: senderName,
      sent_by_email: senderEmail,
      status: result.status
    });

    // Audit log
    AuditLogsModel.log(
      sender.id,
      'ADMIN',
      'SEND_EMAIL_BROADCAST',
      'COMMUNICATION',
      emailLog.id,
      {
        subject: emailLog.subject,
        recipients_count: emailLog.recipients_count,
        status: emailLog.status
      }
    );

    res.status(201).json({
      message: result.message,
      emailLog
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error occurred while sending email broadcast.' });
  }
});

// POST /api/email-broadcast/record-direct-send (Log an email sent directly via Gmail web client)
router.post('/record-direct-send', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subject, message, selected_emails, category, recipient_breakdown } = req.body;

    const sender = req.user!;
    const validRecipients: string[] = Array.from(new Set<string>(
      (selected_emails || [])
        .map((r: string) => r.trim().toLowerCase())
        .filter((r: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r))
    ));

    const emailLog = EmailLogsModel.create({
      subject: (subject || '').trim(),
      message: (message || '').trim(),
      recipients_count: validRecipients.length,
      recipients: validRecipients,
      recipient_types: {
        students: recipient_breakdown?.students || 0,
        admins: recipient_breakdown?.admins || 0,
        custom: recipient_breakdown?.custom || 0
      },
      sent_by_id: sender.id,
      sent_by_name: sender.name || 'Administrator',
      sent_by_email: sender.email,
      status: 'SENT'
    });

    AuditLogsModel.log(
      sender.id,
      'ADMIN',
      'SEND_EMAIL_BROADCAST',
      'COMMUNICATION',
      emailLog.id,
      {
        subject: emailLog.subject,
        recipients_count: emailLog.recipients_count,
        status: 'SENT_VIA_GMAIL'
      }
    );

    res.status(201).json({
      message: `Broadcast successfully recorded! Dispatched directly via ${sender.email} Gmail client.`,
      emailLog
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to record direct email dispatch.' });
  }
});

// POST /api/email-broadcast/admin-email-credentials (Save 16-character app password for the logged-in admin)
router.post('/admin-email-credentials', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email_app_password } = req.body;
    if (!email_app_password || !email_app_password.trim()) {
      res.status(400).json({ message: 'Email app password is required.' });
      return;
    }

    const cleanPass = email_app_password.trim();
    const adminEmail = req.user!.email;

    // Test connection with Gmail
    const testResult = await emailService.testConnection(adminEmail, cleanPass);
    if (!testResult.success) {
      res.status(400).json({
        message: `Verification failed for ${adminEmail}: ${testResult.message}. Please verify 2FA and the 16-character App Password.`
      });
      return;
    }

    // Save to admin model
    AdminsModel.update(req.user!.id, { email_app_password: cleanPass });

    // Also update general service if super admin
    if (adminEmail.toLowerCase() === 'pranavannur9659@gmail.com') {
      await emailService.updateConfig({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        user: adminEmail,
        pass: cleanPass,
        from: `"${req.user!.name}" <${adminEmail}>`
      });
    }

    AuditLogsModel.log(
      req.user!.id,
      'ADMIN',
      'UPDATE_EMAIL_CREDENTIALS',
      'SYSTEM',
      req.user!.id,
      { email: adminEmail }
    );

    res.json({
      message: `Credentials verified and saved! In-portal broadcasts will now be sent directly from ${adminEmail}.`,
      admin_email: adminEmail,
      has_credentials: true
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to save email credentials.' });
  }
});

// POST /api/email-broadcast/test-connection (Test current SMTP credentials connection)
router.post('/test-connection', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentAdmin = AdminsModel.findById(req.user!.id);
    const passToTest = currentAdmin?.email_app_password || process.env.SMTP_PASS;
    const result = await emailService.testConnection(req.user?.email, passToTest);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/email-broadcast/send-test-email (Send an actual test email to recipient inbox)
router.post('/send-test-email', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetEmail = (req.body.test_email || req.user?.email || '').trim().toLowerCase();
    if (!targetEmail) {
      res.status(400).json({ message: 'Target test email is required.' });
      return;
    }

    const result = await emailService.sendTestEmail(targetEmail, req.user?.name || 'Administrator');
    if (result.success) {
      res.json({
        message: `Test email sent to ${targetEmail}! Please check your inbox or spam folder.`,
        status: result.status
      });
    } else {
      res.status(500).json({
        message: `Failed to deliver test email: ${result.error || result.message}`,
        error: result.error
      });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error occurred during test email dispatch.' });
  }
});

// POST /api/email-broadcast/smtp-config (Configure / Save SMTP credentials directly from UI)
router.post('/smtp-config', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only super admin or admin can configure SMTP
    const { host, port, secure, user, pass, from } = req.body;

    if (!host || !user || !pass) {
      res.status(400).json({ message: 'SMTP Host, User (Email), and Password / App Password are required.' });
      return;
    }

    const result = await emailService.updateConfig({
      host: host.trim(),
      port: Number(port) || 587,
      secure: Boolean(secure),
      user: user.trim(),
      pass: pass.trim(),
      from: from ? from.trim() : undefined
    });

    if (result.success) {
      AuditLogsModel.log(
        req.user!.id,
        'ADMIN',
        'UPDATE_SMTP_CONFIG',
        'SYSTEM',
        'SMTP',
        { host: host.trim(), user: user.trim() }
      );
      res.json({
        message: result.message,
        smtp_status: emailService.getStatus()
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update SMTP configuration.' });
  }
});

export default router;

