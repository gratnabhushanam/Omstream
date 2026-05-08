const { Video, User } = require('../models');
const mongoose = require('mongoose');
const { mapVideo } = require('../utils/responseMappers');
const fs = require('fs');
const { getVideoDurationSeconds } = require('../utils/videoMetadata');
const path = require('path');
const jwt = require('jsonwebtoken');

const sameUserId = (id1, id2) => String(id1 || '') === String(id2 || '');

exports.grantStreamingToken = async (req, res) => {
  try {
    const videoId = req.query.videoId || 'anonymous_stream';
    const token = jwt.sign(
      { license: 'streaming_license', videoId },
      process.env.JWT_SECRET || 'dev_secret_fallback',
      { expiresIn: '6h' }
    );
    return res.status(200).json({ token, message: 'DRM License Granted' });
  } catch (error) {
    return res.status(500).json({ message: 'Error generating media license' });
  }
};

exports.addVideo = async (req, res) => {
  try {
    const { title, description, videoUrl, hlsUrl, category, collectionTitle, isKids, tags } = req.body;
    if (!title || !videoUrl) return res.status(400).json({ message: 'Title and videoUrl are required' });

    const newVideo = await Video.create({
      title,
      description: description || '',
      videoUrl,
      hlsUrl: hlsUrl || null,
      category: category || 'reels',
      collectionTitle: collectionTitle || 'Bhagavad Gita',
      isKids: isKids || false,
      tags: Array.isArray(tags) ? tags : [],
      isUserReel: false,
      moderationStatus: 'approved',
      contentType: 'spiritual',
      uploadedBy: req.user.id,
    });

    return res.status(201).json(mapVideo(newVideo));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getReels = async (req, res) => {
  try {
    const reels = await Video.find({
      isUserReel: { $ne: true },
      category: 'reels',
      moderationStatus: 'approved',
    }).sort({ createdAt: -1 });
    res.json(reels.map(mapVideo));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getKidsVideos = async (req, res) => {
  try {
    const kidsVideos = await Video.find({
      isKids: true,
      moderationStatus: 'approved',
    }).sort({ createdAt: -1 });
    res.json(kidsVideos.map(mapVideo));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find({
      isUserReel: { $ne: true },
      moderationStatus: 'approved',
    }).sort({ createdAt: -1 });
    res.json(videos.map(mapVideo));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyReels = async (req, res) => {
  try {
    const reels = await Video.find({ 
      isUserReel: true, 
      uploadedBy: String(req.user.id) 
    }).sort({ createdAt: -1 });
    return res.json(reels.map(mapVideo));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getUserReelModerationQueue = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const reels = await Video.find({ isUserReel: true, moderationStatus: status })
      .populate('uploadedBy', 'name email role _id')
      .sort({ createdAt: -1 });
    return res.json(reels.map(mapVideo));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.moderateUserReel = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const reel = await Video.findOne({ _id: id, isUserReel: true });
    if (!reel) return res.status(404).json({ message: 'User reel not found' });

    reel.moderationStatus = status;
    reel.moderationNote = note || '';
    reel.reviewedBy = req.user.id;
    await reel.save();
    
    return res.json(mapVideo(reel));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteMyReel = async (req, res) => {
  try {
    const { id } = req.params;
    const reel = await Video.findOne({ _id: id, isUserReel: true });
    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    
    if (!sameUserId(reel.uploadedBy, req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }
    
    await reel.deleteOne();
    return res.json({ message: 'Deleted', id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.toggleUserReelLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = String(req.user.id);
    const reel = await Video.findOne({ _id: id, isUserReel: true });
    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    
    const likedBy = Array.isArray(reel.likedBy) ? reel.likedBy : [];
    const hasLiked = likedBy.includes(userId);
    
    if (hasLiked) {
      reel.likedBy = likedBy.filter(uid => uid !== userId);
    } else {
      reel.likedBy.push(userId);
    }

    reel.likesCount = reel.likedBy.length;
    await reel.save();
    return res.json({ liked: !hasLiked, reel: mapVideo(reel) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.addUserReelComment = async (req, res) => {
  try {
    const { id } = req.params;
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Text required' });

    const reel = await Video.findOne({ _id: id, isUserReel: true });
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    const comment = {
      id: Date.now(),
      userId: req.user.id,
      userName: req.user.name || 'Seeker',
      text,
      createdAt: new Date()
    };
    
    reel.comments.push(comment);
    reel.commentsCount = reel.comments.length;
    await reel.save();
    return res.status(201).json(mapVideo(reel));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted', id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getUserReels = async (req, res) => {
  try {
    const reels = await Video.find({ isUserReel: true, moderationStatus: 'approved' }).sort({ createdAt: -1 });
    res.json(reels.map(mapVideo));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleSaveReel = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.savedReels) user.savedReels = [];
    
    const reelId = req.params.id;
    const isSaved = user.savedReels.includes(reelId);
    
    if (isSaved) user.savedReels = user.savedReels.filter(id => id !== reelId);
    else user.savedReels.push(reelId);
    
    await user.save();
    
    const reel = await Video.findById(reelId);
    if (reel) {
      if (!reel.savedBy) reel.savedBy = [];
      if (!isSaved) reel.savedBy.push(String(req.user.id));
      else reel.savedBy = reel.savedBy.filter(id => id !== String(req.user.id));
      await reel.save();
    }
    
    res.json({ isSaved: !isSaved, savedReels: user.savedReels });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getSavedReels = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const reels = await Video.find({
      _id: { $in: user.savedReels || [] },
      moderationStatus: 'approved'
    }).sort({ createdAt: -1 });
    
    res.json(reels.map(mapVideo));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.uploadUserReel = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Video file required' });

    const host = req.get('host');
    const protocol = req.protocol;
    const videoUrl = `${protocol}://${host}/uploads/reels/${req.file.filename}`;
    const reel = await Video.create({
      title: title || 'My Reel',
      description: description || '',
      videoUrl,
      isUserReel: true,
      uploadedBy: req.user.id,
      moderationStatus: 'pending'
    });
    res.status(201).json(mapVideo(reel));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.shareUserReel = async (req, res) => {
  try {
    const reel = await Video.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    reel.sharesCount = (reel.sharesCount || 0) + 1;
    await reel.save();
    res.json({ shares: reel.sharesCount });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteUserReelComment = async (req, res) => {
  try {
    const reel = await Video.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    reel.comments = reel.comments.filter(c => String(c._id) !== String(req.params.commentId));
    reel.commentsCount = reel.comments.length;
    await reel.save();
    res.json(mapVideo(reel));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateMyReel = async (req, res) => {
  try {
    const reel = await Video.findOne({ _id: req.params.id, uploadedBy: req.user.id });
    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    Object.assign(reel, req.body);
    await reel.save();
    res.json(mapVideo(reel));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(mapVideo(video));
  } catch (error) { res.status(500).json({ message: error.message }); }
};
