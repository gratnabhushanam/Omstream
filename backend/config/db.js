const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const mongoUri = process.env.MONGO_URI;

const connectDB = async () => {
  if (!mongoUri) {
    console.error('CRITICAL: MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 500, // Maximized for ultra-high concurrency (lakhs of users)
      minPoolSize: 50,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB Connected successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
