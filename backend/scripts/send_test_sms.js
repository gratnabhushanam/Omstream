const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { sendSmsOtp } = require('../utils/smsHelpers');

const phoneArg = process.argv[2];

if (!phoneArg) {
  console.error('\n❌ Error: Please provide a phone number as an argument.');
  console.log('Usage: node backend/scripts/send_test_sms.js +91XXXXXXXXXX\n');
  process.exit(1);
}

async function testSms() {
  console.log(`\n🚀 Initializing SMS transmission to: ${phoneArg}...`);
  console.log('\n📋 SMS Provider Status:');
  console.log(`- Fast2SMS API Key: ${process.env.FAST2SMS_API_KEY ? '✅ Configured' : '❌ NOT Configured'}`);
  console.log(`- Twilio Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ NOT Configured'}`);
  console.log(`- Twilio Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Configured' : '❌ NOT Configured'}`);
  console.log(`- Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER || '❌ NOT Configured'}`);

  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`\n🔢 Generated OTP: ${testOtp}`);
  console.log('📤 Sending...\n');

  const result = await sendSmsOtp(phoneArg, testOtp);

  if (result.delivered) {
    console.log('✅ SUCCESS!');
    console.log(`  Provider: ${result.provider}`);
    console.log(`  Message ID: ${result.messageId}\n`);
  } else {
    console.error('❌ FAILED!');
    console.error(`  Error: ${result.error}\n`);
    console.log('🔧 To fix this, add ONE of these to your .env or Render Environment Variables:');
    console.log('\n  Option 1 - Fast2SMS (FREE for Indian numbers):');
    console.log('    FAST2SMS_API_KEY=your_key_here');
    console.log('    → Sign up at https://www.fast2sms.com → Dashboard → Dev API\n');
    console.log('  Option 2 - Twilio (International):');
    console.log('    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    console.log('    TWILIO_AUTH_TOKEN=your_auth_token_here');
    console.log('    TWILIO_PHONE_NUMBER=+1xxxxxxxxxx\n');
  }
}

testSms();
