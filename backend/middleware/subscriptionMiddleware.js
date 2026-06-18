const Subscription = require('../models/Subscription');
const { TIER_HIERARCHY } = require('../controllers/subscriptionController');

/**
 * Middleware to enforce active subscription status before viewing premium content
 */
const verifySubscription = async (req, res, next) => {
  // Admins bypass subscription validations
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Check Subscription model first
  let subscription = await Subscription.findOne({ userId: user._id });
  if (subscription) {
    const now = new Date();
    if (subscription.status === 'active' || subscription.status === 'trial') {
      if (subscription.endDate && now > new Date(subscription.endDate)) {
        if (subscription.autoRenew) {
          // In a real system, this would trigger an auto-renewal charge.
          // For now, allow 3 days grace
        }
        const graceEnd = new Date(subscription.endDate);
        graceEnd.setDate(graceEnd.getDate() + 3);
        if (now <= graceEnd) {
          res.setHeader('X-Subscription-Warning', 'Grace period active');
          return next();
        } else {
          subscription.status = 'expired';
          await subscription.save();
        }
      } else {
        return next();
      }
    }
  }

  const now = new Date();

  // Legacy fallback
  // 1. If user is in "Trial Active" state, verify if trial period has elapsed
  if (user.subscriptionStatus === 'Trial Active') {
    if (user.trialEndDate && now > new Date(user.trialEndDate)) {
      user.subscriptionStatus = 'Trial Expired';
      await user.save().catch(e => console.error('[SUB] Failed to save expired trial state:', e));
      return res.status(403).json({
        status: 'subscription_expired',
        message: 'Your free trial period has expired. Please subscribe to continue streaming.'
      });
    }
    return next();
  }

  // 2. If user has active paid subscription, allow stream
  if (user.subscriptionStatus === 'Subscription Active') {
    // Check if subscription has expired and auto-renew isn't set
    if (user.trialEndDate && now > new Date(user.trialEndDate)) {
      // Allow 3-day grace period
      const gracePeriodEnd = new Date(user.trialEndDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

      if (now <= gracePeriodEnd) {
        res.setHeader('X-Subscription-Warning', 'Grace period active. Renew your subscription.');
        return next();
      } else {
        user.subscriptionStatus = 'Subscription Cancelled';
        await user.save().catch(e => console.error('[SUB] Failed to update expired subscription state:', e));
        return res.status(403).json({
          status: 'subscription_expired',
          message: 'Your subscription has expired. Please renew to resume streaming.'
        });
      }
    }
    return next();
  }

  // 3. Block for any expired or cancelled states beyond grace period
  return res.status(403).json({
    status: 'subscription_expired',
    message: 'Access Blocked: Active premium subscription required to watch this content.'
  });
};

const requireTier = (minimumTier) => async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });
    if (!subscription || !['active', 'trial'].includes(subscription.status)) {
      return res.status(403).json({
        upgrade: true,
        requiredTier: minimumTier,
        currentTier: 'free',
        message: `This feature requires a ${minimumTier.toUpperCase()} subscription.`
      });
    }

    const currentRank = TIER_HIERARCHY[subscription.tier] || 0;
    const requiredRank = TIER_HIERARCHY[minimumTier] || 0;

    if (currentRank < requiredRank) {
      return res.status(403).json({
        upgrade: true,
        requiredTier: minimumTier,
        currentTier: subscription.tier,
        message: `This feature requires a ${minimumTier.toUpperCase()} subscription.`
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requireFeature = (featureName) => async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });
    if (!subscription || !['active', 'trial'].includes(subscription.status)) {
      return res.status(403).json({
        upgrade: true,
        message: 'This feature is locked under your current plan level.'
      });
    }

    if (!subscription.features[featureName]) {
      return res.status(403).json({
        upgrade: true,
        message: 'This feature is locked under your current plan level.'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  verifySubscription,
  requireTier,
  requireFeature
};

