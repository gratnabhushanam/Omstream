const mongoose = require('mongoose');

const SlokaSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, // Keep legacy numeric ID for client compatibility
  chapter: { type: Number },
  verse: { type: Number },
  sanskrit: { type: String },
  // Legacy per-language meaning fields
  teluguMeaning:    { type: String },
  hindiMeaning:     { type: String },
  englishMeaning:   { type: String },
  tamilMeaning:     { type: String },
  kannadaMeaning:   { type: String },
  malayalamMeaning: { type: String },
  bengaliMeaning:   { type: String },
  marathiMeaning:   { type: String },
  sanskritMeaning:  { type: String },
  // AI-generated localized meanings map: { 'ta': '...', 'kn': '...' }
  localizedMeaning: { type: mongoose.Schema.Types.Mixed, default: {} },
  simpleExplanation: { type: String },
  realLifeExample:   { type: String },
  // Per-language audio URLs
  audioUrl:         { type: String },
  audioUrlEnglish:  { type: String },
  audioUrlTelugu:   { type: String },
  audioUrlHindi:    { type: String },
  audioUrlTamil:    { type: String },
  audioUrlKannada:  { type: String },
  audioUrlMalayalam:{ type: String },
  audioUrlBengali:  { type: String },
  audioUrlMarathi:  { type: String },
  audioUrlSanskrit: { type: String },
  // Flexible map for any language audio: { 'ta': 'https://...', 'kn': '...' }
  audioByLanguage:  { type: mongoose.Schema.Types.Mixed, default: {} },
  tags:    { type: [String], default: [] },
  isDaily: { type: Boolean, default: false },
  dailyKey: { type: String }, // e.g. '2026-05-09' for scheduled daily assignment
  translations: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  strict: false // Allow extra fields
});

// Performance Indexes
SlokaSchema.index({ id: 1 });
SlokaSchema.index({ dailyKey: 1 });
SlokaSchema.index({ isDaily: 1 });
SlokaSchema.index({ tags: 1 });

// Full-text index for high-performance Mentor searches (replaces slow regex)
SlokaSchema.index({ 
  tags: 'text', 
  englishMeaning: 'text', 
  simpleExplanation: 'text' 
}, {
  weights: {
    tags: 10,
    englishMeaning: 5,
    simpleExplanation: 2
  },
  name: "SlokaTextIndex"
});

module.exports = mongoose.models.Sloka || mongoose.model('Sloka', SlokaSchema);
