const Notification = require('../models/Notification');
const User = require('../models/User');

const normalizeNotificationForClient = (item = {}) => {
  const raw = typeof item.toObject === 'function' ? item.toObject() : item;
  const type = String(raw.type || 'system');
  const fallbackTitle = type === 'promo' ? 'Special Offer' : type === 'content' ? 'New Content' : 'Notification';
  const normalizedBody = String(raw.body || raw.message || raw.text || '').trim();

  return {
    ...raw,
    type,
    title: String(raw.title || fallbackTitle),
    body: normalizedBody || 'You have a new update from Gita Wisdom.',
    message: normalizedBody || 'You have a new update from Gita Wisdom.',
    isRead: Boolean(raw.isRead || raw.read),
    read: Boolean(raw.read || raw.isRead),
  };
};

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = String(req.user.id);
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1, _id: -1 }).limit(100);
    res.json(notifications.map(normalizeNotificationForClient));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const userId = String(req.user.id);
    await Notification.updateOne({ _id: req.params.id, userId }, { $set: { isRead: true, read: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const userId = String(req.user.id);
    await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true, read: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.subscribeToPush = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    
    if (!user.pushSubscriptions) user.pushSubscriptions = [];
    const exists = user.pushSubscriptions.find(s => s.endpoint === req.body.subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push(req.body.subscription);
      await user.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.broadcastNotification = async (req, res) => {
  try {
    const { title, body, type } = req.body;
    const safeTitle = String(title || '').trim() || 'Gita Wisdom Update';
    const safeBody = String(body || '').trim() || 'You have a new update from Gita Wisdom.';
    const safeType = String(type || 'system').trim() || 'system';
    const { sendPush } = require('../utils/notificationService');
    const users = await User.find({}, { _id: 1, email: 1, settings: 1, pushSubscriptions: 1 }).lean();

    // 1. Bulk insert in-app notifications
    const notificationsToInsert = users.map(user => ({
      userId: String(user._id),
      type: safeType,
      title: safeTitle,
      body: safeBody,
      message: safeBody,
      isRead: false
    }));
    
    if (notificationsToInsert.length > 0) {
      await Notification.insertMany(notificationsToInsert, { ordered: false });
    }

    // 2. Fire and forget push notifications
    const pushPromises = [];
    for (const user of users) {
      if (user.settings?.notifications && user.pushSubscriptions?.length) {
        for (const sub of user.pushSubscriptions) {
          pushPromises.push(sendPush({ subscription: sub, title: safeTitle, body: safeBody }).catch(e => {}));
        }
      }
    }
    Promise.allSettled(pushPromises); // Background execution

    res.json({ success: true, message: 'Broadcast initiated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
