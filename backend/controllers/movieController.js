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
    const profileId = req.headers['x-profile-id'];
    
    let targetList;
    if (profileId) {
      const profile = user.profiles?.id(profileId);
      if (!profile) return res.status(404).json({ message: 'Profile not found' });
      targetList = profile.favorites || [];
    } else {
      if (!user.watchlist) user.watchlist = [];
      targetList = user.watchlist;
    }
    
    const isSaved = targetList.includes(movieId);
    
    if (isSaved) {
      if (profileId) {
        user.profiles.id(profileId).favorites = targetList.filter(id => String(id) !== String(movieId));
      } else {
        user.watchlist = targetList.filter(id => String(id) !== String(movieId));
      }
    } else {
      if (profileId) {
        user.profiles.id(profileId).favorites.push(movieId);
      } else {
        user.watchlist.push(movieId);
      }
    }
    
    if (profileId) user.markModified('profiles');
    await user.save();
    
    const newList = profileId ? user.profiles.id(profileId).favorites : user.watchlist;
    res.json({ isSaved: !isSaved, watchlist: newList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWatchlist = async (req, res) => {
  try {
    const { User, Movie } = require('../models');
    const user = await User.findById(req.user.id).populate('watchlist');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const profileId = req.headers['x-profile-id'];
    if (profileId) {
      const profile = user.profiles?.id(profileId);
      if (profile && profile.favorites && profile.favorites.length > 0) {
        const movies = await Movie.find({ _id: { $in: profile.favorites } });
        return res.json(movies.map(mapMovie));
      }
      return res.json([]);
    }
    
    return res.json(user.watchlist.map(mapMovie));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const { User, Movie } = require('../models');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const profileId = req.headers['x-profile-id'];
    let historyIds = [];
    let favoriteIds = [];
    
    if (profileId) {
      const profile = user.profiles?.id(profileId);
      if (profile) {
        historyIds = profile.watchHistory.map(h => h.mediaId);
        favoriteIds = profile.favorites || [];
      }
    } else {
      favoriteIds = user.watchlist || [];
    }
    
    const interactedIds = [...new Set([...historyIds, ...favoriteIds])];
    
    let genres = new Set();
    if (interactedIds.length > 0) {
      const interactedMovies = await Movie.find({ _id: { $in: interactedIds } });
      interactedMovies.forEach(m => {
        if (m.genre) genres.add(m.genre);
      });
    }
    
    let recommendations = [];
    if (genres.size > 0) {
      recommendations = await Movie.find({ 
        genre: { $in: Array.from(genres) },
        _id: { $nin: historyIds }
      }).sort({ views: -1 }).limit(10);
    }
    
    // Fallback if not enough recommendations
    if (recommendations.length < 5) {
      const existingIds = recommendations.map(m => String(m._id)).concat(historyIds);
      const popular = await Movie.find({
        _id: { $nin: existingIds }
      }).sort({ views: -1 }).limit(10 - recommendations.length);
      recommendations = [...recommendations, ...popular];
    }
    
    return res.json(recommendations.map(mapMovie));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
