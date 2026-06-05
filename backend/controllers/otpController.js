const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const nodemailer = require('nodemailer');

const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

const sendEmailOtp = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });
    await transporter.sendMail({
        from: `"Gita Wisdom" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Gita Wisdom - Your Login OTP',
        html: `<h2>Verification Code: ${otp}</h2>`,
    });
};

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email required' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) user = new User({ email: email.toLowerCase().trim() });

        user.otpHash = hashedOtp;
        user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);
        await user.save();

        await sendEmailOtp(email, otp);
        res.json({ message: 'OTP sent' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user || !user.otpHash || new Date() > user.otpExpiry) return res.status(400).json({ message: 'Invalid or expired OTP' });

        if (!(await bcrypt.compare(otp, user.otpHash))) return res.status(400).json({ message: 'Invalid OTP' });

        // Fail-safe: Ensure admin role for bootstrap email
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
        if (ADMIN_EMAIL && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()) {
            user.role = 'admin';
        }

        // Check device limit
        const { checkAndRegisterDevice } = require('../middleware/authMiddleware');
        const allowed = await checkAndRegisterDevice(user, req.headers);
        if (!allowed) {
            return res.status(403).json({ message: "Maximum device limit reached. This account can be used on up to 3 devices only." });
        }

        user.otpHash = undefined;
        user.otpExpiry = undefined;
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({ token, user });
    } catch (error) { res.status(500).json({ message: error.message }); }
};
