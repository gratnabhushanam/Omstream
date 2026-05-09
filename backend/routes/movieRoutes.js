const express = require('express');
const router = express.Router();
const { getMovies, addMovie, deleteMovie, updateMovie, toggleWatchlist, getWatchlist } = require('../controllers/movieController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getMovies);
router.post('/', protect, admin, addMovie);
router.patch('/:id', protect, admin, updateMovie);
router.delete('/:id', protect, admin, deleteMovie);

router.post('/:id/toggle-watchlist', protect, toggleWatchlist);
router.get('/watchlist', protect, getWatchlist);

module.exports = router;
