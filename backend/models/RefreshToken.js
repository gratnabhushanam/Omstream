const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiryDate: { type: Date, required: true }
}, { timestamps: true });

refreshTokenSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 }); // Auto-expire documents when expiryDate is reached

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
