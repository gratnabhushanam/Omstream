const { Movie } = require('../models');
const mongoose = require('mongoose');
const { mapMovie } = require('../utils/responseMappers');

exports.getMovies = async (req, res) => {
  try {
    const movies = await Movie.find({}).sort({ views: -1, releaseYear: -1, createdAt: -1 });
    return res.json(movies.map(mapMovie));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addMovie = async (req, res) => {
  try {
    const newMovie = await Movie.create(req.body);
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
