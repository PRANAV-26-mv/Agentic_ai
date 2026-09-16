import nodemailer, { Transporter } from 'nodemailer';
import fs from 'fs';
import path from 'path';

export interface SendBroadcastOptions {
  subject: string;
  message: string;
  recipients: string[];
  senderName: string;
  senderEmail: string;
  category?: 'GENERAL' | 'ANNOUNCEMENT' | 'ASSESSMENT' | 'URGENT';
}

export interface SendBroadcastResult {
  success: boolean;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  recipientsCount: number;
  validRecipients: string[];
  message: string;
  error?: string;
}

export interface SmtpConfigInput {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
  from?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      try {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE === 'true' || port === 465;

        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass }
        });
        this.isConfigured = true;
        console.log(`📧 SMTP Email Transport initialized: ${host}:${port} (${user})`);
      } catch (err: any) {
        console.error('⚠️ Failed to initialize SMTP transporter:', err.message);
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
      console.log('ℹ️ SMTP credentials not configured in .env. Email broadcasts will run in persistent simulation mode.');
    }
  }

  public getStatus() {
    return {
      is_configured: this.isConfigured,
      smtp_host: process.env.SMTP_HOST || 'Not Configured (Simulation Mode)',
      smtp_user: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 4)}***@${process.env.SMTP_USER.split('@')[1] || ''}` : 'None',
      from_address: process.env.EMAIL_FROM || 'portal-notifications@college.edu'
    };
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.transporter || !this.isConfigured) {
      return { 
        success: false, 
        message: 'SMTP is not configured yet. Please configure your SMTP Host, User email, and App Password.' 
      };
    }
    try {
      await this.transporter.verify();
      return { 
        success: true, 
        message: `SMTP connection to ${process.env.SMTP_HOST} verified successfully! Ready to deliver live emails.` 
      };
    } catch (err: any) {
      return { 
        success: false, 
        message: `SMTP Connection test failed: ${err.message}` 
      };
    }
  }

  public async sendTestEmail(toEmail: string, senderName: string = 'Portal Administrator'): Promise<SendBroadcastResult> {
    return this.sendBroadcast({
      subject: '✅ Portal Test Email: Real Delivery Verified',
      message: `Hello!\n\nThis is a live test email from the Student Assessment & Learning Portal.\n\nIf you see this in your inbox, your SMTP configuration is active and working properly! You can now send real emails to all students and faculty.`,
      recipients: [toEmail],
      senderName,
      senderEmail: process.env.EMAIL_FROM || process.env.SMTP_USER || toEmail,
      category: 'ANNOUNCEMENT'
    });
  }

  public async updateConfig(config: SmtpConfigInput): Promise<{ success: boolean; message: string }> {
    try {
      const port = Number(config.port) || 587;
      const secure = config.secure ?? (port === 465);

      const newTransporter = nodemailer.createTransport({
        host: config.host.trim(),
        port,
        secure,
        auth: {
          user: config.user.trim(),
          pass: config.pass.trim()
        }
      });

      // Verify connection with mail server before saving
      await newTransporter.verify();

      this.transporter = newTransporter;
      this.isConfigured = true;

      // Update process.env
      process.env.SMTP_HOST = config.host.trim();
      process.env.SMTP_PORT = String(port);
      process.env.SMTP_SECURE = String(secure);
      process.env.SMTP_USER = config.user.trim();
      process.env.SMTP_PASS = config.pass.trim();
      if (config.from) {
        process.env.EMAIL_FROM = config.from.trim();
      }

      // Persist to .env file
      this.persistToEnv({
        ...config,
        port,
        secure
      });

      return {
        success: true,
        message: `Connected successfully to ${config.host}! Live SMTP email delivery is now active.`
      };
    } catch (err: any) {
      return {
        success: false,
        message: `SMTP verification failed: ${err.message}. Please check your email and app password.`
      };
    }
  }

  private persistToEnv(config: SmtpConfigInput) {
    try {
      const candidates = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'backend/.env'),
        path.resolve(__dirname, '../../.env'),
        path.resolve(__dirname, '../../../.env')
      ];

      for (const envPath of candidates) {
        if (fs.existsSync(envPath)) {
          let content = fs.readFileSync(envPath, 'utf-8');

          const setOrAppend = (key: string, val: string) => {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            if (regex.test(content)) {
              content = content.replace(regex, `${key}=${val}`);
            } else {
              content += `\n${key}=${val}`;
            }
          };

          setOrAppend('SMTP_HOST', config.host);
          setOrAppend('SMTP_PORT', String(config.port));
          setOrAppend('SMTP_SECURE', String(config.secure));
          setOrAppend('SMTP_USER', config.user);
          setOrAppend('SMTP_PASS', config.pass);
          if (config.from) setOrAppend('EMAIL_FROM', config.from);

          fs.writeFileSync(envPath, content.trim() + '\n', 'utf-8');
          console.log(`Updated SMTP credentials in ${envPath}`);
        }
      }
    } catch (err: any) {
      console.error('Failed to persist SMTP config to .env:', err.message);
    }
  }

  private buildHtmlEmail(subject: string, message: string, senderName: string, category: string = 'GENERAL'): string {
    const formattedBody = message
      .replace(/\r\n/g, '\n')
      .split('\n\n')
      .map(p => `<p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    const categoryBadgeColors: Record<string, { bg: string; text: string; label: string }> = {
      ANNOUNCEMENT: { bg: '#ede9fe', text: '#6d28d9', label: '📢 Campus Announcement' },
      ASSESSMENT: { bg: '#e0f2fe', text: '#0369a1', label: '📝 Assessment Notice' },
      URGENT: { bg: '#ffe4e6', text: '#be123c', label: '🚨 Urgent Alert' },
      GENERAL: { bg: '#f1f5f9', text: '#475569', label: '📌 Official Notice' }
    };

    const badge = categoryBadgeColors[category] || categoryBadgeColors.GENERAL;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);" cellspacing="0" cellpadding="0" border="0">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #3b0764 100%); padding: 28px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="display: inline-block; padding: 4px 12px; background-color: ${badge.bg}; color: ${badge.text}; font-size: 11px; font-weight: 700; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                      ${badge.label}
                    </span>
                    <h1 style="margin: 6px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
                      Student Assessment & Learning Portal
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 32px; background-color: #ffffff;">
              <h2 style="margin: 0 0 18px 0; color: #0f172a; font-size: 17px; font-weight: 700;">
                ${subject}
              </h2>

              <div style="color: #334155; font-size: 14px;">
                ${formattedBody}
              </div>

              <!-- Sender Signature Box -->
              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9; display: flex; align-items: center;">
                <div>
                  <p style="margin: 0; font-size: 13px; font-weight: 700; color: #1e293b;">
                    Sent by: ${senderName}
                  </p>
                  <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
                    Faculty & Portal Administration
                  </p>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                You received this official email because you are a registered student or faculty member on the Student Assessment & Learning Portal.<br/>
                Please do not reply directly to this automated dispatch.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  public async sendBroadcast(options: SendBroadcastOptions): Promise<SendBroadcastResult> {
    const { subject, message, recipients, senderName, senderEmail, category } = options;

    // Filter & sanitize valid emails
    const validRecipients = Array.from(new Set(
      recipients
        .map(r => r.trim().toLowerCase())
        .filter(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r))
    ));

    if (validRecipients.length === 0) {
      return {
        success: false,
        status: 'FAILED',
        recipientsCount: 0,
        validRecipients: [],
        message: 'No valid recipient email addresses provided.'
      };
    }

    const htmlContent = this.buildHtmlEmail(subject, message, senderName, category);
    const fromAddress = process.env.EMAIL_FROM || `"${senderName} via College Portal" <portal@college.edu>`;

    // If SMTP is properly configured, send through Nodemailer
    if (this.isConfigured && this.transporter) {
      try {
        console.log(`📤 Sending live SMTP broadcast to ${validRecipients.length} recipients...`);

        // Send in batches of 50 BCC recipients to respect provider limits
        const batchSize = 50;
        for (let i = 0; i < validRecipients.length; i += batchSize) {
          const batch = validRecipients.slice(i, i + batchSize);
          await this.transporter.sendMail({
            from: fromAddress,
            to: senderEmail, // Primary recipient is sender, actual recipients in BCC
            bcc: batch,
            subject,
            text: message,
            html: htmlContent
          });
        }

        console.log(`✅ SMTP email successfully delivered to ${validRecipients.length} recipients.`);
        return {
          success: true,
          status: 'SENT',
          recipientsCount: validRecipients.length,
          validRecipients,
          message: `Broadcast successfully sent to ${validRecipients.length} recipients via SMTP.`
        };
      } catch (err: any) {
        console.error('SMTP Delivery error:', err.message);
        return {
          success: false,
          status: 'FAILED',
          recipientsCount: validRecipients.length,
          validRecipients,
          message: `Failed to deliver email via SMTP: ${err.message}`,
          error: err.message
        };
      }
    }

    // Fallback Simulated Mode (for dev/local or when SMTP is not configured)
    console.log(`📨 [SIMULATED EMAIL DISPATCH] To ${validRecipients.length} recipients:`);
    console.log(`   Subject: "${subject}"`);
    console.log(`   From: "${senderName}" <${senderEmail}>`);
    console.log(`   Sample Recipients: ${validRecipients.slice(0, 5).join(', ')}${validRecipients.length > 5 ? ` and ${validRecipients.length - 5} more...` : ''}`);

    return {
      success: true,
      status: 'SIMULATED',
      recipientsCount: validRecipients.length,
      validRecipients,
      message: `Email broadcast recorded and dispatched to ${validRecipients.length} recipients.`
    };
  }
}

export const emailService = new EmailService();
