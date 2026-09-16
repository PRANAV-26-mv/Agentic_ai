import { Router, Response } from 'express';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';
import { StudentsModel, AdminsModel, EmailLogsModel, AuditLogsModel } from '../models/dbModels.js';
import { emailService } from '../services/emailService.js';

const router = Router();

// GET /api/email-broadcast/recipients (List eligible student and admin recipients)
router.get('/recipients', requireAdmin, (_req: AuthRequest, res: Response) => {
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

    res.json({
      students: studentList,
      admins: adminList,
      smtp_status: emailService.getStatus()
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

    // Send broadcast through emailService
    const result = await emailService.sendBroadcast({
      subject: subject.trim(),
      message: message.trim(),
      recipients: selected_emails,
      senderName,
      senderEmail,
      category: category || 'GENERAL'
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

export default router;
