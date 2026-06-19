const { Song } = require('../models');
const { broadcastEvent } = require('../services/socketService');

exports.getAllSongs = async (req, res) => {
  try {
    const filter = { status: 'published' };
    const songs = await Song.find(filter).lean().sort({ createdAt: -1 }).limit(500);
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllSongsAdmin = async (req, res) => {
  try {
    const songs = await Song.find({}).lean().sort({ createdAt: -1 }).limit(1000);
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addSong = async (req, res) => {
  try {
    const song = new Song(req.body);
    await song.save();
    broadcastEvent('content_updated', { type: 'songs' });
    res.status(201).json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateSong = async (req, res) => {
  try {
    const song = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!song) return res.status(404).json({ message: 'Song not found' });
    broadcastEvent('content_updated', { type: 'songs' });
    res.json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSong = async (req, res) => {
  try {
    await Song.findByIdAndDelete(req.params.id);
    broadcastEvent('content_updated', { type: 'songs' });
    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.autoCollectSongs = async (req, res) => {
  try {
    const { keyword, language, limit = 5 } = req.body;
    if (!keyword) return res.status(400).json({ message: 'Keyword is required' });
    
    const { searchYouTube } = require('../utils/youtubeSearch');
    const results = await searchYouTube(keyword, limit);
    
    const addedSongs = [];
    for (const result of results) {
      if (!result.title || !result.webpage_url) continue;
      
      // Check if song already exists
      const existing = await Song.findOne({ url: result.webpage_url });
      if (existing) continue;

      // Format duration (e.g., from 315 to "5:15")
      let durationStr = '0:00';
      if (result.duration) {
        const mins = Math.floor(result.duration / 60);
        const secs = result.duration % 60;
        durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      }

      const song = new Song({
        title: result.title,
        artist: result.uploader || 'YouTube Artist',
        url: result.webpage_url,
        cover: result.thumbnail || 'https://images.unsplash.com/photo-1588665045050-a9474dd7e2ba?auto=format&fit=crop&w=500&q=80',
        duration: durationStr,
        language: language || 'telugu',
        status: 'published'
      });
      await song.save();
      addedSongs.push(song);
    }

    res.status(200).json({ message: `Successfully auto-collected ${addedSongs.length} songs`, songs: addedSongs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleLikedSong = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const songId = req.params.id;
    const index = user.likedSongs.indexOf(songId);

    if (index > -1) {
      user.likedSongs.splice(index, 1);
    } else {
      user.likedSongs.push(songId);
    }

    await user.save();
    res.json({ message: 'Liked songs updated', likedSongs: user.likedSongs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
