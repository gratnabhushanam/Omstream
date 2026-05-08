const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['like', 'comment', 'system', 'admin', 'promo', 'content', 'custom'], required: true },
  title: { type: String, required: true },
  message: { type: String },
  body: { type: String }, // Alias for message
  link: { type: String, default: '' },
  data: { type: Object, default: {} }, // Alias for metadata/link data
  isRead: { type: Boolean, default: false },
  read: { type: Boolean, default: false }, // Alias for isRead
  metadata: { type: Object, default: {} },
}, {
  timestamps: true,
  collection: 'notifications',
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
