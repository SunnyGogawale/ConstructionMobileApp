import nodemailer from 'nodemailer';

export function isPasswordResetEmailConfigured() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM || !process.env.WEB_APP_URL) return false;
  try {
    const appUrl = new URL(process.env.WEB_APP_URL);
    return ['http:', 'https:'].includes(appUrl.protocol);
  } catch {
    return false;
  }
}

export async function sendPasswordResetEmail({ email, name, resetUrl }) {
  if (!isPasswordResetEmailConfigured()) {
    throw new Error('Password reset email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM, and WEB_APP_URL.');
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Reset your BuildFlow password',
    text: `Hello ${name},\n\nA password reset was requested for your BuildFlow account. Use this one-time link within 30 minutes to set a new password:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
  });
}
