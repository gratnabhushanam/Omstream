const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String }, // Optional full text if not using chapters
  chapters: [{
    title: String,
    content: String,
    audioUrl: String,
    duration: Number,
    sequence: Number,
    summary: String,
    takeaways: [String]
  }],
  translations: { type: Map, of: Object }, // { 'hi': { title: '...', description: '...', chapters: [...] } }
  author: { type: String },
  category: { type: String, default: 'General' }, // Ramayana, Mahabharata, Kids, etc.
  thumbnail: { type: String },
  audioUrl: { type: String }, // Main audio link
  tags: { type: [String], default: [] },
  isKids: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  aiProcessed: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'processing', 'published'], default: 'draft' }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.models.Story || mongoose.model('Story', StorySchema);
