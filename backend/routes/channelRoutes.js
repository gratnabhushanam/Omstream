const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/channels
// @desc    Get all active channels
// @access  Public
router.get('/', async (req, res) => {
  try {
    const channels = await Channel.find().sort('-createdAt');
    res.json(channels);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/channels/admin
// @desc    Get all channels for admin (including inactive)
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
  try {
    const channels = await Channel.find().sort('-createdAt');
    res.json(channels);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/channels
// @desc    Create a new channel
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, description, category, thumbnail, streamUrl, isLive } = req.body;
    
    if (!title || !streamUrl) {
      return res.status(400).json({ message: 'Title and Stream URL are required' });
    }

    const channel = await Channel.create({
      title,
      description,
      category,
      thumbnail: thumbnail || '/krishna_arjuna_banner.png',
      streamUrl,
      isLive: isLive !== undefined ? isLive : true
    });

    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/channels/:id
// @desc    Update a channel
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const channel = await Channel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    res.json(channel);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   DELETE /api/channels/:id
// @desc    Delete a channel
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const channel = await Channel.findByIdAndDelete(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
