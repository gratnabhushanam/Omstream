const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
const { connectDB } = require('./config/db');

// Models
const Movie = require('./models/Movie');
const Story = require('./models/Story');
const Video = require('./models/Video');
const QuizSet = require('./models/QuizSet');
const Quiz = require('./models/Quiz');

const STORE_FILE = path.join(__dirname, 'data', 'mockContentStore.json');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Starting seed process...');

    if (!fs.existsSync(STORE_FILE)) {
      console.log('mockContentStore.json not found. Exiting.');
      process.exit(0);
    }

    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const data = JSON.parse(raw);

    // Seed Movies
    if (data.mockMovies && data.mockMovies.length > 0) {
      for (const movie of data.mockMovies) {
        const exists = await Movie.findOne({ title: movie.title });
        if (!exists) {
          await Movie.create({
            title: movie.title,
            description: movie.description,
            videoUrl: movie.videoUrl,
            youtubeUrl: movie.youtubeUrl,
            thumbnail: movie.thumbnail,
            releaseYear: movie.releaseYear,
            tags: movie.tags,
            createdAt: movie.createdAt
          });
        }
      }
      console.log('Movies seeded.');
    }

    // Seed Stories
    if (data.mockStories && data.mockStories.length > 0) {
      for (const story of data.mockStories) {
        const exists = await Story.findOne({ title: story.title });
        if (!exists) {
          await Story.create({
            title: story.title,
            titleTelugu: story.titleTelugu,
            titleHindi: story.titleHindi,
            titleEnglish: story.titleEnglish,
            seriesTitle: story.seriesTitle,
            summary: story.summary,
            content: story.content,
            chapter: story.chapter,
            language: story.language,
            thumbnail: story.thumbnail,
            tags: story.tags,
            bgmEnabled: story.bgmEnabled,
            bgmPreset: story.bgmPreset,
            createdAt: story.createdAt
          });
        }
      }
      console.log('Stories seeded.');
    }

    // Seed Videos
    if (data.mockVideos && data.mockVideos.length > 0) {
      for (const video of data.mockVideos) {
        const exists = await Video.findOne({ title: video.title, category: video.category });
        if (!exists) {
          await Video.create({
            title: video.title,
            description: video.description,
            videoUrl: video.videoUrl,
            youtubeUrl: video.youtubeUrl,
            thumbnail: video.thumbnail,
            category: video.category,
            collectionTitle: video.collectionTitle,
            language: video.language,
            duration: video.duration,
            tags: video.tags,
            views: video.views,
            isKids: video.isKids,
            isUserReel: video.isUserReel,
            contentType: video.contentType,
            likesCount: video.likesCount,
            createdAt: video.createdAt
          });
        }
      }
      console.log('Videos seeded.');
    }

    // Seed QuizSets
    let quizSetMap = {}; // mapping old mock ID to new MongoDB ObjectId
    if (data.mockQuizSets && data.mockQuizSets.length > 0) {
      for (const qs of data.mockQuizSets) {
        let exists = await QuizSet.findOne({ title: qs.title });
        if (!exists) {
          exists = await QuizSet.create({
            title: qs.title,
            description: qs.description,
            category: qs.category,
            difficulty: qs.difficulty,
            timeLimit: qs.timeLimit,
            thumbnail: qs.thumbnail,
            tags: qs.tags,
            isPublished: qs.isPublished,
            createdAt: qs.createdAt
          });
        }
        quizSetMap[qs.id] = exists._id;
      }
      console.log('QuizSets seeded.');
    }

    // Seed Quizzes
    if (data.mockQuizzes && data.mockQuizzes.length > 0) {
      for (const q of data.mockQuizzes) {
        const mongoQsId = quizSetMap[q.quizSetId];
        if (!mongoQsId) continue;
        
        const exists = await Quiz.findOne({ question: q.question, quizSetId: mongoQsId });
        if (!exists) {
          await Quiz.create({
            quizSetId: mongoQsId,
            questionType: q.questionType,
            order: q.order,
            image: q.image,
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            difficulty: q.difficulty,
            explanation: q.explanation,
            createdAt: q.createdAt
          });
        }
      }
      console.log('Quizzes seeded.');
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
