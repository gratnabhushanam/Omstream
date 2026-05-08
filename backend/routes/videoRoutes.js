const express = require('express');
const router = express.Router();
const {
	getVideos,
	addVideo,
	getReels,
	getKidsVideos,
	uploadUserReel,
	getUserReels,
	getMyReels,
	getUserReelModerationQueue,
	moderateUserReel,
	toggleUserReelLike,
	shareUserReel,
	addUserReelComment,
	deleteUserReelComment,
	updateMyReel,
	deleteMyReel,
	deleteVideo,
	grantStreamingToken,
	toggleSaveReel,
	getSavedReels,
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
router.get('/reels', apiCache(30), getReels);
router.get('/kids', apiCache(30), getKidsVideos);
router.get('/user-reels', apiCache(30), getUserReels);
router.post('/user-reels', protect, uploadReelVideo.single('video'), uploadUserReel);
router.get('/user-reels/me', protect, getMyReels);
router.get('/user-reels/saved/:userId', protect, getSavedReels);
router.get('/user-reels/moderation', protect, admin, getUserReelModerationQueue);
router.patch('/user-reels/:id/moderate', protect, admin, moderateUserReel);
router.post('/user-reels/:id/like', protect, toggleUserReelLike);
router.post('/user-reels/:id/save', protect, toggleSaveReel);
router.post('/user-reels/:id/share', protect, shareUserReel);
router.post('/user-reels/:id/comments', protect, addUserReelComment);
router.delete('/user-reels/:id/comments/:commentId', protect, deleteUserReelComment);
router.patch('/user-reels/:id', protect, uploadReelVideo.single('video'), updateMyReel);
router.delete('/user-reels/:id', protect, deleteMyReel);
router.post('/', protect, admin, addVideo);
router.patch('/:id', protect, admin, updateVideo);
router.delete('/:id', protect, admin, deleteVideo);

// Generic Video Interactions
router.post('/:id/like', protect, toggleLike);
router.post('/:id/save', protect, toggleSaveVideo);
router.post('/:id/comments', protect, addComment);

module.exports = router;
