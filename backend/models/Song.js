const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, default: 'Unknown Artist' },
    url: { type: String, required: true }, // Can be MP3 url or YouTube link
    cover: { type: String, default: 'https://images.unsplash.com/photo-1588665045050-a9474dd7e2ba?auto=format&fit=crop&w=500&q=80' },
    duration: { type: String, default: '0:00' },
    status: { type: String, enum: ['published', 'draft'], default: 'published' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Song || mongoose.model('Song', SongSchema);
