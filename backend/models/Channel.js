const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Sports', 'News', 'Devotional', 'Entertainment', 'Music', 'Other'],
    default: 'Devotional'
  },
  thumbnail: {
    type: String,
    required: true
  },
  streamUrl: {
    type: String,
    required: true
  },
  isLive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Channel', channelSchema);
