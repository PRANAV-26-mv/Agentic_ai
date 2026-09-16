import nodemailer, { Transporter } from 'nodemailer';

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
      smtp_user: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***` : 'None',
      from_address: process.env.EMAIL_FROM || 'portal-notifications@college.edu'
    };
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
