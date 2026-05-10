const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');

// Initialize AI clients (keys should be in .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

const SUPPORTED_LANGUAGES = [
  'English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 
  'Gujarati', 'Punjabi', 'Sanskrit', 'Urdu', 'Spanish', 'French', 'German', 
  'Japanese', 'Korean', 'Arabic', 'Chinese'
];

const LANGUAGE_CODE_MAP = {
  'en': 'English',
  'hi': 'Hindi',
  'te': 'Telugu',
  'ta': 'Tamil',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'bn': 'Bengali',
  'mr': 'Marathi',
  'gu': 'Gujarati',
  'pa': 'Punjabi',
  'sa': 'Sanskrit',
  'ur': 'Urdu',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'zh': 'Chinese',
  'ru': 'Russian',
  'pt': 'Portuguese'
};

const CODE_TO_NAME = Object.fromEntries(Object.entries(LANGUAGE_CODE_MAP).map(([k, v]) => [v, k]));

const STORY_CATEGORIES = [
  'Bhagavad Gita', 'Ramayana', 'Mahabharata', 'Shiva Puranas', 'Vishnu Puranas', 
  'Garuda Purana', 'Hanuman Stories', 'Krishna Stories', 'Indian Folklore', 
  'Panchatantra Stories', 'Tenali Raman Stories', 'Akbar Birbal Stories', 
  'Ancient Indian History', 'Freedom Fighter Stories', 'Spiritual Stories', 
  'Motivational Stories', 'Kids Mythological Stories', 'Animated Educational Chapters', 
  'Temple Histories', 'Devotional Stories', 'Moral Stories', 'Indian Culture & Traditions', 
  'Regional Indian Stories', 'Festival Stories', 'Saints & Guru Stories', 
  'Yoga & Meditation Lessons', 'Ancient Science Stories', 'Ayurveda Knowledge', 
  'Historical Kingdom Stories', 'Indian Warrior Stories', 'Epic Battles & Legends'
];

/**
 * Automatically detects the language of the provided text
 */
async function detectLanguage(text) {
  if (!text || text.length < 5) return 'en';
  
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const prompt = `
      Identify the primary language of the following text. 
      Return ONLY the 2-letter language code (e.g. "hi", "te", "en", "sa").
      If it is Sanskrit, return "sa".
      
      Text: "${text.substring(0, 500)}"
    `;
    const result = await model.generateContent(prompt);
    const code = result.response.text().trim().toLowerCase().substring(0, 2);
    return LANGUAGE_CODE_MAP[code] ? code : 'en';
  } catch (error) {
    console.error('[AI] Language detection failed:', error.message);
    return 'en';
  }
}

/**
 * Automatically translates text metadata into all supported languages
 */
