const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { User } = require('../models');
const { resolveEmailProvider, sendViaResend, sendViaBrevo, sendViaSmtp } = require('../utils/emailHelpers');
const { sendSmsOtp } = require('../utils/smsHelpers');

const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

const sendEmailOtp = async (email, otp) => {
    try {
        const provider = resolveEmailProvider();
        if (provider === 'preview') return { delivered: true };
        if (provider === 'resend') return await sendViaResend({ email, name: '', otp });
        if (provider === 'brevo') return await sendViaBrevo({ email, name: '', otp });
        return await sendViaSmtp({ email, name: '', otp });
    } catch (e) {
        console.error('Error sending email OTP:', e);
        return { delivered: false, error: e.message || String(e) };
    }
};

exports.sendOtp = async (req, res) => {
    try {
        const { email, phone } = req.body;
        if (!email && !phone) {
            return res.status(400).json({ message: 'Email or Phone Number is required' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        let user;
        let targetField = '';
        let targetValue = '';

        if (email) {
            targetField = 'email';
            targetValue = email.toLowerCase().trim();
            user = await User.findOne({ email: targetValue });
            if (!user) {
                user = new User({ email: targetValue, name: targetValue.split('@')[0] });
            }
        } else {
            targetField = 'phone';
            targetValue = phone.trim();
            user = await User.findOne({ phone: targetValue });
            if (!user) {
                user = new User({ phone: targetValue, name: 'Member ' + targetValue.slice(-4) });
            }
        }

        user.otpHash = hashedOtp;
        user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);
        await user.save();

        let deliveryResult = { delivered: false };
        if (targetField === 'email') {
            deliveryResult = await sendEmailOtp(targetValue, otp);
        } else {
            deliveryResult = await sendSmsOtp(targetValue, otp);
        }

        const isPreview = 
            process.env.EMAIL_PROVIDER === 'preview' || 
            process.env.ALLOW_OTP_PREVIEW === 'true';

        if (!deliveryResult.delivered && !isPreview) {
            return res.status(400).json({ message: deliveryResult.error || 'Failed to send OTP. Please check your number or try again later.' });
        }

        res.json({ 
            message: 'OTP sent successfully', 
            previewCode: isPreview ? otp : undefined
        });
    } catch (error) { 
        console.error('[OTP] sendOtp error:', error);
        res.status(500).json({ message: error.message }); 
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, phone, otp } = req.body;
        if (!otp) return res.status(400).json({ message: 'OTP is required' });

        let query = {};
        if (email) {
            query = { email: email.toLowerCase().trim() };
        } else if (phone) {
            query = { phone: phone.trim() };
        } else {
            return res.status(400).json({ message: 'Email or Phone Number is required' });
        }

        const user = await User.findOne(query);
        if (!user) {
            // Check if there is a pending registration
            return require('./authController').verifyRegistrationOtp(req, res);
        }

        if (!user.otpHash || new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        if (!(await bcrypt.compare(otp, user.otpHash))) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Fail-safe: Ensure admin role for bootstrap email
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
        if (ADMIN_EMAIL && user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()) {
            user.role = 'admin';
        }

        // Check device limit
        const { checkAndRegisterDevice } = require('../middleware/authMiddleware');
        const checkResult = await checkAndRegisterDevice(user, req.headers, req.ip || req.connection.remoteAddress);
        if (!checkResult.allowed) {
            return res.status(403).json({ 
                status: 'device_limit_reached',
                deviceRequestId: checkResult.deviceRequestId,
                message: `Maximum device limit reached. Your plan allows up to ${checkResult.limit} device(s).` 
            });
        }

        // Detect new user (auto-created with default name)
        const isNewUser = !user.name || user.name.startsWith('Member ') || user.name === '';

        // Create subscription if it doesn't exist yet
        const Subscription = require('../models/Subscription');
        let subscription = await Subscription.findOne({ userId: user._id });
        if (!subscription) {
            const { PLANS } = require('./subscriptionController');
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + PLANS.free.trialDays);
            subscription = await Subscription.create({
                userId: user._id,
                tier: 'free',
                billingCycle: 'none',
                status: 'trial',
                trialStartDate: new Date(),
                trialEndDate,
                features: PLANS.free.features
            });
        }

        user.otpHash = undefined;
        user.otpExpiry = undefined;
        await user.save();

        const token = generateAccessToken(user._id);
        const refreshToken = await generateRefreshToken(user._id);
        
        // Format response
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.__v;
        userObj.id = String(userObj._id);
        userObj.subscription = subscription;

        res.json({ token, refreshToken, user: userObj, isNew: isNewUser });

    } catch (error) { 
        console.error('[OTP] verifyOtp error:', error);
        res.status(500).json({ message: error.message }); 
    }
};

exports.checkIdentifierExists = async (req, res) => {
    try {
        const { phone, email } = req.body;
        let query = {};
        if (phone) {
            query = { phone: phone.trim() };
        } else if (email) {
            query = { email: email.toLowerCase().trim() };
        } else {
            return res.status(400).json({ message: 'Email or Phone Number is required' });
        }

        const user = await User.findOne(query);
        // Treat user as 'new' if they exist but still have the auto-generated name
        if (user && user.name && !user.name.startsWith('Member ')) {
            return res.json({ exists: true, message: 'Welcome back! Login using OTP.' });
        } else {
            return res.json({ exists: false, message: 'Welcome! Create your account using OTP.' });
        }
    } catch (error) {
        console.error('[OTP] checkIdentifierExists error:', error);
        res.status(500).json({ message: error.message });
    }
};
