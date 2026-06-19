const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

const upload = multer({ dest: 'uploads/temp/' });

// POST /api/admin/upload-video
router.post('/upload-video', protect, admin, upload.single('video'), adminController.uploadVideoToCloudinary);

// POST /api/admin/clear-cache
router.post('/clear-cache', protect, admin, adminController.clearApiCache);

// Admin preview for stories (allows viewing AI-only stories)
router.get('/stories/:id/preview', protect, admin, async (req, res) => {
	try {
		const Story = require('../models/Story');
		const { mapStory } = require('../utils/responseMappers');
		const story = await Story.findById(req.params.id);
		if (!story) return res.status(404).json({ message: 'Story not found' });
		return res.json(mapStory(story.toObject ? story.toObject() : story));
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

module.exports = router;
