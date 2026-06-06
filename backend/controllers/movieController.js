const { Movie } = require('../models');
const mongoose = require('mongoose');
const { mapMovie } = require('../utils/responseMappers');

exports.getMovies = async (req, res) => {
  try {
    const movies = await Movie.find({}).lean().sort({ views: -1, releaseYear: -1, createdAt: -1 }).limit(500);
    return res.json(movies.map(mapMovie));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addMovie = async (req, res) => {
  try {
    const { Job } = require('../models');
    const newMovie = await Movie.create(req.body);
    
    // Queue AI processing
    await Job.create({
      type: 'all',
      contentId: newMovie._id,
      contentType: 'Movie',
      status: 'pending'
    });

    return res.status(201).json(mapMovie(newMovie));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteMovie = async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted', id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) return res.status(404).json({ message: 'Not found' });
    return res.json(mapMovie(movie));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.toggleWatchlist = async (req, res) => {
  try {
    const { User } = require('../models');
    const user = await User.findById(req.user.id);
    const movieId = req.params.id;
    
    if (!user.watchlist) user.watchlist = [];
    const isSaved = user.watchlist.includes(movieId);
    
    if (isSaved) {
      user.watchlist = user.watchlist.filter(id => String(id) !== String(movieId));
    } else {
      user.watchlist.push(movieId);
    }
    
    await user.save();
    res.json({ isSaved: !isSaved, watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWatchlist = async (req, res) => {
  try {
    const { User } = require('../models');
    const user = await User.findById(req.user.id).populate('watchlist');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    return res.json(user.watchlist.map(mapMovie));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
