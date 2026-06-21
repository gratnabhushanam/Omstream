const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverImage: { type: String, default: null },
  category: { type: String, default: 'General' },
  membersCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  collection: 'communities',
});

module.exports = mongoose.models.Community || mongoose.model('Community', CommunitySchema);
