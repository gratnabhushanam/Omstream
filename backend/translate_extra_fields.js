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
  const slokas = await mongoose.connection.db.collection('slokas').find({}).toArray();
  
  for (const s of slokas) {
    console.log(`Translating extra fields for Sloka ${s.id}...`);
    let localizedExplanation = s.localizedExplanation || {};
    let localizedExample = s.localizedExample || {};
    
    for (const l of langs) {
      if (!localizedExplanation[l] && s.simpleExplanation) {
        const result = await freeTranslate(s.simpleExplanation, l);
        if (result) localizedExplanation[l] = result;
      }
      
      if (!localizedExample[l] && s.realLifeExample) {
        const result = await freeTranslate(s.realLifeExample, l);
        if (result) localizedExample[l] = result;
      }
    }
    
    await mongoose.connection.db.collection('slokas').updateOne(
      { _id: s._id },
      { $set: { localizedExplanation, localizedExample } }
    );
  }
  
  console.log('Done mapping extra fields!');
  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
