const { Group, Post, User } = require('../models');

exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const newGroup = await Group.create({ name, description, category, createdBy: String(req.user.id) });
    res.status(201).json(newGroup);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'admin' && String(group.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await group.deleteOne();
    await Post.deleteMany({ groupId: req.params.groupId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getPostsByGroup = async (req, res) => {
  try {
    const posts = await Post.find({ groupId: req.params.groupId }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createPost = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const newPost = await Post.create({
      groupId: req.params.groupId,
      content: req.body.content,
      authorId: String(user._id),
      authorName: user.name,
      authorImage: user.profilePicture
    });
    res.status(201).json(newPost);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Not found' });
    if (String(post.authorId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await post.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    const userId = String(req.user.id);
    if (post.likes.includes(userId)) post.likes = post.likes.filter(id => id !== userId);
    else post.likes.push(userId);
    await post.save();
    res.json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.commentOnPost = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const post = await Post.findById(req.params.postId);
    post.comments.push({ text: req.body.text, authorId: String(user._id), authorName: user.name, authorImage: user.profilePicture });
    await post.save();
    res.json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deletePostComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    const commentIndex = post.comments.findIndex(c => String(c._id) === String(req.params.commentId));
    if (commentIndex === -1) return res.status(404).json({ message: 'Not found' });
    const comment = post.comments[commentIndex];
    if (String(comment.authorId) !== String(req.user.id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    post.comments.splice(commentIndex, 1);
    await post.save();
    res.json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
