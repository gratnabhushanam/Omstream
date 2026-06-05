require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const axios = require('axios');
const { Sloka } = require('../models');

async function seedAllGitaSlokas() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gita-wisdom';
    console.log('Connecting to MongoDB...', mongoUri);
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB.');

    console.log('Downloading Gita verses (Sanskrit)...');
    const { data: versesData } = await axios.get('https://raw.githubusercontent.com/gita/gita/main/data/verse.json');
    
    console.log('Downloading Gita translations...');
    const { data: translationsData } = await axios.get('https://raw.githubusercontent.com/gita/gita/main/data/translation.json');

    console.log(`Loaded ${versesData.length} verses and ${translationsData.length} translations.`);

    // Find the English Swami Sivananda translation (author_id = 7 or 16 usually)
    // Or just group all English, Hindi, Telugu translations by verse_id
    const translationsByVerse = {};
    for (const t of translationsData) {
      if (!translationsByVerse[t.verse_id]) {
        translationsByVerse[t.verse_id] = {};
      }
      
      // Prefer specific authors if multiple exist
      // Swami Sivananda (id 16) for English, Swami Ramsukhdas (id 1) for Hindi, etc.
      // If we don't have it yet, set it. If we do, only override if it's our preferred author.
      const lang = String(t.lang).toLowerCase();
      
      const isPreferredEnglish = (lang === 'english' && t.author_id === 16);
      const isPreferredHindi = (lang === 'hindi' && t.author_id === 1);
      const isPreferredTelugu = (lang === 'telugu' && t.author_id === 11);
      
      if (!translationsByVerse[t.verse_id][lang] || isPreferredEnglish || isPreferredHindi || isPreferredTelugu) {
        translationsByVerse[t.verse_id][lang] = String(t.description || '').replace(/\n/g, ' ').trim();
      }
    }

    console.log('Processing slokas for insertion...');
    const slokaDocs = [];
    
    for (const v of versesData) {
      const trans = translationsByVerse[v.id] || {};
      
      // Make a clean numeric ID so it's consistent
      const globalId = 1000000 + v.id;
      
      const slokaDoc = {
        id: globalId,
        chapter: v.chapter_number,
        verse: v.verse_number,
        sanskrit: String(v.text || '').trim(),
        englishMeaning: trans.english || '',
        hindiMeaning: trans.hindi || '',
        teluguMeaning: trans.telugu || trans.english || '', // Fallback to English if no telugu
        tags: ['bhagavad-gita', `chapter-${v.chapter_number}`],
        isDaily: false,
        dailyKey: null
      };
      
      slokaDocs.push(slokaDoc);
    }

    console.log(`Prepared ${slokaDocs.length} slokas for database insertion.`);

    // Clear old seeded daily slokas (optional, or we can just upsert)
    // Using upsert to avoid blowing away viewCounts or custom fields if they exist
    let inserted = 0;
    let updated = 0;
    
    for (const doc of slokaDocs) {
      const result = await Sloka.updateOne(
        { chapter: doc.chapter, verse: doc.verse },
        { $set: doc },
        { upsert: true }
      );
      if (result.upsertedCount > 0) inserted++;
      else if (result.modifiedCount > 0) updated++;
    }

    console.log(`✅ Success: Inserted ${inserted} new slokas, Updated ${updated} existing slokas.`);
    console.log('Run the daily cron job once to ensure today gets an assignment from this fresh set.');

  } catch (error) {
    console.error('Error seeding Gita slokas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedAllGitaSlokas();
