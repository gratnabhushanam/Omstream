const mongoose = require('mongoose');

const SlokaSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, // Keep legacy numeric ID for client compatibility
  chapter: { type: Number },
  verse: { type: Number },
  sanskrit: { type: String },
  teluguMeaning: { type: String },
  hindiMeaning: { type: String },
  englishMeaning: { type: String },
  simpleExplanation: { type: String },
  realLifeExample: { type: String },
  audioUrl: { type: String },
  audioUrlEnglish: { type: String },
  audioUrlTelugu: { type: String },
  audioUrlHindi: { type: String },
  tags: { type: [String], default: [] },
  isDaily: { type: Boolean, default: false }
}, {
  timestamps: true,
  strict: false // Allow extra fields
});

module.exports = mongoose.models.Sloka || mongoose.model('Sloka', SlokaSchema);
