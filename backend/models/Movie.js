const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  thumbnail: { type: String },
  videoUrl: { type: String },
  youtubeUrl: { type: String },
  duration: { type: Number },
  genre: { type: String },
  releaseDate: { type: Date },
  isPremium: { type: Boolean, default: false },
  trailerUrl: { type: String },
  hlsUrl: { type: String }
}, {
  timestamps: true,
  strict: false
});

MovieSchema.index({ genre: 1, releaseDate: -1 });
MovieSchema.index({ isPremium: 1 });
MovieSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);
