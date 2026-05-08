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
    japaCount: { type: Number, default: 0 },
    japaMalas: { type: Number, default: 0 },
    pushSubscriptions: { type: Array, default: [] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
