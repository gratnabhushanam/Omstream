const mongoose = require('mongoose');

const AccessRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deviceId: { type: String, required: true },
    deviceName: { type: String, required: true },
    osVersion: { type: String, default: 'Unknown OS' },
    browserVersion: { type: String, default: 'Unknown Browser' },
    ipAddress: { type: String, default: '127.0.0.1' },
    location: { type: String, default: 'Unknown Location' },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'denied', 'replaced'], 
      default: 'pending' 
    },
    replaceDeviceId: { type: String, default: null }
  },
  {
    timestamps: true,
  }
);

// High-Performance indexes for device approvals
AccessRequestSchema.index({ userId: 1, status: 1 });
AccessRequestSchema.index({ deviceId: 1, userId: 1 });

module.exports = mongoose.models.AccessRequest || mongoose.model('AccessRequest', AccessRequestSchema);
