// backend/routes/adminNotificationRoutes.js
const express = require('express');
const router = express.Router();
const { broadcastNotification, getAdminBroadcastNotifications, deleteAdminBroadcastNotification } = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, getAdminBroadcastNotifications);

// Broadcast a notification (Admin only)
router.post('/broadcast', protect, admin, broadcastNotification);

router.delete('/:id', protect, admin, deleteAdminBroadcastNotification);

module.exports = router;
