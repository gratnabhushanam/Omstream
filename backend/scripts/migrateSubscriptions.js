const mongoose = require('mongoose');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { PLANS } = require('../controllers/subscriptionController');

const migrateExistingUsers = async () => {
  try {
    console.log('[MIGRATION] Starting subscription migration check...');
    const users = await User.find({});
    
    let migratedCount = 0;
    for (const user of users) {
      const existingSub = await Subscription.findOne({ userId: user._id });
      if (!existingSub) {
        let tier = 'free';
        let status = 'trial';
        let billingCycle = 'none';
        let features = PLANS.free.features;

        // Map legacy subscriptionStatus to new schema
        if (user.subscriptionStatus === 'Subscription Active') {
          tier = 'gold'; // default mapped tier for legacy paid users
          status = 'active';
          billingCycle = 'annual';
          features = PLANS.gold.features;
        } else if (user.subscriptionStatus === 'Trial Expired') {
          status = 'expired';
        } else if (user.subscriptionStatus === 'Subscription Cancelled') {
          status = 'cancelled';
        }

        const trialEndDate = user.trialEndDate || new Date(Date.now() + PLANS.free.trialDays * 24 * 60 * 60 * 1000);

        await Subscription.create({
          userId: user._id,
          tier,
          billingCycle,
          status,
          trialStartDate: user.trialStartDate || new Date(),
          trialEndDate,
          startDate: status === 'active' ? new Date() : undefined,
          endDate: status === 'active' ? trialEndDate : undefined,
          features
        });
        migratedCount++;
      }
    }
    if (migratedCount > 0) {
      console.log(`[MIGRATION] Successfully created Subscription records for ${migratedCount} legacy users.`);
    } else {
      console.log('[MIGRATION] All users already have Subscription records.');
    }
  } catch (error) {
    console.error('[MIGRATION-ERROR] Failed to migrate subscriptions:', error.message);
  }
};

module.exports = { migrateExistingUsers };
