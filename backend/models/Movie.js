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
  trailerUrl: { type: String }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);
