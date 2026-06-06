const nodemailer = require('nodemailer');

const resolveEmailProvider = () => {
  return String(process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();
};

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST || process.env.SMTP_HOSTNAME || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || process.env.SMTP_PORT_NUMBER || 465);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) return null;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    pool: true, // Reuse connections
    maxConnections: 5,
    maxMessages: 100,
    auth: { user, pass },
  });

  return cachedTransporter;
};

const sendViaSmtp = async ({ email, name, otp }) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      return { delivered: false, error: 'SMTP credentials not configured' };
    }

    const user = process.env.EMAIL_USER;
    const fromName = process.env.EMAIL_FROM_NAME || 'Gita Wisdom';
    const fromAddress = process.env.EMAIL_FROM || user;

    const subject = 'Your Gita Wisdom OTP';
    const text = `Hello ${name || ''},\n\nYour verification code is: ${otp}\n\nThis code expires shortly.`;
    const html = `<p>Hello ${name || ''},</p><p>Your verification code is: <strong>${otp}</strong></p><p>This code expires shortly.</p>`;

    const info = await transporter.sendMail({
      from: `${fromName} <${fromAddress}>`,
      to: email,
      subject,
      text,
      html,
    });

    return { delivered: true, provider: 'smtp', messageId: info.messageId };
  } catch (err) {
    return { delivered: false, error: String(err && err.message ? err.message : err) };
  }
};

// Lightweight stubs for other providers. They return an explanatory error when not configured.
const sendViaResend = async ({ email, name, otp }) => {
  if (!process.env.RESEND_API_KEY) return { delivered: false, error: 'Resend API key missing' };
  return { delivered: false, error: 'Resend provider not implemented in this runtime' };
};

const sendViaBrevo = async ({ email, name, otp }) => {
  if (!process.env.BREVO_API_KEY) return { delivered: false, error: 'Brevo API key missing' };
  return { delivered: false, error: 'Brevo provider not implemented in this runtime' };
};

module.exports = { resolveEmailProvider, getTransporter, sendViaSmtp, sendViaResend, sendViaBrevo };
