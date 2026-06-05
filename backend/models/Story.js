const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  content:     { type: String }, // Optional full text if not using chapters
  seriesTitle: { type: String, default: 'General' }, // e.g. 'Bhagavad Gita Series'
  language:    { type: String, default: 'en' },      // Primary source language code
  folderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
  parentFolder: { type: String },
  parentFolderId: { type: String },
  isFolder:     { type: Boolean, default: false },
  chapters: [{
    title:     String,
    content:   String,
    audioUrl:  String,
    duration:  Number,
    sequence:  Number,
    summary:   String,
    takeaways: [String],
    folderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
    parentFolder: { type: String }
  }],
  translations: { type: mongoose.Schema.Types.Mixed, default: {} }, // { 'hi': { title: '...', description: '...', chapters: [...] } }
  author:    { type: String },
  category:  { type: String, default: 'General' }, // Ramayana, Mahabharata, Kids, etc.
  thumbnail: { type: String },
  audioUrl:  { type: String }, // Main audio link
  tags:      { type: [String], default: [] },
  isKids:    { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  aiProcessed:  { type: Boolean, default: false },
  publishedAt:  { type: Date },
  status: { type: String, enum: ['draft', 'processing', 'published'], default: 'draft' }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.models.Story || mongoose.model('Story', StorySchema);
