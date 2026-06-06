const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', songController.getAllSongs);
router.post('/', protect, admin, songController.addSong);
router.delete('/:id', protect, admin, songController.deleteSong);

module.exports = router;
