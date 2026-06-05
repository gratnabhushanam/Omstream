require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const axios = require('axios');
const { Sloka } = require('../models');

async function fetchTeluguTranslations() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gita-wisdom';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB.');

    // Get all slokas
    const slokas = await Sloka.find({ chapter: { $exists: true }, verse: { $exists: true } }).sort({ chapter: 1, verse: 1 });
    console.log(`Found ${slokas.length} slokas in DB.`);

    let updated = 0;
    
    // Batch process 10 at a time
    const batchSize = 10;
    for (let i = 0; i < slokas.length; i += batchSize) {
      const batch = slokas.slice(i, i + batchSize);
      
      const promises = batch.map(async (sloka) => {
        try {
          // Avoid re-fetching if we somehow already have a valid telugu meaning that isn't english
          // But our previous script explicitly wrote trans.english into teluguMeaning if it was missing.
          // So we should just fetch it anyway and override.
          const res = await axios.get(`https://gita-api.vercel.app/tel/verse/${sloka.chapter}/${sloka.verse}`, { timeout: 10000 });
          if (res.data && res.data.translation) {
            sloka.teluguMeaning = res.data.translation;
            // Also save the explanation/purport to localizedExplanation if we want
            if (res.data.purport && res.data.purport.length > 0) {
              if (!sloka.localizedExplanation) sloka.localizedExplanation = {};
              sloka.localizedExplanation.te = res.data.purport.join('\n');
            }
            await sloka.save();
            return true;
          }
        } catch (err) {
          console.error(`Failed for chapter ${sloka.chapter} verse ${sloka.verse}`);
        }
        return false;
      });

      const results = await Promise.all(promises);
      updated += results.filter(Boolean).length;
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(slokas.length / batchSize)} - Updated so far: ${updated}`);
      
      // Small delay to prevent rate-limiting
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`✅ Success: Updated ${updated} slokas with Telugu translations.`);

  } catch (error) {
    console.error('Error fetching Telugu translations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

fetchTeluguTranslations();
