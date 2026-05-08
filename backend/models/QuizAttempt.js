const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizSetId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizSet', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  answers: { type: Map, of: String },
  timeSpent: { type: Number },
}, {
  timestamps: true,
  collection: 'quiz_attempts',
});

module.exports = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', QuizAttemptSchema);
