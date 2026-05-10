const mongoose = require('mongoose');
const { Sloka } = require('./models');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://gitawisdom_user:Ratna%402005@ac-toyzhwn-shard-00-00.wgi3d9w.mongodb.net:27017,ac-toyzhwn-shard-00-01.wgi3d9w.mongodb.net:27017,ac-toyzhwn-shard-00-02.wgi3d9w.mongodb.net:27017/gita_wisdom?ssl=true&replicaSet=atlas-3floza-shard-0&authSource=admin&appName=Cluster0';

const TARGET_LANGS = ['hi', 'te', 'ta', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa', 'sa', 'ar', 'fr', 'de', 'es', 'pt', 'ja', 'ko', 'ru', 'zh'];

async function translateMentorSlokas() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find slokas that have mentor tags and haven't been fully translated yet
    const slokas = await Sloka.find({ 
      tags: { $exists: true, $not: { $size: 0 } }
    });

    console.log(`Found ${slokas.length} slokas to translate into ${TARGET_LANGS.length} languages...`);

    for (const sloka of slokas) {
      console.log(`\n--- Translating Sloka Ch ${sloka.chapter} V ${sloka.verse} (ID: ${sloka.id}) ---`);
      
      // We will store all translations in the 'translations' object
      const translations = sloka.translations || {};
      
      for (const langCode of TARGET_LANGS) {
        if (translations[langCode]) {
            console.log(`Skipping ${langCode}, already exists.`);
            continue;
        }

        try {
          console.log(`Translating into ${langCode}...`);
          
          const sourceText = `
            Sanskrit Verse: ${sloka.sanskrit}
            English Meaning: ${sloka.englishMeaning}
            Mentor Guidance: ${sloka.mentorTitle} - ${sloka.mentorTip}
            Practice: ${sloka.mentorPractice}
            Modern Insight: ${sloka.simpleExplanation}
            Example: ${sloka.realLifeExample}
          `;

          let translatedData = null;

          // Try Gemini first
          try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
              Translate the following Bhagavad Gita guidance into the language with code "${langCode}".
              Return ONLY a JSON object with these keys:
              - meaning: (translated sloka meaning)
              - guidance: (translated mentor title and tip)
              - practice: (translated practice)
              - insight: (translated modern insight)
              - example: (translated real life example)

              Source Text:
              ${sourceText}
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            translatedData = JSON.parse(cleanJson);
          } catch (geminiError) {
            console.log(`Gemini failed for ${langCode}, trying OpenAI...`);
            // Try OpenAI fallback
            try {
              const OpenAI = require('openai');
              const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
              const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: "You are a translator. Return ONLY JSON." },
                  { role: "user", content: `Translate this into language code "${langCode}":\n${sourceText}\n\nReturn JSON keys: meaning, guidance, practice, insight, example.` }
                ],
                response_format: { type: "json_object" }
              });
              translatedData = JSON.parse(response.choices[0].message.content);
            } catch (openaiError) {
              console.log(`OpenAI also failed for ${langCode}. Using local fallback.`);
              // Local fallback (at least it's not empty)
              translatedData = {
                meaning: `[${langCode}] ${sloka.englishMeaning}`,
                guidance: `[${langCode}] ${sloka.mentorTitle}: ${sloka.mentorTip}`,
                practice: `[${langCode}] ${sloka.mentorPractice}`,
                insight: `[${langCode}] ${sloka.simpleExplanation}`,
                example: `[${langCode}] ${sloka.realLifeExample}`
              };
            }
          }

          if (translatedData) {
            translations[langCode] = translatedData;
            await Sloka.updateOne({ _id: sloka._id }, { $set: { translations } });
            console.log(`Success for ${langCode}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (langError) {
          console.error(`Failed to translate ${sloka.id} into ${langCode}:`, langError.message);
        }
      }
    }

    console.log('\nAll translations completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Translation process failed:', error);
    process.exit(1);
  }
}

translateMentorSlokas();
