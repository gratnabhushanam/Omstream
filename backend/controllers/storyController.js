const { Story } = require('../models');
const mongoose = require('mongoose');
const { mapStory } = require('../utils/responseMappers');

exports.getStories = async (req, res) => {
  try {
    const stories = await Story.find({}).sort({ createdAt: -1 });
    return res.json(stories.map(mapStory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addStory = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      title: req.body.title || 'Untitled Story',
      seriesTitle: req.body.seriesTitle || 'Bhagavad Gita',
    };
    const newStory = await Story.create(payload);
    return res.status(201).json(mapStory(newStory));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getKidsStories = async (req, res) => {
  try {
    const stories = await Story.find({ tags: { $regex: 'kids', $options: 'i' } });
    res.json(stories.map(mapStory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    await Story.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted', id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!story) return res.status(404).json({ message: 'Not found' });
    return res.json(mapStory(story));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
