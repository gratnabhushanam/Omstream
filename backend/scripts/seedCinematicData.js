require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Video = require('../models/Video');
const User = require('../models/User');
const { sendInApp } = require('../utils/notificationService');

async function seedData() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gita-wisdom';
    console.log('Connecting to MongoDB...', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    // 1. Upload Teasers & 2. Promote Upcoming Content
    const upcomingMovie = await Movie.findOneAndUpdate(
      { title: 'The Mahabharata Epic - Part 1' },
      {
        title: 'The Mahabharata Epic - Part 1',
        description: 'Experience the epic tale of duty, righteousness, and the eternal soul in this cinematic masterpiece.',
        isComingSoon: true,
        trailerUrl: 'https://www.youtube.com/watch?v=s10ZzC9W74U', // Sample public domain or placeholder trailer
        thumbnail: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=1200&auto=format&fit=crop', // Cinematic temple aesthetic
        genre: 'Epic History',
        isPremium: true
      },
      { upsert: true, new: true }
    );
    console.log('✅ Seeded Coming Soon Movie:', upcomingMovie.title);

    const upcomingVideo = await Video.findOneAndUpdate(
      { title: 'Bhagavad Gita Chapter 1: Visualised' },
      {
        title: 'Bhagavad Gita Chapter 1: Visualised',
        description: 'A stunning visual representation of the first chapter of the Bhagavad Gita with immersive 3D landscapes.',
        isComingSoon: true,
        trailerUrl: 'https://www.youtube.com/watch?v=b4OioE_3-Xk', 
        thumbnail: 'https://images.unsplash.com/photo-1582666031731-827fc7fba8dc?q=80&w=1200&auto=format&fit=crop', 
        module: 'divine',
        category: 'movies',
        collectionTitle: 'Bhagavad Gita Cinematic'
      },
      { upsert: true, new: true }
    );
    console.log('✅ Seeded Coming Soon Video:', upcomingVideo.title);

    // 3. Broadcast Notification
    const users = await User.find({}, { _id: 1 });
    let notificationCount = 0;
    
    for (const user of users) {
      if (sendInApp) {
        await sendInApp({
          userId: String(user._id),
          type: 'promo',
          title: 'Upcoming Release: The Mahabharata Epic!',
          body: 'Check out the new trailer for The Mahabharata Epic - Part 1 in the Divine Cinema section.'
        });
        notificationCount++;
      }
    }
    console.log(`✅ Broadcasted 'Coming Soon' notifications to ${notificationCount} users.`);

    console.log('🎉 Data seeding and promotion broadcast complete!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    process.exit(0);
  }
}

seedData();
