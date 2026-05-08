const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  coverImage: { type: String, default: null },
  category: { type: String, default: 'General' },
  membersCount: { type: Number, default: 0 },
  createdBy: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  collection: 'satsang_groups',
});

module.exports = mongoose.models.Group || mongoose.model('Group', GroupSchema);
