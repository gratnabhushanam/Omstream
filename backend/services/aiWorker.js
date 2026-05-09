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
  let job;
  try {
    job = await Job.findOne({ status: 'pending' }).sort({ createdAt: 1 });
    if (!job) {
      // console.log('[Worker] No pending jobs found.');
      return;
    }

    // Validation Check: If critical fields are missing, fail immediately without a crash loop
    if (!job.contentType || !job.contentId) {
      console.warn(`[Worker] Job ${job._id} is corrupt (missing contentType or contentId). Marking as failed.`);
      await Job.updateOne(
        { _id: job._id }, 
        { status: 'failed', error: 'Missing critical fields: contentType or contentId' }
      );
      return;
    }

    console.log(`[Worker] Starting job: ${job._id} (${job.type})`);
    
    // Set to processing using updateOne to avoid early validation issues
    await Job.updateOne({ _id: job._id }, { status: 'processing' });
    // Refresh local object state for logic
    job.status = 'processing';

    let Model;
    if (job.contentType === 'Movie') Model = Movie;
    else if (job.contentType === 'Video') Model = Video;
    else if (job.contentType === 'Sloka') Model = Sloka;
    else if (job.contentType === 'Story') Model = Story;

    if (!Model) {
      throw new Error(`Unsupported content type: ${job.contentType}`);
    }

    const content = await Model.findById(job.contentId);
    if (!content) {
      throw new Error(`Content ${job.contentId} not found in ${job.contentType} collection`);
    }

    // Story-specific Chaptering Logic
    if (job.contentType === 'Story' && (job.type === 'chaptering' || job.type === 'all')) {
      if (content.content && (!content.chapters || content.chapters.length === 0)) {
        const chapters = await aiService.processStoryIntoChapters(content.content, content.title);
        content.chapters = chapters;
        content.aiProcessed = true;
        await content.save();
        await Job.updateOne({ _id: job._id }, { progress: 50 });
      }
    }

    if (job.type === 'translation' || job.type === 'all') {
      // Auto-detect language if not set
      if (!content.language && !content.originalLanguage) {
        console.log(`[Worker] Detecting language for ${content.title || 'unnamed content'}...`);
        const detected = await aiService.detectLanguage(content.content || content.description || content.title || "");
        content.language = detected;
        content.originalLanguage = detected;
        await content.save();
      }

      const translations = await aiService.translateMetadata(content, job.contentType, job.targetLanguages);
      content.translations = translations;
      content.markModified('translations');
      await content.save();
      
      const progress = job.type === 'all' ? 33 : 100;
      await Job.updateOne({ _id: job._id }, { progress, result: { translations } });
    }

    if (job.type === 'subtitle' || job.type === 'all') {
      if (content.videoUrl || content.url) {
        const srtContent = "1\n00:00:00,000 --> 00:00:05,000\n[AI Generated Subtitles]";
        content.subtitles = { en: srtContent };
        await content.save();
      }
      const progress = job.type === 'all' ? 66 : 100;
      await Job.updateOne({ _id: job._id }, { progress });
    }

    if (job.type === 'dubbing' || job.type === 'all') {
      const progress = job.type === 'all' ? 80 : 100;
      await Job.updateOne({ _id: job._id }, { progress });
    }

    if (job.type === 'reels_snippet' || job.type === 'all') {
      if (job.contentType === 'Movie' || job.contentType === 'Video') {
        const snippets = await aiService.generateReelsSnippets(content, job.contentType);
        content.reelsSnippets = snippets;
        await content.save();
      }
      const progress = job.type === 'all' ? 90 : 100;
      await Job.updateOne({ _id: job._id }, { progress });
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
      await Job.updateOne({ _id: job._id }, { progress: 100 });
    }
    
    await Job.updateOne({ _id: job._id }, { status: 'completed', progress: 100 });
    console.log(`[Worker] Job completed: ${job._id}`);

  } catch (error) {
    console.error(`[Worker] Job error: ${job ? job._id : 'unknown'}`, error.message);
    if (job && job._id) {
      try {
        await Job.updateOne(
          { _id: job._id }, 
          { status: 'failed', error: error.message }
        );
      } catch (saveError) {
        console.error('[Worker] Fatal: Could not even mark job as failed:', saveError.message);
      }
    }
  }
}

// Simple loop to run worker
function startWorker() {
  console.log('[AI Worker] Initialized and waiting for jobs...');
  setInterval(processJobs, 10000); // Check every 10 seconds
}

module.exports = { startWorker, processJobs };
