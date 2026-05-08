const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String },
  video_url: { type: String }, 
  youtubeUrl: { type: String },
  url: { type: String },
  hlsUrl: { type: String },
  hls_url: { type: String }, 
  thumbnail: { type: String },
  module: { 
    type: String, 
    enum: ['divine', 'sloka', 'mentor', 'kids', 'other'], 
    default: 'divine' 
  },
  category: { type: String, default: 'reels' },
  collectionTitle: { type: String, default: 'Bhagavad Gita' },
  isKids: { type: Boolean, default: false },
  quizSetId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizSet' },
  tags: { type: [String], default: [] },
  isUserReel: { type: Boolean, default: false },
  moderationStatus: { type: String, default: 'approved' },
  moderationNote: { type: String, default: '' },
  contentType: { type: String, default: 'spiritual' },
  likesCount: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  savedBy: { type: [String], default: [] },
  commentsCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },
  comments: [{
    id: String,
    userId: String,
    userName: String,
    userEmail: String,
    userRole: String,
    text: String,
    createdAt: Date,
  }],
  chapter: { type: Number },
  language: { type: String, default: 'telugu' },
  duration: { type: Number }, 
  quality_levels: [{ type: String }], 
  description: { type: String },
  views: { type: Number, default: 0 },
  uploadedBy: { type: String },
}, {
  timestamps: true,
  strict: false 
});

module.exports = mongoose.models.Video || mongoose.model('Video', VideoSchema);
