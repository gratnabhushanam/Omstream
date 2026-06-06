const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables from backend/.env
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { User } = require('../models');
const otpController = require('../controllers/otpController');

async function runTests() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected!');

  try {
    // ----------------------------------------------------
    // TEST 1: Email OTP Send & Verify
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Email OTP ---');
    const emailTest = 'test_otp_user_' + Date.now() + '@example.com';
    
    // Send OTP
    const sendReqMock = {
      body: { email: emailTest },
      headers: {}
    };
    let sendResData = null;
    const sendResMock = {
      status: (code) => ({
        json: (data) => {
          console.log(`[Send Email OTP Status ${code}]:`, data);
          sendResData = data;
        }
      }),
      json: (data) => {
        console.log('[Send Email OTP Success]:', data);
        sendResData = data;
      }
    };

    await otpController.sendOtp(sendReqMock, sendResMock);
    
    if (!sendResData || !sendResData.previewCode) {
      throw new Error('Email OTP Send failed or previewCode not returned');
    }

    const emailOtp = sendResData.previewCode;
    console.log(`Received OTP: ${emailOtp}`);

    // Verify OTP
    const verifyReqMock = {
      body: { email: emailTest, otp: emailOtp },
      headers: {
        'x-device-id': 'test_email_dev',
        'x-device-name': 'Test Device'
      }
    };
    let verifyResData = null;
    const verifyResMock = {
      status: (code) => ({
        json: (data) => {
          console.log(`[Verify Email OTP Status ${code}]:`, data);
          verifyResData = data;
        }
      }),
      json: (data) => {
        console.log('[Verify Email OTP Success]:', data);
        verifyResData = data;
      }
    };

    await otpController.verifyOtp(verifyReqMock, verifyResMock);

    if (!verifyResData || !verifyResData.token) {
      throw new Error('Email OTP Verification failed');
    }
    console.log('TEST 1 SUCCESSFUL!');

    // Clean up Test 1 User
    await User.deleteOne({ email: emailTest });
    console.log('Test 1 user cleaned up.');

    // ----------------------------------------------------
    // TEST 2: Phone OTP Send & Verify
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Phone OTP ---');
    const phoneTest = '+9199999' + Math.floor(10000 + Math.random() * 90000).toString();

    // Send OTP
    const sendPhoneReqMock = {
      body: { phone: phoneTest },
      headers: {}
    };
    let sendPhoneResData = null;
    const sendPhoneResMock = {
      status: (code) => ({
        json: (data) => {
          console.log(`[Send Phone OTP Status ${code}]:`, data);
          sendPhoneResData = data;
        }
      }),
      json: (data) => {
        console.log('[Send Phone OTP Success]:', data);
        sendPhoneResData = data;
      }
    };

    await otpController.sendOtp(sendPhoneReqMock, sendPhoneResMock);
    
    if (!sendPhoneResData || !sendPhoneResData.previewCode) {
      throw new Error('Phone OTP Send failed or previewCode not returned');
    }

    const phoneOtp = sendPhoneResData.previewCode;
    console.log(`Received OTP: ${phoneOtp}`);

    // Verify OTP
    const verifyPhoneReqMock = {
      body: { phone: phoneTest, otp: phoneOtp },
      headers: {
        'x-device-id': 'test_phone_dev',
        'x-device-name': 'Test Device'
      }
    };
    let verifyPhoneResData = null;
    const verifyPhoneResMock = {
      status: (code) => ({
        json: (data) => {
          console.log(`[Verify Phone OTP Status ${code}]:`, data);
          verifyPhoneResData = data;
        }
      }),
      json: (data) => {
        console.log('[Verify Phone OTP Success]:', data);
        verifyPhoneResData = data;
      }
    };

    await otpController.verifyOtp(verifyPhoneReqMock, verifyPhoneResMock);

    if (!verifyPhoneResData || !verifyPhoneResData.token) {
      throw new Error('Phone OTP Verification failed');
    }
    console.log('TEST 2 SUCCESSFUL!');

    // Clean up Test 2 User
    await User.deleteOne({ phone: phoneTest });
    console.log('Test 2 user cleaned up.');

  } catch (error) {
    console.error('Test run failed with error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected database.');
  }
}

runTests();
