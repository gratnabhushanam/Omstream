const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  tier: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
  billingCycle: { type: String, enum: ['monthly', 'quarterly', 'annual', 'none'], default: 'none' },
  status: { type: String, enum: ['active', 'trial', 'expired', 'cancelled', 'grace_period'], default: 'trial' },
  startDate: Date,
  endDate: Date,
  trialStartDate: Date,
  trialEndDate: Date,
  autoRenew: { type: Boolean, default: true },
  razorpaySubscriptionId: String,
  lastPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  cancelledAt: Date,
  cancelReason: String,
  gracePeriodEnd: Date,
  features: {
    maxDevices: { type: Number, default: 1 },
    maxProfiles: { type: Number, default: 1 },
    adFree: { type: Boolean, default: false },
    offlineDownload: { type: Boolean, default: false },
    maxQuality: { type: String, default: '480p' },
    aiChatLimit: { type: Number, default: 3 },
    movieAccess: { type: String, enum: ['none', 'preview', 'full'], default: 'none' },
    satsangAccess: { type: Boolean, default: false },
  }
}, { timestamps: true });

subscriptionSchema.index({ status: 1, endDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
