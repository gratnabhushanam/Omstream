require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gita_wisdom')
  .then(async () => {
    const VideoMongo = require('./models/Video');
    try {
      const result = await VideoMongo.deleteMany({
        $or: [
          { videoUrl: { $exists: false } },
          { videoUrl: null }
        ]
      });
      console.log('Successfully deleted broken empty videos:', result.deletedCount);
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  });
