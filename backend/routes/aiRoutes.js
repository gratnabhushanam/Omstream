const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const Job = require('../models/Job');
const Movie = require('../models/Movie');
const Video = require('../models/Video');
const Sloka = require('../models/Sloka');
const Story = require('../models/Story');

/**
 * @route POST /api/ai/process
 * @desc Create a new AI processing job for content
 */
router.post('/process', protect, admin, async (req, res) => {
  const { contentId, contentType, type, languages } = req.body;

  try {
    // Check if job already exists
    const existingJob = await Job.findOne({ contentId, contentType, status: { $in: ['pending', 'processing'] } });
    if (existingJob) {
      return res.status(400).json({ message: 'A processing job is already active for this content' });
    }

    const job = new Job({
      type: type || 'all',
      contentId,
      contentType,
      targetLanguages: languages || ['hi', 'te', 'ta', 'kn', 'ml', 'ur', 'ru', 'pt'],
      status: 'pending'
    });

    await job.save();
    res.status(201).json({ message: 'AI processing job queued successfully', jobId: job._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route GET /api/ai/jobs
 * @desc Get all recent AI jobs
 */
router.get('/jobs', protect, admin, async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).limit(50);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route GET /api/ai/jobs/:contentId
 * @desc Get AI job status for specific content
 */
router.get('/jobs/:contentId', protect, admin, async (req, res) => {
  try {
    const jobs = await Job.find({ contentId: req.params.contentId }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route GET /api/ai/supported-languages
 * @desc Get list of supported languages for AI processing
 */
router.get('/languages', (req, res) => {
  const { SUPPORTED_LANGUAGES } = require('../utils/aiService');
  res.json(SUPPORTED_LANGUAGES);
});

/**
 * @route POST /api/ai/tts
 * @desc Generate AI Voiceover (OpenAI or ElevenLabs)
 */
router.post('/tts', async (req, res) => {
  const { text, voiceType, customAiKey } = req.body;
  const { generateElevenLabsTTS } = require('../utils/aiService');

  try {
    const audioBuffer = await generateElevenLabsTTS(text, voiceType, customAiKey);
    if (!audioBuffer) {
      return res.status(500).json({ message: 'Failed to generate divine narration' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
