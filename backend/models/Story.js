const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String },
  author: { type: String },
  thumbnail: { type: String },
  audioUrl: { type: String },
  tags: { type: [String], default: [] },
  isKids: { type: Boolean, default: false }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.models.Story || mongoose.model('Story', StorySchema);
