const User = require('./User');
const Sloka = require('./Sloka');
const Video = require('./Video');
const Story = require('./Story');
const Movie = require('./Movie');
const Category = require('./Category');
const Notification = require('./Notification');
const Quiz = require('./Quiz');
const QuizSet = require('./QuizSet');
const QuizAttempt = require('./QuizAttempt');
const Group = require('./Group');
const Post = require('./Post');
const Job = require('./Job');

// Performance Indexes
Story.schema.index({ category: 1, isKids: 1, tags: 1, status: 1 });
Story.schema.index({ title: 'text', description: 'text', content: 'text', tags: 'text' }, { weights: { title: 10, tags: 5, description: 3, content: 1 }, name: "StoryTextIndex" });

Video.schema.index({ category: 1, tags: 1, status: 1 });
Video.schema.index({ title: 'text', description: 'text', tags: 'text' }, { weights: { title: 10, tags: 5, description: 3 }, name: "VideoTextIndex" });

Movie.schema.index({ category: 1, tags: 1, status: 1 });
Movie.schema.index({ title: 'text', description: 'text', tags: 'text' }, { weights: { title: 10, tags: 5, description: 3 }, name: "MovieTextIndex" });

module.exports = {
  User,
  Sloka,
  Video,
  Story,
  Movie,
  Category,
  Notification,
  Quiz,
  QuizSet,
  QuizAttempt,
  Group,
  Post,
  Job
};
