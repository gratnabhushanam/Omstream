const twilio = require('twilio');

/**
 * Sends an OTP via Twilio SMS
 * @param {string} phone - The destination phone number in E.164 format (e.g. +919876543210)
 * @param {string} otp - The 6-digit OTP code
 * @returns {Promise<{delivered: boolean, provider?: string, messageId?: string, error?: string}>}
 */
const sendSmsOtp = async (phone, otp) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    console.warn(`[SMS] Twilio credentials not configured. SMS not sent. OTP: ${otp} to ${phone}`);
    return { delivered: false, error: 'Twilio credentials not configured' };
  }

  try {
    // Clean up phone number format if needed (must be E.164, e.g. starting with +)
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      body: `Your Gita Wisdom verification code is: ${otp}. It expires in 5 minutes.`,
      from: twilioPhone.trim(),
      to: formattedPhone,
    });

    console.log(`[SMS] Twilio message sent: ${message.sid} to ${formattedPhone}`);
    return { delivered: true, provider: 'twilio', messageId: message.sid };
  } catch (err) {
    console.error('[SMS] Twilio error sending message:', err);
    return { delivered: false, error: err.message || String(err) };
  }
};

module.exports = { sendSmsOtp };
