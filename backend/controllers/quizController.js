const { Quiz, User } = require('../models');

exports.getAllQuestions = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    return res.status(200).json(quizzes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getQuizByVideoId = async (req, res) => {
  try {
    const { videoId } = req.params;
    const quizzes = await Quiz.find({ videoId });
    const safeQuizzes = quizzes.map(q => {
      const qObj = q.toObject();
      delete qObj.correct_answer;
      return qObj;
    });
    return res.status(200).json(safeQuizzes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { videoId, answers } = req.body;
    const userId = req.user?.id;

    const quizzes = await Quiz.find({ videoId });
    if (!quizzes.length) return res.status(404).json({ message: 'No quiz found' });

    let score = 0;
    const results = quizzes.map(quiz => {
      const isCorrect = answers[quiz._id] === quiz.correct_answer;
      if (isCorrect) score += 1;
      return { quizId: quiz._id, question: quiz.question, isCorrect, correct_answer: quiz.correct_answer };
    });

    if (score > 0 && userId) {
      const user = await User.findById(userId);
      if (user) {
        user.benefits.points = (user.benefits.points || 0) + (score * 10);
        user.markModified('benefits');
        await user.save();
      }
    }

    return res.json({ score, total: quizzes.length, results });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.addQuizQuestion = async (req, res) => {
  try {
    const newQuiz = await Quiz.create(req.body);
    return res.status(201).json(newQuiz);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteQuizQuestion = async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
