const mongoose = require('mongoose');
const axios = require('axios');

async function freeTranslate(text, targetLang) {
  if (!text) return '';
  if (targetLang === 'en') return text;
  
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data && response.data[0]) {
      const translatedLines = response.data[0].map(segment => segment[0]);
      return translatedLines.join('');
    }
    return '';
  } catch (error) {
    console.error(`freeTranslate error for ${targetLang}:`, error.message);
    return '';
  }
}

const langs = ['hi', 'te', 'ta', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa'];

mongoose.connect('mongodb://gitawisdom_user:Ratna%402005@ac-toyzhwn-shard-00-00.wgi3d9w.mongodb.net:27017,ac-toyzhwn-shard-00-01.wgi3d9w.mongodb.net:27017,ac-toyzhwn-shard-00-02.wgi3d9w.mongodb.net:27017/gita_wisdom?ssl=true&replicaSet=atlas-3floza-shard-0&authSource=admin&appName=Cluster0')
.then(async () => {
  console.log('Connected to DB');
  const stories = await mongoose.connection.db.collection('stories').find({}).toArray();
  
  for (const s of stories) {
    console.log(`Translating Story ${s.title}...`);
    let translations = s.translations || {};
    
    for (const l of langs) {
      if (!translations[l].content && s.content) {
        console.log(` - Translating missing content to ${l}...`);
        
        translations[l].content = await freeTranslate(s.content, l) || s.content;
        console.log(`   Done for ${l}`);
      }
    }
    
    await mongoose.connection.db.collection('stories').updateOne(
      { _id: s._id },
      { $set: { translations } }
    );
  }
  
  console.log('Done translating all missing content!');
  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
