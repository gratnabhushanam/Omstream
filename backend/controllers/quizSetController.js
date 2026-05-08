const { QuizSet, Quiz, QuizAttempt, User } = require('../models');

exports.createQuizSet = async (req, res) => {
  try {
    const { title, questions, ...rest } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });

    const quizSet = await QuizSet.create({ ...rest, title, creatorId: req.user.id });

    if (questions && questions.length > 0) {
      const formatted = questions.map((q, idx) => ({
        quizSetId: quizSet._id,
        question: q.question || q.questionText,
        options: q.options.map(o => typeof o === 'string' ? o : o.answerText),
        correct_answer: q.correct_answer,
        order: idx
      }));
      await Quiz.insertMany(formatted);
    }
    res.status(201).json({ quizSet });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateQuizSet = async (req, res) => {
  try {
    const { id } = req.params;
    const { questions, ...rest } = req.body;
    const quizSet = await QuizSet.findByIdAndUpdate(id, rest, { new: true });
    if (!quizSet) return res.status(404).json({ message: 'Not found' });

    if (questions) {
      await Quiz.deleteMany({ quizSetId: id });
      const formatted = questions.map((q, idx) => ({
        quizSetId: quizSet._id,
        question: q.question || q.questionText,
        options: q.options.map(o => typeof o === 'string' ? o : o.answerText),
        correct_answer: q.correct_answer,
        order: idx
      }));
      await Quiz.insertMany(formatted);
    }
    res.json({ quizSet });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteQuizSet = async (req, res) => {
  try {
    const { id } = req.params;
    await QuizSet.findByIdAndDelete(id);
    await Quiz.deleteMany({ quizSetId: id });
    await QuizAttempt.deleteMany({ quizSetId: id });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getAdminQuizSets = async (req, res) => {
  try {
    const sets = await QuizSet.find().sort({ createdAt: -1 });
    const data = await Promise.all(sets.map(async (s) => {
      const count = await Quiz.countDocuments({ quizSetId: s._id });
      return { ...s.toObject(), questionCount: count };
    }));
    res.json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getPublishedQuizSets = async (req, res) => {
  try {
    const filter = { isPublished: true, ...req.query };
    const sets = await QuizSet.find(filter).sort({ createdAt: -1 });
    const data = await Promise.all(sets.map(async (s) => {
      const count = await Quiz.countDocuments({ quizSetId: s._id });
      return { ...s.toObject(), questionCount: count };
    }));
    res.json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getQuizSetWithQuestions = async (req, res) => {
  try {
    const quizSet = await QuizSet.findById(req.params.id);
    if (!quizSet) return res.status(404).json({ message: 'Not found' });
    const questions = await Quiz.find({ quizSetId: req.params.id }).sort({ order: 1 });
    res.json({ quiz: quizSet, questions });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.submitQuizSetAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeSpent } = req.body;
    const questions = await Quiz.find({ quizSetId: id });
    
    let score = 0;
    const results = questions.map(q => {
      const isCorrect = answers[q._id] === q.correct_answer;
      if (isCorrect) score += 1;
      return { questionId: q._id, isCorrect, correct_answer: q.correct_answer };
    });

    await QuizAttempt.create({ userId: req.user.id, quizSetId: id, score, totalQuestions: questions.length, answers, timeSpent });

    const user = await User.findById(req.user.id);
    if (user) {
      user.benefits.points = (user.benefits.points || 0) + (score * 10);
      user.markModified('benefits');
      await user.save();
    }

    res.json({ score, total: questions.length, results, pointsEarned: score * 10 });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
