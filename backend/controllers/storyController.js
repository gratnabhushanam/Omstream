const { Story, Job } = require('../models');
const mongoose = require('mongoose');
const { mapStory } = require('../utils/responseMappers');
const jwt = require('jsonwebtoken');
const authController = require('./authController');

/**
 * GET /api/stories
 * Returns all published stories, sorted newest first.
 */
exports.getStories = async (req, res) => {
  try {
    if (req.query.parentFolderId) {
      const stories = await Story.find({ parentFolderId: req.query.parentFolderId, status: 'published' }).lean().sort({ createdAt: -1 });
      return res.json(stories.map(mapStory));
    }

    const isAdminFetch = req.query.all === 'true';
    // For admin: show ALL stories that are folders (isFolder=true) or where isFolder was never
    // explicitly set to false (catches stories uploaded before the migration was fixed).
    // For public: only published folders.
    const filter = isAdminFetch
      ? { isFolder: { $ne: false } }
      : { status: 'published', isFolder: true, aiOnly: { $ne: true } };

    const folders = await Story.find(filter).lean().sort({ createdAt: -1 }).limit(200);

    const foldersWithChapters = folders.map(story => {
      const plain = story.toObject ? story.toObject() : story;
      plain.chapters = [];
      return plain;
    });
    
    if (folders.length > 0) {
      const folderTitles = folders.map(f => f.title);
      // Admin sees ALL chapters (draft/published); public only sees published chapters
      const chapterFilter = isAdminFetch
        ? { parentFolderId: { $in: folderTitles } }
        : { parentFolderId: { $in: folderTitles }, status: 'published', aiOnly: { $ne: true } };

      const allSubStories = await Story.find(chapterFilter)
        .lean().sort({ sequence: 1, createdAt: 1 }).limit(1000);
      
      const subStoriesByFolder = {};
      for (const sub of allSubStories) {
        if (!subStoriesByFolder[sub.parentFolderId]) {
          subStoriesByFolder[sub.parentFolderId] = [];
        }
        subStoriesByFolder[sub.parentFolderId].push({
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
        });
      }
      
      foldersWithChapters.forEach(story => {
        if (subStoriesByFolder[story.title]) {
          story.chapters = subStoriesByFolder[story.title];
        }
      });
    }

    return res.json(foldersWithChapters.map(mapStory));
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
      aiOnly: { $ne: true },
      $or: [
        { isKids: true },
        { tags: { $regex: 'kids', $options: 'i' } },
        { category: { $regex: 'kids', $options: 'i' } }
      ]
    }).lean().sort({ viewCount: -1 }).limit(200);

    const foldersWithChapters = folders.map(story => {
      const plain = story.toObject ? story.toObject() : story;
      plain.chapters = [];
      return plain;
    });
    
    if (folders.length > 0) {
      const folderTitles = folders.map(f => f.title);
      const allSubStories = await Story.find({ 
        parentFolderId: { $in: folderTitles }, 
        status: 'published',
        aiOnly: { $ne: true }
      }).lean().sort({ sequence: 1, createdAt: 1 }).limit(1000);
      
      const subStoriesByFolder = {};
      for (const sub of allSubStories) {
        if (!subStoriesByFolder[sub.parentFolderId]) {
          subStoriesByFolder[sub.parentFolderId] = [];
        }
        subStoriesByFolder[sub.parentFolderId].push({
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
        });
      }
      
      foldersWithChapters.forEach(story => {
        if (subStoriesByFolder[story.title]) {
          story.chapters = subStoriesByFolder[story.title];
        }
      });
    }

    res.json(foldersWithChapters.map(mapStory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/chapters
 * Returns all published story chapters as a flat list for mobile/web chapter browsing.
 */
exports.getChapters = async (req, res) => {
  try {
    const baseFilter = {
      status: 'published',
      aiOnly: { $ne: true },
      parentFolderId: { $exists: true, $ne: '' }
    };

    if (req.query.category) {
      baseFilter.category = { $regex: req.query.category, $options: 'i' };
    }

    const chapterDocs = await Story.find(baseFilter)
      .lean()
      .sort({ sequence: 1, createdAt: 1 })
      .limit(1000);

    const embeddedFolderFilter = {
      status: 'published',
      isFolder: true,
      'chapters.0': { $exists: true }
    };

    if (req.query.category) {
      embeddedFolderFilter.category = { $regex: req.query.category, $options: 'i' };
    }

    const folderDocs = await Story.find(embeddedFolderFilter).lean().limit(200);

    const chapterMap = new Map();

    const addChapter = (chapter) => {
      const key = `${chapter.parentFolderId || chapter.parentFolder || ''}||${chapter.title || ''}`;
      if (!chapterMap.has(key)) {
        chapterMap.set(key, chapter);
      }
    };

    chapterDocs.forEach((story, index) => {
      addChapter({
        id: story._id || story.id,
        _id: story._id || story.id,
        title: story.title,
        description: story.description || story.summary || (story.content || '').slice(0, 240),
        content: story.content || '',
        chapterNumber: story.sequence || index + 1,
        sequence: story.sequence || index + 1,
        thumbnail: story.thumbnail || '',
        audioUrl: story.audioUrl || '',
        duration: story.duration || 0,
        category: story.category || '',
        tags: story.tags || [],
        parentFolder: story.parentFolder || story.parentFolderId || '',
        parentFolderId: story.parentFolderId || '',
        translations: story.translations || {},
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
      });
    });

    folderDocs.forEach((folder) => {
      const chapters = Array.isArray(folder.chapters) ? folder.chapters : [];
      chapters.forEach((chapter, index) => {
        addChapter({
          id: chapter._id || `${folder._id || folder.id}-${index}`,
          _id: chapter._id || `${folder._id || folder.id}-${index}`,
          title: chapter.title || `Chapter ${index + 1}`,
          description: chapter.summary || chapter.description || (chapter.content || '').slice(0, 240),
          content: chapter.content || '',
          chapterNumber: chapter.sequence || index + 1,
          sequence: chapter.sequence || index + 1,
          thumbnail: chapter.thumbnail || folder.thumbnail || '',
          audioUrl: chapter.audioUrl || '',
          duration: chapter.duration || 0,
          category: folder.category || '',
          tags: folder.tags || [],
          parentFolder: folder.title || folder.parentFolder || '',
          parentFolderId: folder.title || folder.parentFolderId || '',
          translations: chapter.translations || {},
          createdAt: chapter.createdAt || folder.createdAt,
          updatedAt: chapter.updatedAt || folder.updatedAt,
        });
      });
    });

    const chapters = Array.from(chapterMap.values())
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0) || new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

    return res.json(chapters);
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

    // If this story is marked AI-only, try to authenticate optionally and allow admins to view
    if (story.aiOnly) {
      let user = null;
      try {
        const authHeader = String(req.headers.authorization || '');
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          const secret = String(process.env.JWT_SECRET || 'gita_wisdom_super_secret_key').trim();
          const decoded = jwt.verify(token, secret);
          if (decoded && decoded.id) {
            user = await authController.getUserByIdForAuth(decoded.id);
          }
        }
      } catch (err) {
        // ignore token errors — proceed as unauthenticated
      }

      if (!(user && user.role === 'admin')) {
        return res.status(404).json({ message: 'Story not found' });
      }
    }

    if (story.isFolder) {
      const subStories = await Story.find({ parentFolderId: story.title, status: 'published' }).lean().sort({ sequence: 1, createdAt: 1 });
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
    const subStories = await Story.find({ parentFolderId: story.title }).lean().sort({ sequence: 1, createdAt: 1 });
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

    // If any watchlist entries are AI-only, filter them out for non-admin users
    const isAdmin = req.user && req.user.role === 'admin';
    const stories = Array.isArray(user.storyWatchlist) ? user.storyWatchlist : [];
    const filtered = stories.filter(s => {
      try {
        if (!s) return false;
        if (isAdmin) return true;
        return !s.aiOnly;
      } catch (e) {
        return false;
      }
    }).map(mapStory);

    res.json(filtered);
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
