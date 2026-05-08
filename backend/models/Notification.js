const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['like', 'comment', 'system', 'admin'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  metadata: { type: Object, default: {} },
}, {
  timestamps: true,
  collection: 'notifications',
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
