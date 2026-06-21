const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/playlists
// @desc    Get all featured playlists
// @access  Public
router.get('/', async (req, res) => {
  try {
    const playlists = await Playlist.find({ isFeatured: true })
      .populate('songs')
      .sort('-createdAt');
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/playlists/admin
// @desc    Get all playlists for admin
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
  try {
    const playlists = await Playlist.find()
      .populate('songs')
      .sort('-createdAt');
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/playlists
// @desc    Create a new playlist
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, description, coverImage, songs, isFeatured } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const playlist = await Playlist.create({
      title,
      description,
      coverImage: coverImage || '/default_playlist.png',
      songs: songs || [],
      isFeatured: isFeatured !== undefined ? isFeatured : true,
      createdBy: req.user._id
    });

    const populatedPlaylist = await Playlist.findById(playlist._id).populate('songs');
    res.status(201).json(populatedPlaylist);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/playlists/:id
// @desc    Update a playlist
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('songs');
    
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   DELETE /api/playlists/:id
// @desc    Delete a playlist
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
