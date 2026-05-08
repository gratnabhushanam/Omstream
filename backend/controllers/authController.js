const { User, Sloka, Movie, Video, Story } = require('../models');
const mongoose = require('mongoose');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const mockContentStore = require('../utils/mockContentStore');

// Mock in-memory database for fallback
let mockUsers = [];
let nextUserId = 1;
let isMockModeActive = false;

// In-memory OTP store
const pendingRegistrations = new Map();
const pendingPasswordResets = new Map();
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);

const ADMIN_NAME = process.env.ADMIN_NAME || 'Gita Admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const findPersistentUserByEmail = async (email) => User.findOne({ email });
const findPersistentUserById = async (id) => User.findById(String(id));
const createPersistentUser = async (payload) => User.create(payload);
const findAnyPersistentAdmin = async () => User.findOne({ role: 'admin' });
const listPersistentUsers = async ({ limit } = {}) => {
  const query = User.find({}, { password: 0 }).sort({ createdAt: -1 });
  if (limit) query.limit(limit);
  return query;
};
const deletePersistentUser = async (user) => { if (user) await user.deleteOne(); };
const getPersistentUserCount = async () => User.countDocuments({});

const sanitizeUserForResponse = (user) => {
  if (!user) return null;
  const raw = typeof user.toObject === 'function' ? user.toObject() : user;
  const { _id, __v, password, ...rest } = raw;
  return { id: String(_id), ...rest };
};

const normalizeUserSettings = (incomingSettings = {}, currentSettings = {}) => {
  const base = { notifications: true, privacy: 'public', interests: [], ...(currentSettings || {}) };
  if (incomingSettings && typeof incomingSettings === 'object') {
    if (Object.prototype.hasOwnProperty.call(incomingSettings, 'notifications')) base.notifications = Boolean(incomingSettings.notifications);
    if (Object.prototype.hasOwnProperty.call(incomingSettings, 'privacy')) base.privacy = String(incomingSettings.privacy).toLowerCase() === 'private' ? 'private' : 'public';
    if (Array.isArray(incomingSettings.interests)) base.interests = incomingSettings.interests.slice(0, 20);
  }
  return base;
};

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const getOtpExpiryTime = () => Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

const sendOtpEmail = async ({ email, name, otp }) => {
  // Logic for sending email (Resend, Brevo, SMTP) - Keeping the robust version from original
  const { resolveEmailProvider, sendViaResend, sendViaBrevo, sendViaSmtp } = require('../utils/emailHelpers'); // I'll move it to a helper or keep it here
  const provider = resolveEmailProvider();
  if (provider === 'preview') return { delivered: true, provider: 'preview', previewCode: otp };
  
  if (provider === 'resend') return await sendViaResend({ email, name, otp });
  if (provider === 'brevo') return await sendViaBrevo({ email, name, otp });
  return await sendViaSmtp({ email, name, otp });
};

