const express = require('express');
const router = express.Router();
const {
  getCommunities,
  createCommunity,
  updateCommunity,
  deleteCommunity
} = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(getCommunities)
  .post(protect, createCommunity);

router.route('/:id')
  .put(protect, updateCommunity)
  .delete(protect, deleteCommunity);

module.exports = router;
