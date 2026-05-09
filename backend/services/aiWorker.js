const Job = require('../models/Job');
const Movie = require('../models/Movie');
const Video = require('../models/Video');
const Sloka = require('../models/Sloka');
const Story = require('../models/Story');
const aiService = require('../utils/aiService');

/**
 * AI Background Worker
 * Processes pending translation and media jobs
 */
async function processJobs() {
  const job = await Job.findOne({ status: 'pending' }).sort({ createdAt: 1 });
  if (!job) {
    console.log('[Worker] No pending jobs found.');
    return;
  }

  try {
    console.log(`[Worker] Starting job: ${job._id} (${job.type})`);
    job.status = 'processing';
    await job.save();

    let Model;
    if (job.contentType === 'Movie') Model = Movie;
    else if (job.contentType === 'Video') Model = Video;
    else if (job.contentType === 'Sloka') Model = Sloka;
    else if (job.contentType === 'Story') Model = Story;

    const content = await Model.findById(job.contentId);
    if (!content) {
      throw new Error(`Content ${job.contentId} not found`);
    }

    // Story-specific Chaptering Logic
    if (job.contentType === 'Story' && (job.type === 'chaptering' || job.type === 'all')) {
      if (content.content && (!content.chapters || content.chapters.length === 0)) {
        const chapters = await aiService.processStoryIntoChapters(content.content, content.title);
        content.chapters = chapters;
        content.aiProcessed = true;
        await content.save();
        job.progress = 50;
        await job.save();
      }
    }

    if (job.type === 'translation' || job.type === 'all') {
      const translations = await aiService.translateMetadata(content, job.contentType);
      
      // Update content with translations
      content.translations = translations;
      await content.save();
      
      job.progress = job.type === 'all' ? 33 : 100;
      job.result = { ...job.result, translations };
      await job.save();
    }

    if (job.type === 'subtitle' || job.type === 'all') {
      // Logic for subtitle generation
      if (content.videoUrl || content.url) {
        // Placeholder for real subtitle generation
        const srtContent = "1\n00:00:00,000 --> 00:00:05,000\n[AI Generated Subtitles]";
        content.subtitles = { en: srtContent };
        await content.save();
      }
      job.progress = job.type === 'all' ? 66 : 100;
      await job.save();
    }

    if (job.type === 'dubbing' || job.type === 'all') {
      // Logic for dubbing generation
      job.progress = job.type === 'all' ? 80 : 100;
      await job.save();
    }

    if (job.type === 'reels_snippet' || job.type === 'all') {
      if (job.contentType === 'Movie' || job.contentType === 'Video') {
        const snippets = await aiService.generateReelsSnippets(content, job.contentType);
        content.reelsSnippets = snippets;
        await content.save();
      }
      job.progress = job.type === 'all' ? 90 : 100;
      await job.save();
    }

    if (job.type === 'quiz' || job.type === 'all') {
      const questions = await aiService.generateQuizFromContent(content, job.contentType);
      const Quiz = require('../models/Quiz');
      for (const q of questions) {
        await Quiz.create({
          videoId: job.contentType === 'Video' ? content._id : null,
          question: q.questionText,
          options: q.options,
          correct_answer: q.correctOption,
          difficulty: 'medium'
        });
      }
      job.progress = 100;
      await job.save();
    }
    
    job.status = 'completed';
    await job.save();
    console.log(`[Worker] Job completed: ${job._id}`);

  } catch (error) {
    console.error(`[Worker] Job failed: ${job._id}`, error.message);
    job.status = 'failed';
    job.error = error.message;
    await job.save();
  }
}

// Simple loop to run worker
function startWorker() {
  console.log('[AI Worker] Initialized and waiting for jobs...');
  setInterval(processJobs, 10000); // Check every 10 seconds
}

module.exports = { startWorker, processJobs };
