const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env.local' });
dotenv.config({ path: '../.env' });

const { Song } = require('../models');
const { connectDB } = require('../config/db');

const initialSongs = [
  {
    title: 'Hare Krishna Maha Mantra',
    artist: 'Srila Prabhupada',
    url: 'https://www.youtube.com/watch?v=kR6Z8Q9f4eA',
    cover: 'https://images.unsplash.com/photo-1604502598377-50798e4d3db4?auto=format&fit=crop&w=500&q=80',
    duration: '10:00'
  },
  {
    title: 'Shri Hanuman Chalisa',
    artist: 'Hariharan / Gulshan Kumar',
    url: 'https://www.youtube.com/watch?v=AETFvQonfV8',
    cover: 'https://images.unsplash.com/photo-1598425257969-9c59f0f97905?auto=format&fit=crop&w=500&q=80',
    duration: '9:41'
  },
  {
    title: 'Om Namah Shivaya',
    artist: 'Krishna Das',
    url: 'https://www.youtube.com/watch?v=LqUo3E9i-0w',
    cover: 'https://images.unsplash.com/photo-1588665045050-a9474dd7e2ba?auto=format&fit=crop&w=500&q=80',
    duration: '7:55'
  },
  {
    title: 'Vishnu Sahasranamam',
    artist: 'M.S. Subbulakshmi',
    url: 'https://www.youtube.com/watch?v=yY1I7YqF92w',
    cover: 'https://images.unsplash.com/photo-1601614745800-47b2b67f132e?auto=format&fit=crop&w=500&q=80',
    duration: '29:08'
  },
  {
    title: 'Govind Bolo Hari Gopal Bolo',
    artist: 'Devotional Chorus',
    url: 'https://www.youtube.com/watch?v=i9Yy6O4qFbw',
    cover: 'https://images.unsplash.com/photo-1588665045050-a9474dd7e2ba?auto=format&fit=crop&w=500&q=80',
    duration: '5:32'
  }
];

const seedSongs = async () => {
  try {
    await connectDB();
    console.log('Connected to DB');

    // Check if songs exist
    const count = await Song.countDocuments();
    if (count === 0) {
      await Song.insertMany(initialSongs);
      console.log('Successfully seeded AI-collected Divine Songs.');
    } else {
      console.log('Songs already exist in the database.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding songs:', error);
    process.exit(1);
  }
};

seedSongs();
