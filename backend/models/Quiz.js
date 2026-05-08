const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  quizSetId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizSet' },
  questionType: { type: String, enum: ['mcq', 'true_false', 'image_based'], default: 'mcq' },
  order: { type: Number, default: 0 },
  image: { type: String },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correct_answer: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  explanation: { type: String },
}, {
  timestamps: true,
  collection: 'quizzes',
});

module.exports = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);