async function translateMetadata(content, contentType = 'Movie', targetLanguages = []) {
  let sourceText = "";
  if (contentType === 'Sloka') {
    sourceText = `Sanskrit Verse: "${content.sanskrit}"\nMeaning: "${content.englishMeaning || content.hindiMeaning || content.teluguMeaning}"`;
  } else if (contentType === 'Story') {
    const chaptersText = (content.chapters || []).map((ch, i) => `Chapter ${i+1}: ${ch.title}\nContent: ${ch.content.substring(0, 500)}...`).join('\n\n');
    sourceText = `Title: "${content.title}"\nDescription: "${content.description || ''}"\nChapters Summary:\n${chaptersText || (content.content ? content.content.substring(0, 1000) : '')}`;
  } else {
    sourceText = `Title: "${content.title}"\nDescription: "${content.description}"`;
  }
  
  const sourceLang = content.language || content.originalLanguage || 'auto';
  const langsToProcess = (targetLanguages && targetLanguages.length > 0) 
    ? targetLanguages.filter(l => l !== sourceLang && l !== 'en') 
    : ['hi', 'te', 'ta', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa', 'sa'];

  console.log(`[AI] Translating ${contentType} into ${langsToProcess.length} languages one by one...`);

  /**
   * High-reliability Fallback: Public Translation API
   * Used if all AI services fail (auth errors, quota exhausted, etc.)
   */
  const freeTranslate = async (text, target) => {
    if (!text) return "";
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await axios.get(url);
      return res.data[0].map(x => x[0]).join('');
    } catch (e) {
      console.error(`[AI] FreeTranslate failed for ${target}:`, e.message);
      return null;
    }
  };

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const finalTranslations = {};

  for (const langCode of langsToProcess) {
    try {
      const langName = LANGUAGE_CODE_MAP[langCode] || langCode;
      console.log(`[AI] Translating ${contentType} to ${langName} (${langCode})...`);
      
      const prompt = `
        You are a highly skilled spiritual and mythological translator for "Gita Wisdom".
        Your task is to translate the following ${contentType} metadata into ${langName} (${langCode}).
        
        Original Content (Source: ${sourceLang}):
        ${sourceText}
        
        Mandatory Requirements:
        1. Maintain absolute spiritual depth and premium OTT cinematic tone.
        2. Preserve sacred terminology: Keep deity names (e.g., Krishna, Rama, Dasharatha), Ramayana/Mahabharata specific terms, and Sanskrit references accurate. Do not over-simplify them; use the appropriate respected forms in ${langName}.
        3. Ensure the translation flows naturally and poetically in ${langName}.
        4. Return ONLY a valid JSON object with NO markdown code blocks, NO introductory text, and NO trailing explanations.
        
        JSON Structure:
        - For Stories: { "title": "...", "description": "...", "chapters": [{ "title": "...", "content": "...", "summary": "...", "takeaways": ["...", "...", "..."] }] }
        - For Slokas: { "meaning": "..." }
        - For Movies/Videos: { "title": "...", "description": "..." }
      `;

      let translatedContent = null;

      try {
        console.log(`[AI] Requesting Gemini for ${langCode}...`);
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleaned = text.replace(/```json|```/g, '').trim();
        translatedContent = JSON.parse(cleaned);
        console.log(`[AI] Gemini success for ${langCode}`);
      } catch (geminiError) {
        console.warn(`[AI] Gemini failed for ${langCode}, attempting OpenAI fallback:`, geminiError.message);
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a master spiritual translator. Return ONLY a valid JSON object." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          });
          translatedContent = JSON.parse(completion.choices[0].message.content);
          console.log(`[AI] OpenAI fallback success for ${langCode}`);
        } catch (openaiError) {
          console.error(`[AI] OpenAI fallback also failed for ${langCode}:`, openaiError.message);
          
          // LAST RESORT: Public Translation API (to ensure "No False Failures")
          console.log(`[AI] Attempting Public Translation for ${langCode} as last resort...`);
          if (contentType === 'Story') {
            const translatedChapters = [];
            for (const c of (content.chapters || [])) {
              const tTitle = await freeTranslate(c.title, langCode) || c.title;
              const tContent = await freeTranslate(c.content, langCode) || c.content;
              const tTakeaways = [];
              for (const t of (c.takeaways || [])) {
                tTakeaways.push(await freeTranslate(t, langCode) || t);
              }
              translatedChapters.push({ title: tTitle, content: tContent, takeaways: tTakeaways });
            }

            translatedContent = {
              title: await freeTranslate(content.title, langCode) || content.title,
              description: await freeTranslate(content.description, langCode) || content.description,
              content: await freeTranslate(content.content, langCode) || content.content,
              chapters: translatedChapters
            };
          } else {
            const rawText = contentType === 'Sloka' ? content.meaning : (content.description || content.title);
            const translated = await freeTranslate(rawText, langCode);
            translatedContent = contentType === 'Sloka' ? { meaning: translated } : { title: await freeTranslate(content.title, langCode), description: translated };
          }
          
          if (translatedContent) {
            console.log(`[AI] Public Translation success for ${langCode}`);
          } else {
            throw new Error('All translation services failed including public fallback.');
          }
        }
      }

      if (translatedContent) {
        finalTranslations[langCode] = translatedContent;
      }
    } catch (error) {
      console.error(`[AI] Failed translation for ${langCode} entirely after all fallbacks:`, error.message);
      if (langsToProcess.length === 1) throw error;
    }
  }

  return finalTranslations;
}

/**
 * Smartly segments a long story into structured chapters with summaries and takeaways
 */
