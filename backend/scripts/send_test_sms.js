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
  console.log('Using credentials:');
  console.log(`- Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ NOT Configured'}`);
  console.log(`- Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Configured' : '❌ NOT Configured'}`);
  console.log(`- Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER || '❌ NOT Configured'}`);
  
  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`- Generated OTP: ${testOtp}`);
  
  const result = await sendSmsOtp(phoneArg, testOtp);
  
  if (result.delivered) {
    console.log('\n✅ SUCCESS!');
    console.log(`Message delivered using provider: ${result.provider}`);
    console.log(`Message ID: ${result.messageId}\n`);
  } else {
    console.error('\n❌ FAILED!');
    console.error(`Error details: ${result.error}\n`);
    console.log('Please ensure your Twilio environment variables are correctly set in .env or your deployment dashboard.\n');
  }
}

testSms();
