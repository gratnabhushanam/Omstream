const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', storyController.getStories);
router.get('/kids', storyController.getKidsStories);
router.get('/:id', storyController.getStoryById);

// Admin-protected routes
router.post('/', protect, admin, storyController.addStory);
router.put('/:id', protect, admin, storyController.updateStory);
router.patch('/:id', protect, admin, storyController.updateStory);
router.delete('/:id', protect, admin, storyController.deleteStory);

// AI processing & publishing
router.post('/:id/publish', protect, admin, storyController.publishStory);
router.post('/:id/process', protect, admin, storyController.processStory);

module.exports = router;
