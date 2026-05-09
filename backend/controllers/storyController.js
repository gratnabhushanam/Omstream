const { Story, Job } = require('../models');
const mongoose = require('mongoose');
const { mapStory } = require('../utils/responseMappers');

/**
 * GET /api/stories
 * Returns all published stories, sorted newest first.
 */
exports.getStories = async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { status: 'published' };
    const stories = await Story.find(filter).sort({ createdAt: -1 });
    return res.json(stories.map(mapStory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/stories/kids
 * Returns stories tagged for children audiences.
 */
exports.getKidsStories = async (req, res) => {
  try {
    const stories = await Story.find({
      status: 'published',
      $or: [
        { isKids: true },
        { tags: { $regex: 'kids', $options: 'i' } },
        { category: { $regex: 'kids', $options: 'i' } }
      ]
    }).sort({ viewCount: -1 });
    res.json(stories.map(mapStory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/stories/:id
 * Returns a single story by ID and increments its view count.
 */
exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    if (!story) return res.status(404).json({ message: 'Story not found' });
    return res.json(mapStory(story));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/stories
 * Creates a story. If AI processing is requested, auto-generates chapters and translations.
 */
exports.addStory = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      title: req.body.title || 'Untitled Story',
      seriesTitle: req.body.seriesTitle || req.body.category || 'General',
      status: req.body.status || 'draft',
    };

    const newStory = await Story.create(payload);

    // Kick off background AI processing via Job Queue
    if (req.body.autoProcess !== false && (newStory.content || newStory.chapters?.length)) {
       await Job.create({
         type: 'all',
         contentId: newStory._id,
         contentType: 'Story',
         status: 'pending'
       });
    }

    return res.status(201).json(mapStory(newStory));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * PUT /api/stories/:id
 * Updates a story. Triggers AI re-processing if content changed.
 */
exports.updateStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!story) return res.status(404).json({ message: 'Story not found' });

    // Trigger AI re-processing if content changed
    if ((req.body.content || req.body.title) && story.status !== 'processing') {
       await Job.findOneAndUpdate(
         { contentId: story._id, status: 'pending' },
         { type: 'all', status: 'pending' },
         { upsert: true }
       );
    }

    return res.json(mapStory(story));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

/**
 * POST /api/stories/:id/publish
 * Publishes a story and triggers AI translation + chapter generation if not done.
 */
exports.publishStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    await Story.findByIdAndUpdate(req.params.id, {
      status: 'published',
      publishedAt: new Date()
    });

    if (!story.aiProcessed) {
       await Job.create({
         type: 'all',
         contentId: story._id,
         contentType: 'Story',
         status: 'pending'
       });
    }

    return res.json({ message: 'Story published', id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/stories/:id
 */
exports.deleteStory = async (req, res) => {
  try {
    await Story.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted', id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/stories/:id/process
 * Manually triggers AI processing for a story (chapter segmentation + translation).
 */
exports.processStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    // Check if job already exists
    const existingJob = await Job.findOne({ contentId: story._id, status: { $in: ['pending', 'processing'] } });
    if (existingJob) {
      return res.status(400).json({ message: 'A processing job is already active for this story' });
    }

    await Job.create({
      type: 'all',
      contentId: story._id,
      contentType: 'Story',
      status: 'pending'
    });

    res.json({ message: 'AI processing job queued successfully', id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
