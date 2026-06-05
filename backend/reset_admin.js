require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const User = require('./models/User');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const result = await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      { $set: { password: hashedPassword, role: 'admin' } },
      { new: true, upsert: true }
    );

    console.log(`✅ Admin password FORCE-RESET for: ${result.email}`);
    console.log(`   Role: ${result.role}`);
    console.log(`   Use password: ${ADMIN_PASSWORD}`);

    // Verify it works
    const stored = await User.findOne({ email: ADMIN_EMAIL });
    const isMatch = await bcrypt.compare(ADMIN_PASSWORD, stored.password);
    console.log(`   bcrypt verify: ${isMatch ? '✅ PASS' : '❌ FAIL'}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
