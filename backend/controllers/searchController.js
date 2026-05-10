const { Sloka, Story, Video, Movie } = require('../models');
const mongoose = require('mongoose');
const { mapSloka, mapStory, mapVideo, mapMovie } = require('../utils/responseMappers');

const mongoRegex = (value) => new RegExp(String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

const separateVideos = (allVideos) => {
  const normalVideos = [];
  const reels = [];
  for (const v of allVideos) {
    if (v.isUserReel && v.moderationStatus && v.moderationStatus !== 'approved') continue;
    
    const isUserReel = Boolean(v?.isUserReel);
    const category = String(v?.category || '').trim().toLowerCase();
    
    if (isUserReel || category === 'reels') {
      reels.push(mapVideo(v));
    } else {
      normalVideos.push(mapVideo(v));
    }
  }
  return { videos: normalVideos, reels };
};

exports.searchAll = async (req, res) => {
  try {
    const { q, lang = 'en' } = req.query;
    const normalizedQuery = String(q || '').trim();
    const langCode = String(lang).substring(0, 2).toLowerCase();

    if (!normalizedQuery) {
      const [slokas, stories, videos, movies] = await Promise.all([
        Sloka.find({}),
        Story.find({}),
        Video.find({ isUserReel: { $ne: true } }),
        Movie.find({}),
      ]);

      const separated = separateVideos(videos);

      return res.json({
        slokas: slokas.map(mapSloka),
        stories: stories.map(mapStory),
        videos: separated.videos,
        reels: separated.reels,
        movies: movies.map(mapMovie),
      });
    }

    const qRegex = mongoRegex(normalizedQuery);
    
    // Optimized Multilingual Search using Text Indexes & Indexed Lookups
    const [slokas, stories, videos, movies] = await Promise.all([
      Sloka.find({
        $or: [
          { $text: { $search: normalizedQuery } },
          { sanskrit: qRegex }, // Sanskrit still needs regex if not in text index
          { [`translations.${langCode}.meaning`]: qRegex }
        ],
      }).limit(20).lean(),
      Story.find({
        $or: [
          { $text: { $search: normalizedQuery } },
          { tags: qRegex }
        ],
      }).limit(20).lean(),
      Video.find({
        $or: [
          { $text: { $search: normalizedQuery } },
          { tags: qRegex }
        ],
      }).limit(30).lean(),
      Movie.find({
        $or: [
          { $text: { $search: normalizedQuery } },
          { tags: qRegex }
        ],
      }).limit(20).lean(),
    ]);

    const separated = separateVideos(videos);

    return res.json({
      slokas: slokas.map(mapSloka),
      stories: stories.map(mapStory),
      videos: separated.videos,
      reels: separated.reels,
      movies: movies.map(mapMovie),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
