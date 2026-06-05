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

    // Empty query — return a small set of trending/featured content
    if (!normalizedQuery) {
      const [slokas, stories, videos, movies] = await Promise.all([
        Sloka.find({}).limit(10).lean(),
        Story.find({ isFolder: true }).limit(10).lean(),
        Video.find({ isUserReel: { $ne: true } }).limit(10).lean(),
        Movie.find({}).limit(10).lean(),
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
    
    // Use regex-based search across all relevant fields
    // ($text + $or causes issues in MongoDB — pure regex is more reliable)
    const [slokas, stories, videos, movies] = await Promise.all([
      Sloka.find({
        $or: [
          { sanskrit: qRegex },
          { englishMeaning: qRegex },
          { teluguMeaning: qRegex },
          { hindiMeaning: qRegex },
          { [`translations.${langCode}.meaning`]: qRegex },
          { tags: qRegex }
        ],
      }).limit(20).lean(),
      Story.find({
        $and: [
          { isFolder: true },
          {
            $or: [
              { title: qRegex },
              { description: qRegex },
              { seriesTitle: qRegex },
              { tags: qRegex }
            ]
          }
        ]
      }).limit(20).lean(),
      Video.find({
        $or: [
          { title: qRegex },
          { description: qRegex },
          { tags: qRegex }
        ],
      }).limit(30).lean(),
      Movie.find({
        $or: [
          { title: qRegex },
          { description: qRegex },
          { genre: qRegex },
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
    console.error('Search error:', error.message);
    res.status(500).json({ message: error.message });
  }
};
