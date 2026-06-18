const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { PLANS } = require('../controllers/subscriptionController');

const initializeSubscriptionCrons = () => {
  // Run daily at midnight: 0 0 * * *
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running subscription checks...');
    try {
      const now = new Date();

      // 1. Handle Expired Trials
      const expiredTrials = await Subscription.find({
        status: 'trial',
        trialEndDate: { $lt: now }
      });

      for (const sub of expiredTrials) {
        sub.status = 'expired';
        sub.features = PLANS.free.features; // reset features
        await sub.save();

        // Update legacy status on User
        await User.findByIdAndUpdate(sub.userId, {
          subscriptionStatus: 'Trial Expired'
        });
        console.log(`[CRON] Trial expired for user ${sub.userId}`);
      }

      // 2. Handle Expired Active plans -> Move to Grace Period (3 days)
      const expiredActive = await Subscription.find({
        status: 'active',
        endDate: { $lt: now },
        gracePeriodEnd: { $exists: false }
      });

      for (const sub of expiredActive) {
        const graceEnd = new Date(sub.endDate);
        graceEnd.setDate(graceEnd.getDate() + 3);

        sub.status = 'grace_period';
        sub.gracePeriodEnd = graceEnd;
        await sub.save();
        console.log(`[CRON] Active plan expired, moved to grace period for user ${sub.userId}`);
      }

      // 3. Handle End of Grace Period -> Fully Expire
      const expiredGrace = await Subscription.find({
        status: 'grace_period',
        gracePeriodEnd: { $lt: now }
      });

      for (const sub of expiredGrace) {
        sub.status = 'expired';
        sub.tier = 'free';
        sub.features = PLANS.free.features;
        await sub.save();

        // Update legacy status on User
        await User.findByIdAndUpdate(sub.userId, {
          subscriptionStatus: 'Subscription Cancelled'
        });
        console.log(`[CRON] Grace period ended, downgraded to free for user ${sub.userId}`);
      }

    } catch (error) {
      console.error('[CRON-ERROR] Failed to run subscription checks:', error);
    }
  });
};

module.exports = { initializeSubscriptionCrons };