// ... Simplified Auth Endpoints ...

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;
    const safeEmail = normalizeEmail(email);
    if (!name || !safeEmail || !password) return res.status(400).json({ message: 'Name, email and password required' });

    if (await findPersistentUserByEmail(safeEmail)) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = createOtp();
    pendingRegistrations.set(safeEmail, { name, email: safeEmail, phoneNumber, password: hashedPassword, otp, expiresAt: getOtpExpiryTime(), attempts: 0 });

    const delivery = await sendOtpEmail({ email: safeEmail, name, otp });
    return res.status(200).json({ message: 'OTP sent', email: safeEmail, previewCode: delivery.previewCode });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.resendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const safeEmail = normalizeEmail(email);
    const pending = pendingRegistrations.get(safeEmail);
    if (!pending) return res.status(404).json({ message: 'No registration in progress' });

    const otp = createOtp();
    pending.otp = otp;
    pending.expiresAt = getOtpExpiryTime();
    
    const delivery = await sendOtpEmail({ email: safeEmail, name: pending.name, otp });
    res.json({ message: 'OTP resent', previewCode: delivery.previewCode });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const safeEmail = normalizeEmail(email);
    const pending = pendingRegistrations.get(safeEmail);
    if (!pending || pending.otp !== otp || pending.expiresAt < Date.now()) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const user = await createPersistentUser({ name: pending.name, email: pending.email, password: pending.password, phone: pending.phoneNumber });
    pendingRegistrations.delete(safeEmail);

    res.status(201).json({ ...sanitizeUserForResponse(user), token: generateToken(user.id) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findPersistentUserByEmail(normalizeEmail(email));
    if (user && (await bcrypt.compare(password, user.password))) {
      user.lastActive = new Date();
      user.streak = (user.streak || 0) + 1; // Simplified streak
      await user.save();
      return res.json({ ...sanitizeUserForResponse(user), token: generateToken(user.id) });
    }
    res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await findPersistentUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(sanitizeUserForResponse(user));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const user = await findPersistentUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    Object.assign(user, req.body);
    if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);
    await user.save();
    res.json(sanitizeUserForResponse(user));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getStats = async (req, res) => {
  try {
    res.json({
      totalUsers: await User.countDocuments({}),
      totalMovies: await Movie.countDocuments({}),
      totalStories: await Story.countDocuments({}),
      totalVideos: await Video.countDocuments({}),
      recentUsers: await User.find({}, { password: 0 }).sort({ createdAt: -1 }).limit(5)
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const { slokaId } = req.body;
    const user = await findPersistentUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const idx = user.bookmarkedSlokas.indexOf(slokaId);
    if (idx > -1) user.bookmarkedSlokas.splice(idx, 1);
    else user.bookmarkedSlokas.push(slokaId);
    
    await user.save();
    res.json({ bookmarks: user.bookmarkedSlokas });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateJapaCounter = async (req, res) => {
  try {
    const { beads, malas } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { japaCount: beads, japaMalas: malas }, { new: true });
    res.json({ user: sanitizeUserForResponse(user) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.addKarmaPoints = async (req, res) => {
  try {
    const user = await findPersistentUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.benefits.points = (user.benefits.points || 0) + (Number(req.body.points) || 5);
    user.markModified('benefits');
    await user.save();
    res.json({ points: user.benefits.points });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateStreak = async (req, res) => {
  try {
    const user = await findPersistentUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.streak = (user.streak || 0) + 1;
    await user.save();
    res.json({ streak: user.streak });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.requestPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findPersistentUserByEmail(normalizeEmail(email));
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = createOtp();
    pendingPasswordResets.set(normalizeEmail(email), { otp, expiresAt: getOtpExpiryTime() });
    
    const delivery = await sendOtpEmail({ email: user.email, name: user.name, otp });
    res.json({ message: 'Reset OTP sent', previewCode: delivery.previewCode });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const safeEmail = normalizeEmail(email);
    const pending = pendingPasswordResets.get(safeEmail);
    if (!pending || pending.otp !== otp || pending.expiresAt < Date.now()) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const user = await findPersistentUserByEmail(safeEmail);
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    pendingPasswordResets.delete(safeEmail);
    res.json({ message: 'Password reset successful' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getEmailHealth = async (req, res) => {
  res.json({ status: 'healthy', provider: process.env.EMAIL_PROVIDER || 'smtp' });
};

// Admin bootstraps
exports.initializeAdminCredentials = async () => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  const exists = await User.findOne({ email: normalizeEmail(ADMIN_EMAIL) });
  if (exists) return;
  await User.create({ name: ADMIN_NAME, email: normalizeEmail(ADMIN_EMAIL), password: await bcrypt.hash(ADMIN_PASSWORD, 10), role: 'admin' });
};

exports.setMockMode = (val) => { isMockModeActive = val; };
exports.isMockMode = () => isMockModeActive;
exports.getAllUsers = async (req, res) => res.json(await User.find({}, { password: 0 }));
exports.deleteUserByAdmin = async (req, res) => { await User.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); };
exports.getCommunityProfiles = async (req, res) => res.json(await User.find({ role: 'user' }, 'name bio profilePicture streak benefits settings'));
exports.getUserByIdForAuth = async (id) => User.findById(String(id));