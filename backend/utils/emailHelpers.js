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

  const config = {};
  if (host.includes('gmail.com')) {
    config.service = 'gmail';
  } else {
    config.host = host;
    config.port = port;
    config.secure = port === 465;
    config.pool = true;
    config.maxConnections = 5;
    config.maxMessages = 100;
  }
  
  config.auth = { user, pass };
  cachedTransporter = nodemailer.createTransport(config);

  return cachedTransporter;
};

const sendViaSmtp = async ({ email, name, otp }) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      const isDev = process.env.NODE_ENV !== 'production' || process.env.ALLOW_OTP_PREVIEW === 'true';
      if (isDev) {
        console.warn('[EMAIL] SMTP credentials missing, falling back to development preview OTP');
        return { delivered: true, provider: 'preview', previewCode: otp };
      }
      return { delivered: false, error: 'SMTP credentials not configured. Please add EMAIL_USER and EMAIL_PASS to your env.' };
    }

    const user = process.env.EMAIL_USER;
    const fromName = process.env.EMAIL_FROM_NAME || 'Omstream';
    const fromAddress = process.env.EMAIL_FROM || user;

    const subject = 'Your Omstream OTP';
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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return sendViaSmtp({ email, name, otp });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${process.env.RESEND_FROM_NAME || 'Omstream'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
        to: [email],
        subject: 'Your Omstream OTP',
        html: `<p>Hello ${name || ''},</p><p>Your verification code is: <strong>${otp}</strong></p><p>This code expires shortly.</p>`
      })
    });
    
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return { delivered: true, provider: 'resend', messageId: data.id };
  } catch (err) {
    console.error('[EMAIL] Resend error, falling back to SMTP:', err);
    return sendViaSmtp({ email, name, otp });
  }
};

const sendViaBrevo = async ({ email, name, otp }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return sendViaSmtp({ email, name, otp });

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { 
          name: process.env.BREVO_FROM_NAME || 'Omstream', 
          email: process.env.BREVO_FROM_EMAIL || 'gitawisdom143@gmail.com' 
        },
        to: [{ email: email, name: name || 'User' }],
        subject: 'Your Omstream OTP',
        htmlContent: `<p>Hello ${name || ''},</p><p>Your verification code is: <strong>${otp}</strong></p><p>This code expires shortly.</p>`
      })
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return { delivered: true, provider: 'brevo', messageId: data.messageId };
  } catch (err) {
    console.error('[EMAIL] Brevo error, falling back to SMTP:', err);
    return sendViaSmtp({ email, name, otp });
  }
};

module.exports = { resolveEmailProvider, getTransporter, sendViaSmtp, sendViaResend, sendViaBrevo };
