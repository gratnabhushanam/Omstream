const mongoose = require('mongoose');

const defaultSettings = {
  notifications: true,
  privacy: 'public',
  interests: [],
};

const defaultBenefits = {
  points: 0,
  badges: [],
};

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    verified: { type: Boolean, default: false },
    password: { type: String },
    
    // OTP Auth Fields
    otpHash: { type: String },
    otpExpiry: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    otpRequestCount: { type: Number, default: 0 },
    lastOtpRequestTime: { type: Date },

    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    language: { type: String, default: 'telugu' },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: null },
    bio: { type: String, default: '' },
    profilePicture: { type: String, default: null },
    settings: { type: Object, default: defaultSettings },
    benefits: { type: Object, default: defaultBenefits },
    bookmarkedSlokas: { type: [Number], default: [] },
    savedReels: { type: [String], default: [] },
    watchlist: { type: [mongoose.Schema.Types.ObjectId], ref: 'Movie', default: [] },
    storyWatchlist: { type: [mongoose.Schema.Types.ObjectId], ref: 'Story', default: [] },
    likedSongs: { type: [mongoose.Schema.Types.ObjectId], ref: 'Song', default: [] },
    japaCount: { type: Number, default: 0 },
    japaMalas: { type: Number, default: 0 },
    pushSubscriptions: { type: Array, default: [] },
    devices: {
      type: [{
        deviceId: { type: String, required: true },
        deviceName: { type: String },
        lastLogin: { type: Date, default: Date.now }
      }],
      default: []
    },
    profiles: {
      type: [{
        name: { type: String, required: true },
        avatar: { type: String, default: null }
      }],
      default: []
    },
    trialStartDate: { type: Date },
    trialEndDate: { type: Date },
    subscriptionStatus: { type: String, enum: ['Trial Active', 'Trial Expired', 'Subscription Active', 'Subscription Cancelled'], default: 'Trial Active' },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre('save', function (next) {
  if (this.isNew) {
    if (!this.trialStartDate) {
      this.trialStartDate = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 1);
      this.trialEndDate = end;
      this.subscriptionStatus = 'Trial Active';
    }
    if (!this.profiles || this.profiles.length === 0) {
      this.profiles = [{ name: this.name || 'Member 1', avatar: null }];
    }
  }
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
