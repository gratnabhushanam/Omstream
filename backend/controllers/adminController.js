const cloudinary = require('cloudinary').v2;
const { Video } = require('../models');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.uploadVideoToCloudinary = async (req, res) => {
  try {
    const { title, description, module, category, chapter, language, trailerUrl, collectionTitle, isComingSoon } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file' });

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video',
      folder: 'gita-wisdom-reels',
      eager: [{ streaming_profile: 'hd', format: 'm3u8' }],
      eager_async: true,
    });

    fs.unlink(req.file.path, () => {});

    const hlsUrl = result.playback_url || result.secure_url.replace(/\.[^/.]+$/, '.m3u8');

    const newVideo = await Video.create({
      title,
      description,
      videoUrl: result.secure_url,
      hlsUrl,
      thumbnail: result.secure_url.replace(/\.[^/.]+$/, '.jpg'),
      trailerUrl: trailerUrl || '',
      isComingSoon: isComingSoon === 'true' || isComingSoon === true,
      collectionTitle: collectionTitle || 'Bhagavad Gita',
      category: category || 'reels',
      module: module || 'divine',
      chapter: chapter ? Number(chapter) : undefined,
      language: language || 'telugu',
      duration: result.duration,
      uploadedBy: req.user.id,
    });

    // Queue AI processing for metadata translation, subtitles, and quizzes
    const { Job } = require('../models');
    await Job.create({
      type: 'all',
      contentId: newVideo._id,
      contentType: 'Video',
      status: 'pending'
    });

    res.status(201).json({ video: newVideo });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
