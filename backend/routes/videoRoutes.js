const express = require('express');
const router = express.Router();
const {
	getVideos,
	addVideo,
	getKidsVideos,
	deleteVideo,
	grantStreamingToken,
	updateVideo,
	toggleLike,
	toggleSaveVideo,
	addComment,
} = require('../controllers/videoController');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadReelVideo } = require('../middleware/uploadMiddleware');
const resumableUploadMiddleware = require('../middleware/resumableUploadMiddleware');
const { handleResumableUpload, handleUrlUpload } = require('../controllers/resumableUploadController');
const { apiCache } = require('../utils/apiCache');

// Security Token Endpoint
router.get('/hls-token', grantStreamingToken);

// Resumable upload endpoint (for both admin/user uploads)
router.post('/upload/resumable', protect, resumableUploadMiddleware, handleResumableUpload);
router.post('/upload/url', protect, handleUrlUpload);

router.get('/', apiCache(30), getVideos);
router.get('/kids', apiCache(30), getKidsVideos);
router.post('/', protect, admin, addVideo);
router.patch('/:id', protect, admin, updateVideo);
router.delete('/:id', protect, admin, deleteVideo);

// Generic Video Interactions
router.post('/:id/like', protect, toggleLike);
router.post('/:id/save', protect, toggleSaveVideo);
router.post('/:id/comments', protect, addComment);

module.exports = router;
