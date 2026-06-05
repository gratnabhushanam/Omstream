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

router.post('/register', registerUser);
router.post('/register/verify-otp', verifyRegistrationOtp);
router.post('/register/resend-otp', resendRegistrationOtp);

// Unified OTP Auth Endpoints
router.post('/send-otp', require('../controllers/otpController').sendOtp);
router.post('/verify-otp', require('../controllers/otpController').verifyOtp);

router.post('/forgot-password/request-otp', requestPasswordResetOtp);
router.post('/forgot-password/verify-otp', verifyPasswordResetOtp);
router.get('/email-health', getEmailHealth);
router.post('/login', loginUser);
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
