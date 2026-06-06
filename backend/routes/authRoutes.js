const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  verifyRegistrationOtp,
  resendRegistrationOtp,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  getEmailHealth,
  loginUser, 
  getUserProfile, 
  toggleBookmark, 
  updateUserProfile,
  getAllUsers,
  getStats,
  deleteUserByAdmin,
  getCommunityProfiles,
  getUserDevices,
  removeUserDevice,
  getUserProfiles,
  createUserProfile,
  removeUserProfile,
  activateSubscription,
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Anti-Hacker Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for login/register
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 OTP requests per hour to prevent spam costs
  message: { message: 'Too many OTP requests from this IP, please try again after 1 hour' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, registerUser);
router.post('/register/verify-otp', authLimiter, verifyRegistrationOtp);
router.post('/register/resend-otp', otpLimiter, resendRegistrationOtp);

// Unified OTP Auth Endpoints
router.post('/send-otp', otpLimiter, require('../controllers/otpController').sendOtp);
router.post('/verify-otp', authLimiter, require('../controllers/otpController').verifyOtp);

router.post('/forgot-password/request-otp', otpLimiter, requestPasswordResetOtp);
router.post('/forgot-password/verify-otp', authLimiter, verifyPasswordResetOtp);
router.get('/email-health', getEmailHealth);
router.post('/login', authLimiter, loginUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/community', protect, getCommunityProfiles);
router.post('/bookmarks', protect, toggleBookmark);
router.post('/profile/japa', protect, require('../controllers/authController').updateJapaCounter);
router.post('/profile/points', protect, require('../controllers/authController').addKarmaPoints);
router.post('/streak', protect, require('../controllers/authController').updateStreak);

// Device and Profile Management
router.get('/devices', protect, getUserDevices);
router.delete('/devices/:deviceId', protect, removeUserDevice);
router.get('/profiles', protect, getUserProfiles);
router.post('/profiles', protect, createUserProfile);
router.delete('/profiles/:profileId', protect, removeUserProfile);
router.post('/subscribe', protect, activateSubscription);

// Admin Routes
router.get('/users', protect, admin, getAllUsers);
router.delete('/users/:id', protect, admin, deleteUserByAdmin);
router.get('/stats', protect, admin, getStats);

module.exports = router;
