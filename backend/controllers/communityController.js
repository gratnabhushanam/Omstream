const { Community, Post, User } = require('../models');

exports.getCommunities = async (req, res) => {
  try {
    const communities = await Community.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(communities);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createCommunity = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const newCommunity = await Community.create({ 
      name, 
      description, 
      category: category || 'General', 
      createdBy: req.user.id 
    });
    res.status(201).json(newCommunity);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    
    if (req.user.role !== 'admin' && String(community.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden: You can only edit your own communities' });
    }

    const { name, description } = req.body;
    if (name) community.name = name;
    if (description) community.description = description;

    await community.save();
    res.json(community);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    
    if (req.user.role !== 'admin' && String(community.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own communities' });
    }
    
    await community.deleteOne();
    // Delete associated posts
    await Post.deleteMany({ groupId: req.params.id });
    
    res.json({ message: 'Community deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
