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

  const now = new Date();

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

module.exports = { verifySubscription };
