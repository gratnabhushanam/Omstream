const mongoose = require('mongoose');

const QuizSetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true, default: 'General' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  timeLimit: { type: Number, default: 0 },
  thumbnail: { type: String },
  tags: [{ type: String }],
  isPublished: { type: Boolean, default: false },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  collection: 'quiz_sets',
});

module.exports = mongoose.models.QuizSet || mongoose.model('QuizSet', QuizSetSchema);