async function processStoryIntoChapters(fullContent, title) {
  console.log(`[AI] Segmenting story into chapters: ${title}`);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const prompt = `
      You are an expert Indian storyteller and literary editor. 
      Analyze the following Indian story/scripture/history content and break it down into meaningful CHAPTERS.
      
      Story Title: "${title}"
      Full Content:
      ${fullContent}
      
      Requirements:
      1. Split the content into logical chapters (min 3, max 12 depending on length).
      2. For each chapter, provide:
         - title: A catchy, spiritual/mythological title.
         - content: The full text content for this segment.
         - summary: A 2-sentence executive summary.
         - takeaways: An array of 3 key life lessons or spiritual insights.
      3. Return as a SINGLE JSON array of chapter objects.
      4. Ensure the output is valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error(`[AI] Gemini chaptering failed, attempting OpenAI fallback:`, error.message);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert Indian storyteller. Return ONLY a valid JSON array." },
          { role: "user", content: `
            Break this story into chapters: "${title}"
            Content: ${fullContent.substring(0, 5000)}
            Return a JSON array of objects: {title, content, sequence, summary, takeaways}.
          ` }
        ],
        response_format: { type: "json_object" }
      });
      const res = JSON.parse(completion.choices[0].message.content);
      return Array.isArray(res) ? res : (res.chapters || []);
    } catch (openaiError) {
      console.error(`[AI] All chaptering providers failed:`, openaiError.message);
      return [];
    }
  }
}

/**
 * Generates AI Voiceover for a script in a target language
 */
async function generateDubbing(text, language = 'en') {
  console.log(`[AI] Generating dubbing for: ${language}`);
  
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error(`[AI] Dubbing failed:`, error.message);
    return null;
  }
}

/**
 * Generates high-fidelity spiritual voice cloning using ElevenLabs
 */
async function generateElevenLabsTTS(text, voiceType = 'krishna', customApiKey = '') {
  const apiKey = customApiKey || process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn('[AI] ElevenLabs API key missing, falling back to OpenAI TTS');
    return generateDubbing(text);
  }

  // Map our voice types to ElevenLabs Voice IDs (These would be pre-cloned spiritual voices)
  const VOICE_MAP = {
    krishna: "JBFqnCBv7it9H0PkQDhc", // Deep, soothing divine voice
    ram: "onwK4e9ZLuTAKqWW03F9",     // Gentle, noble voice
    hanuman: "CwhSge9S5S7u95tU4x45", // Strong, devoted voice
    arjuna: "MF3mGyEYCl7XYW7ANLiW",  // Confident warrior voice
  };

  const voiceId = VOICE_MAP[voiceType.toLowerCase()] || VOICE_MAP.krishna;

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    console.error(`[AI] ElevenLabs TTS failed:`, error.response?.data?.toString() || error.message);
    return generateDubbing(text); // Fallback to OpenAI
  }
}

/**
 * Analyzes video metadata and content to suggest impactful timestamps for short-form Reels.
 */
async function generateReelsSnippets(content, contentType = 'Movie') {
  console.log(`[AI] Generating Reels snippets for: ${content.title}`);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const prompt = `
      You are an expert social media editor for a spiritual OTT platform.
      Analyze the following ${contentType} content and suggest 3-5 "impactful moments" that can be converted into vertical Reels.
      
      Content Title: "${content.title}"
      Description: "${content.description}"
      
      Requirements:
      1. For each snippet, provide:
         - startTime: (Estimate in seconds or MM:SS)
         - duration: (15-60 seconds)
         - hookTitle: A catchy, viral-style title.
         - captions: A short, engaging caption with hashtags.
      2. Return ONLY a valid JSON array of snippet objects.
      
      JSON Structure:
      [
        { "startTime": "01:20", "duration": 45, "hookTitle": "Finding Peace", "captions": "#Gita #Peace" },
        ...
      ]
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error(`[AI] Reels snippet generation failed:`, error.message);
    return [];
  }
}

/**
 * Automatically creates interactive quiz questions based on content.
 */
async function generateQuizFromContent(content, contentType = 'Story') {
  console.log(`[AI] Generating quiz from content: ${content.title}`);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const sourceData = contentType === 'Story' ? content.content : content.description;
    const prompt = `
      You are an expert educator and quiz master.
      Generate 5 multiple-choice questions based on the following content to test the user's understanding and engagement.
      
      Title: "${content.title}"
      Content:
      ${sourceData?.substring(0, 3000)}
      
      Requirements:
      1. Each question must have:
         - questionText: The question.
         - options: An array of 4 strings (A, B, C, D).
         - correctOption: The correct string from the options.
         - category: Use "${content.seriesTitle || 'General Wisdom'}".
      2. Return as a SINGLE JSON array of question objects.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error(`[AI] Quiz generation failed:`, error.message);
    return [];
  }
}

/**
 * Generates multilingual subtitles (VTT format) for video content.
 */
async function generateSubtitles(content, targetLang) {
  console.log(`[AI] Generating ${targetLang} subtitles for: ${content.title}`);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const prompt = `
      You are an expert spiritual translator and subtitler.
      Generate a VTT (WebVTT) formatted subtitle content for the following content in "${targetLang}".
      
      Content Title: "${content.title}"
      Description: "${content.description}"
      Duration: ${content.duration || 60} seconds.
      
      Requirements:
      1. Provide WebVTT format (starting with WEBVTT).
      2. Divide the content into logical 10-15 second segments based on the summary provided.
      3. Use poetic and scripturally accurate language in ${targetLang}.
      4. Ensure timestamps are in MM:SS.mmm format.
      
      Return ONLY the raw WebVTT string.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error(`[AI] Subtitle generation failed:`, error);
    return "";
  }
}

module.exports = {
  detectLanguage,
  translateMetadata,
  processStoryIntoChapters,
  generateDubbing,
  generateElevenLabsTTS,
  generateReelsSnippets,
  generateQuizFromContent,
  generateSubtitles,
  SUPPORTED_LANGUAGES,
  STORY_CATEGORIES
};
