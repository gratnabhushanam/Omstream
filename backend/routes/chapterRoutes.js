const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');

// Public chapters endpoint used by the mobile/web client.
router.get('/', storyController.getChapters);
router.get('/:id', storyController.getStoryById);

module.exports = router;
