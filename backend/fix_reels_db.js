const { connectDB } = require('./config/db');
const { Video } = require('./models');

async function fixReels() {
  await connectDB();
  const res = await Video.updateMany(
    { videoUrl: { $regex: /WhatsApp Video/ } },
    { $set: { videoUrl: '/uploads/reels/shiva_reel.mp4' } }
  );
  console.log(`Updated ${res.modifiedCount} reels`);
  process.exit(0);
}

fixReels().catch(err => {
  console.error(err);
  process.exit(1);
});
