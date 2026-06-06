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

module.exports = router;
