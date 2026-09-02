import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('⚠️  EMAIL_USER/EMAIL_PASS not set, emails will be logged to console instead of sent.');
    return null;
  }

  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT) || 587;
  const secure = process.env.EMAIL_SECURE === 'true'; // true for 465

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  // Verify in background (don't block startup)
  transporter.verify().then(() => {
    console.log('✅ Email transporter ready');
  }).catch((err) => {
    console.error('❌ Email transporter verification failed:', err.message);
  });

  return transporter;
};

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export const sendEmail = async (opts: SendMailOptions): Promise<boolean> => {
  const t = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@growventory.local';
  const fromName = process.env.EMAIL_FROM_NAME || 'Growventory';

  if (!t) {
    console.log('--- 📧 DEV EMAIL FALLBACK ---');
    console.log(`To: ${opts.to}`);
    console.log(`Subject: ${opts.subject}`);
    console.log(`Text: ${opts.text || ''}`);
    console.log(`HTML: ${opts.html.substring(0, 400)}...`);
    console.log('---------------------------');
    return true;
  }

  try {
    const info = await t.sendMail({
      from: `"${fromName}" <${from}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    console.log(`✅ [EMAIL SENT] MessageId: ${info.messageId} to ${opts.to}`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to send email:', err.message);
    // Don't throw, allow OTP to still be logged in dev if desired
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV FALLBACK OTP EMAIL] To: ${opts.to} Subject: ${opts.subject}`);
    }
    throw err;
  }
};

const baseTemplate = (title: string, highlight: string, message: string, otp: string, footer: string) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1d4d2e 0%,#2a6b40 100%);padding:32px;text-align:center;">
      <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="font-size:24px;">🌿</span>
      </div>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Growventory</h1>
      <p style="margin:4px 0 0;color:#c8e6c9;font-size:13px;">Nursery Management System</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#1a1f29;font-size:18px;font-weight:700;">${title}</h2>
      <p style="margin:0 0 20px;color:#5a6470;font-size:14px;line-height:1.6;">${message}</p>
      <div style="background:#f0faf4;border:1px solid #d1e9d8;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px;">
        <p style="margin:0 0 8px;color:#6b7c6e;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${highlight}</p>
        <p style="margin:0;color:#1d4d2e;font-size:32px;font-weight:800;letter-spacing:8px;">${otp}</p>
        <p style="margin:8px 0 0;color:#8a9a8d;font-size:12px;">Valid for 10 minutes • 4-digit code</p>
      </div>
      <p style="margin:0 0 16px;color:#8a9a8d;font-size:12px;line-height:1.6;">
        If you didn't request this code, you can safely ignore this email. For security, never share this code with anyone.
      </p>
      <div style="height:1px;background:#eef2ef;margin:20px 0;"></div>
      <p style="margin:0;color:#a8b5ac;font-size:11px;text-align:center;">${footer}<br/>© ${new Date().getFullYear()} Growventory. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const sendVerificationOTP = async (to: string, otp: string, username?: string) => {
  const greeting = username ? `Hi ${username},` : 'Hi,';
  return sendEmail({
    to,
    subject: 'Verify your Growventory email, Your 4-digit code',
    text: `${greeting} Your email verification code is ${otp}. It expires in 10 minutes. If you didn't create an account, ignore this email.`,
    html: baseTemplate(
      'Verify your email',
      'Verification Code',
      `${greeting} Thanks for joining Growventory! Please verify your email address with the code below to activate your account.`,
      otp,
      'This code was sent to verify your Growventory account.'
    ),
  });
};

export const sendPasswordResetOTP = async (to: string, otp: string, username?: string) => {
  const greeting = username ? `Hi ${username},` : 'Hi,';
  return sendEmail({
    to,
    subject: 'Reset your Growventory password, Your 4-digit code',
    text: `${greeting} Your password reset code is ${otp}. It expires in 10 minutes. If you didn't request a reset, ignore this email.`,
    html: baseTemplate(
      'Reset your password',
      'Reset Code',
      `${greeting} We received a request to reset your Growventory password. Use the code below to proceed. If you didn't request this, no action is needed.`,
      otp,
      'This code was sent to reset your Growventory password.'
    ),
  });
};
