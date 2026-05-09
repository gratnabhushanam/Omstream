const { Story } = require('../models');
const mongoose = require('mongoose');
const { mapStory } = require('../utils/responseMappers');
const { translateMetadata, processStoryIntoChapters, generateQuizFromContent } = require('../utils/aiService');

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

    // Kick off background AI processing (non-blocking)
    if (req.body.autoProcess !== false && (newStory.content || newStory.chapters?.length)) {
      setImmediate(() => _runAiProcessing(newStory._id));
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

    // Re-run AI if content or title changed and not already processing
    if ((req.body.content || req.body.title) && story.status !== 'processing') {
      setImmediate(() => _runAiProcessing(story._id));
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
      setImmediate(() => _runAiProcessing(story._id));
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

    await Story.findByIdAndUpdate(req.params.id, { status: 'processing' });
    res.json({ message: 'AI processing started', id: req.params.id });

    // Run async after response
    setImmediate(() => _runAiProcessing(req.params.id));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Internal: runs AI chaptering + translation for a story.
 * Called asynchronously so it never blocks API responses.
 */
async function _runAiProcessing(storyId) {
  try {
    const story = await Story.findById(storyId);
    if (!story) return;

    await Story.findByIdAndUpdate(storyId, { status: 'processing' });

    const updates = { aiProcessed: true, status: 'published' };

    // 1. Auto-segment into chapters if we have raw content and no chapters yet
    if (story.content && (!story.chapters || story.chapters.length === 0)) {
      try {
        const chapters = await processStoryIntoChapters(story.content, story.title);
        if (chapters && chapters.length > 0) {
          updates.chapters = chapters;
          console.log(`[AI] Generated ${chapters.length} chapters for: ${story.title}`);
        }
      } catch (chapErr) {
        console.warn(`[AI] Chapter processing failed for ${story.title}:`, chapErr.message);
      }
    }

    // 2. Translate title + description into all supported languages
    try {
      const translations = await translateMetadata(story, 'Story');
      if (translations && Object.keys(translations).length > 0) {
        updates.translations = translations;
        console.log(`[AI] Translated story "${story.title}" into ${Object.keys(translations).length} languages`);
      }
    } catch (transErr) {
      console.warn(`[AI] Translation failed for ${story.title}:`, transErr.message);
    }

    await Story.findByIdAndUpdate(storyId, updates);
    console.log(`[AI] Processing complete for story: ${story.title}`);
  } catch (err) {
    console.error(`[AI] Background processing error for story ${storyId}:`, err.message);
    await Story.findByIdAndUpdate(storyId, { status: 'draft', aiProcessed: false }).catch(() => {});
  }
}
