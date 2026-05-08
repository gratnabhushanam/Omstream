const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  groupId: { type: String, required: true },
  content: { type: String, required: true, trim: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorImage: { type: String, default: null },
  likes: { type: [String], default: [] },
  comments: [{
    text: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorImage: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  }]
}, {
  timestamps: true,
  collection: 'satsang_posts',
});

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);
