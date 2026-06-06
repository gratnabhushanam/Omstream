const https = require('https');
const querystring = require('querystring');

/**
 * Send OTP via Fast2SMS (free Indian SMS provider)
 * Requires FAST2SMS_API_KEY in environment variables
 * Sign up free at: https://www.fast2sms.com
 */
const sendViaFast2SMS = async (phone, otp) => {
  return new Promise((resolve) => {
    // Strip country code if present — Fast2SMS uses 10-digit Indian numbers
    let mobileNumber = phone.trim();
    if (mobileNumber.startsWith('+91')) {
      mobileNumber = mobileNumber.slice(3);
    } else if (mobileNumber.startsWith('91') && mobileNumber.length === 12) {
      mobileNumber = mobileNumber.slice(2);
    }
    // Remove any non-digit chars
    mobileNumber = mobileNumber.replace(/\D/g, '');

    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      return resolve({ delivered: false, error: 'FAST2SMS_API_KEY not configured' });
    }

    const postData = querystring.stringify({
      route: 'q',
      message: `Your Gita Wisdom OTP is ${otp}. Valid for 10 minutes. Do not share.`,
      language: 'english',
      numbers: mobileNumber,
    });

    const options = {
      hostname: 'www.fast2sms.com',
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.return === true) {
            console.log(`[SMS] Fast2SMS sent OTP to ${mobileNumber}. Request ID: ${parsed.request_id}`);
            resolve({ delivered: true, provider: 'fast2sms', messageId: parsed.request_id });
          } else {
            console.error('[SMS] Fast2SMS error response:', parsed);
            resolve({ delivered: false, error: parsed.message || JSON.stringify(parsed) });
          }
        } catch (e) {
          resolve({ delivered: false, error: `JSON parse error: ${data}` });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[SMS] Fast2SMS request error:', err.message);
      resolve({ delivered: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });
};

/**
 * Send OTP via Twilio (international SMS)
 * Supports both:
 *   - Classic: TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN
 *   - API Key:  TWILIO_ACCOUNT_SID + TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET
 */
const sendViaTwilio = async (phone, otp) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !twilioPhone) {
    return { delivered: false, error: 'TWILIO_ACCOUNT_SID and TWILIO_PHONE_NUMBER are required' };
  }
  if (!apiKeySid && !authToken) {
    return { delivered: false, error: 'Twilio auth credentials not configured (need TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID+TWILIO_API_KEY_SECRET)' };
  }

  try {
    const twilio = require('twilio');
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) formattedPhone = '+' + formattedPhone;

    // Use API Key auth if available, otherwise fall back to Auth Token
    let client;
    if (apiKeySid && apiKeySecret) {
      console.log('[SMS] Using Twilio API Key authentication');
      client = twilio(apiKeySid, apiKeySecret, { accountSid });
    } else {
      console.log('[SMS] Using Twilio Auth Token authentication');
      client = twilio(accountSid, authToken);
    }

    const message = await client.messages.create({
      body: `Your Gita Wisdom verification code is: ${otp}. It expires in 10 minutes. Do not share it.`,
      from: twilioPhone.trim(),
      to: formattedPhone,
    });

    console.log(`[SMS] Twilio message sent: ${message.sid} to ${formattedPhone}`);
    return { delivered: true, provider: 'twilio', messageId: message.sid };
  } catch (err) {
    console.error('[SMS] Twilio error:', err.message);
    return { delivered: false, error: err.message || String(err) };
  }
};

/**
 * Main sendSmsOtp: tries Fast2SMS first (Indian numbers), falls back to Twilio
 * @param {string} phone - E.164 or 10-digit Indian number
 * @param {string} otp - 6-digit OTP
 */
const sendSmsOtp = async (phone, otp) => {
  let fast2smsError = null;

  // Try Fast2SMS first (best for Indian numbers)
  if (process.env.FAST2SMS_API_KEY) {
    console.log(`[SMS] Attempting Fast2SMS to ${phone}`);
    const result = await sendViaFast2SMS(phone, otp);
    if (result.delivered) return result;
    fast2smsError = result.error;
    console.warn(`[SMS] Fast2SMS failed: ${result.error}. Trying Twilio...`);
  }

  // Fallback to Twilio
  if (process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[SMS] Attempting Twilio to ${phone}`);
    return await sendViaTwilio(phone, otp);
  }

  // If Fast2SMS was tried and failed, return its error
  if (fast2smsError) {
    return { delivered: false, error: `Fast2SMS Error: ${fast2smsError}` };
  }

  // No SMS provider configured
  console.warn(`[SMS] No SMS provider configured. OTP for ${phone}: ${otp}`);
  return { delivered: false, error: 'No SMS provider configured. Add FAST2SMS_API_KEY or Twilio credentials to your .env' };
};

module.exports = { sendSmsOtp, sendViaFast2SMS, sendViaTwilio };
