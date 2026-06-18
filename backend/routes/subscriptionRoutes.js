const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  getPlans,
  getCurrentSubscription,
  subscribeToPlan,
  createPaymentLink,
  verifyAndActivate,
  upgradePlan,
  cancelSubscription,
  reactivateSubscription,
  getPaymentHistory,
  handleWebhook,
  generateInvoice
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 payment-related requests per window
  message: { message: 'Too many payment requests from this IP, please try again after 15 minutes' }
});

router.get('/plans', getPlans);
router.get('/current', protect, getCurrentSubscription);
router.post('/subscribe', protect, paymentLimiter, subscribeToPlan);
router.post('/create-payment-link', protect, paymentLimiter, createPaymentLink);
router.post('/verify', protect, paymentLimiter, verifyAndActivate);
router.post('/upgrade', protect, paymentLimiter, upgradePlan);
router.post('/cancel', protect, cancelSubscription);
router.post('/reactivate', protect, reactivateSubscription);
router.get('/history', protect, getPaymentHistory);
router.get('/invoice/:transactionId', protect, generateInvoice);
router.post('/webhook', handleWebhook);

module.exports = router;
