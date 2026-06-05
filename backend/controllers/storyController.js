const { Story, Job } = require('../models');
const mongoose = require('mongoose');
const { mapStory } = require('../utils/responseMappers');

/**
 * GET /api/stories
 * Returns all published stories, sorted newest first.
 */
exports.getStories = async (req, res) => {
  try {
    if (req.query.parentFolderId) {
      const stories = await Story.find({ parentFolderId: req.query.parentFolderId, status: 'published' }).sort({ createdAt: -1 });
      return res.json(stories.map(mapStory));
    }

    const filter = req.query.all === 'true' ? {} : { status: 'published' };
    filter.isFolder = true;
    const folders = await Story.find(filter).sort({ createdAt: -1 });

    const foldersWithChapters = await Promise.all(folders.map(async (story) => {
      const subStories = await Story.find({ parentFolderId: story.title, status: 'published' }).sort({ sequence: 1, createdAt: 1 });
      
      const chaptersList = subStories.map(sub => ({
        _id: sub._id,
        id: sub._id,
        title: sub.title,
        content: sub.content || '',
        description: sub.description || '',
        summary: sub.description || '',
        thumbnail: sub.thumbnail || '',
        audioUrl: sub.audioUrl || '',
        duration: sub.duration || 0,
        sequence: sub.sequence || 1,
        takeaways: sub.takeaways || [],
        translations: sub.translations || {}
      }));

      const plain = story.toObject ? story.toObject() : story;
      plain.chapters = chaptersList;
      return mapStory(plain);
    }));

    return res.json(foldersWithChapters);
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
    const folders = await Story.find({
      status: 'published',
      isFolder: true,
      $or: [
        { isKids: true },
        { tags: { $regex: 'kids', $options: 'i' } },
        { category: { $regex: 'kids', $options: 'i' } }
      ]
    }).sort({ viewCount: -1 });

    const foldersWithChapters = await Promise.all(folders.map(async (story) => {
      const subStories = await Story.find({ parentFolderId: story.title, status: 'published' }).sort({ sequence: 1, createdAt: 1 });
      
      const chaptersList = subStories.map(sub => ({
        _id: sub._id,
        id: sub._id,
        title: sub.title,
        content: sub.content || '',
        description: sub.description || '',
        summary: sub.description || '',
        thumbnail: sub.thumbnail || '',
        audioUrl: sub.audioUrl || '',
        duration: sub.duration || 0,
        sequence: sub.sequence || 1,
        takeaways: sub.takeaways || [],
        translations: sub.translations || {}
      }));

      const plain = story.toObject ? story.toObject() : story;
      plain.chapters = chaptersList;
      return mapStory(plain);
    }));

    res.json(foldersWithChapters);
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

    if (story.isFolder) {
      const subStories = await Story.find({ parentFolderId: story.title, status: 'published' }).sort({ sequence: 1, createdAt: 1 });
      const chaptersList = subStories.map(sub => ({
        _id: sub._id,
        id: sub._id,
        title: sub.title,
        content: sub.content || '',
        description: sub.description || '',
        summary: sub.description || '',
        thumbnail: sub.thumbnail || '',
        audioUrl: sub.audioUrl || '',
        duration: sub.duration || 0,
        sequence: sub.sequence || 1,
        takeaways: sub.takeaways || [],
        translations: sub.translations || {}
      }));

      const plain = story.toObject ? story.toObject() : story;
      plain.chapters = chaptersList;
      return res.json(mapStory(plain));
    }

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
    const storyId = new mongoose.Types.ObjectId();
    const payload = {
      _id: storyId,
      ...req.body,
      title: req.body.title || 'Untitled Story',
      seriesTitle: req.body.seriesTitle || req.body.category || 'General',
      status: req.body.status || 'draft',
      isFolder: true,
    };

    if (payload.chapters && Array.isArray(payload.chapters)) {
      console.log(`[UPLOAD] Adding new story folder "${payload.title}" (${storyId}) with ${payload.chapters.length} chapters.`);
      payload.chapters = payload.chapters.map((ch, idx) => {
        const folderId = storyId;
        const parentFolder = payload.title;
        console.log(`[UPLOAD] Assigning chapter ${idx + 1} "${ch.title}" -> folderId: ${folderId}, parentFolder: "${parentFolder}"`);
        return {
          ...ch,
          folderId,
          parentFolder
        };
      });
    }

    const newStory = await Story.create(payload);

    if (newStory.chapters && newStory.chapters.length > 0) {
      await syncChapters(newStory._id, newStory.chapters, newStory.title);
    }

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
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const originalTitle = story.title;
    
    // Apply updates from request body to the document
    Object.assign(story, req.body);

    if (story.chapters && Array.isArray(story.chapters)) {
      console.log(`[UPLOAD/UPDATE] Updating story folder "${story.title}" (${story._id}). Total chapters: ${story.chapters.length}`);
      story.chapters = story.chapters.map((ch, idx) => {
        const folderId = story._id;
        const parentFolder = story.title;
        console.log(`[UPLOAD/UPDATE] Chapter ${idx + 1} "${ch.title}" -> folderId: ${folderId}, parentFolder: "${parentFolder}"`);
        ch.folderId = folderId;
        ch.parentFolder = parentFolder;
        return ch;
      });
      story.markModified('chapters');
    }

    await story.save();

    if (story.chapters && Array.isArray(story.chapters)) {
      await syncChapters(story._id, story.chapters, story.title);
    }

    // Trigger AI re-processing if content changed
    if ((req.body.content || req.body.title) && story.status !== 'processing') {
       await Job.findOneAndUpdate(
         { contentId: story._id, status: 'pending' },
         { type: 'all', status: 'pending', contentType: 'Story' },
         { upsert: true, new: true }
       );
    }

    // Re-fetch the synced sub-chapters so the response matches what getStories returns
    const subStories = await Story.find({ parentFolderId: story.title }).sort({ sequence: 1, createdAt: 1 });
    const chaptersList = subStories.map(sub => ({
      _id: sub._id,
      id: sub._id,
      title: sub.title,
      content: sub.content || '',
      description: sub.description || '',
      summary: sub.description || '',
      thumbnail: sub.thumbnail || '',
      audioUrl: sub.audioUrl || '',
      duration: sub.duration || 0,
      sequence: sub.sequence || 1,
      takeaways: sub.takeaways || [],
      translations: sub.translations || {}
    }));
    const plain = story.toObject ? story.toObject() : story;
    plain.chapters = chaptersList;
    return res.json(mapStory(plain));
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

/**
 * POST /api/stories/:id/toggle-watchlist
 * Toggles a story in the user's personal story library (storyWatchlist).
 */
exports.toggleStoryWatchlist = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const storyId = req.params.id;
    const index = user.storyWatchlist.indexOf(storyId);

    if (index > -1) {
      user.storyWatchlist.splice(index, 1);
    } else {
      user.storyWatchlist.push(storyId);
    }

    await user.save();
    res.json({ message: 'Watchlist updated', storyWatchlist: user.storyWatchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/stories/watchlist/me
 * Returns all stories in the user's personal library.
 */
exports.getWatchlistStories = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).populate('storyWatchlist');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user.storyWatchlist.map(mapStory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/stories/:id/translate
 * Dynamically translates a story into a specific language and caches it.
 * Implements a robust retry mechanism (3 attempts) before failing.
 */
exports.translateStory = async (req, res) => {
  console.log('[DEBUG] translateStory called for ID:', req.params.id, 'Lang:', req.body.targetLang);
  const { targetLang } = req.body;
  if (!targetLang) return res.status(400).json({ message: 'Target language is required' });

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const story = await Story.findById(req.params.id);
      if (!story) return res.status(404).json({ message: 'Story not found' });

      // If already translated, return it
      if (story.translations && story.translations[targetLang]) {
        return res.json(story.translations[targetLang]);
      }

      const { translateMetadata } = require('../utils/aiService');
      console.log(`[Translation] Attempt ${attempts} for ${targetLang} story: ${story.title}`);
      
      const translations = await translateMetadata(story, 'Story', [targetLang]);

      if (translations && translations[targetLang]) {
        // Cache the translation
        if (!story.translations) story.translations = {};
        story.translations[targetLang] = translations[targetLang];
        story.markModified('translations');
        await story.save();

        console.log(`[Translation] Success for ${targetLang} on attempt ${attempts}`);
        return res.json(translations[targetLang]);
      }

      throw new Error('Empty translation response');
    } catch (error) {
      console.error(`[Translation] Error on attempt ${attempts}:`, error.message);
      if (attempts >= maxAttempts) {
        return res.status(500).json({ 
          message: 'Translation service exhausted all retries.', 
          error: error.message 
        });
      }
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
};

/**
 * Helper to synchronize chapters stored as nested subdocuments in a Story folder
 * with separate chapter documents in the Story collection.
 */
async function syncChapters(folderId, chapters, folderTitle) {
  if (!chapters || !Array.isArray(chapters)) return;

  const Story = mongoose.model('Story');
  // Find existing sub-chapters by folderId (ObjectId) or parentFolderId (title) for backward compat
  const existingChapters = await Story.find({
    $or: [
      { folderId: folderId },
      ...(folderTitle ? [{ parentFolderId: folderTitle }] : [])
    ]
  });
  const existingIds = existingChapters.map(ch => String(ch._id));

  const incomingIds = chapters.map(ch => ch._id || ch.id).filter(Boolean).map(String);

  const toDelete = existingIds.filter(id => !incomingIds.includes(id));
  if (toDelete.length > 0) {
    await Story.deleteMany({ _id: { $in: toDelete } });
  }

  for (const ch of chapters) {
    const chId = ch._id || ch.id;
    const chPayload = {
      title: ch.title,
      description: ch.summary || ch.description || '',
      content: ch.content || '',
      thumbnail: ch.image || ch.thumbnail || '',
      folderId: folderId,
      parentFolderId: folderTitle || ch.parentFolder || '',
      parentFolder: folderTitle || ch.parentFolder || '',
      sequence: ch.sequence,
      audioUrl: ch.audioUrl || '',
      takeaways: ch.takeaways || [],
      duration: ch.duration || 0,
      status: 'published',
      isFolder: false,
    };

    if (chId && existingIds.includes(String(chId))) {
      await Story.findByIdAndUpdate(chId, chPayload);
    } else {
      await Story.create(chPayload);
    }
  }
}
