const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// Initialize AI clients (keys should be in .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

const SUPPORTED_LANGUAGES = [
  'English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 
  'Gujarati', 'Punjabi', 'Sanskrit', 'Urdu', 'Spanish', 'French', 'German', 
  'Japanese', 'Korean', 'Arabic', 'Chinese'
];

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
 * Automatically translates text metadata into all supported languages
 */
async function translateMetadata(content, contentType = 'Movie') {
  let sourceText = "";
  if (contentType === 'Sloka') {
    sourceText = `Sanskrit Verse: "${content.sanskrit}"\nMeaning: "${content.englishMeaning || content.hindiMeaning || content.teluguMeaning}"`;
  } else if (contentType === 'Story') {
    sourceText = `Title: "${content.title}"\nDescription: "${content.description || ''}"\nFirst Chapter Sample: "${content.content?.substring(0, 500) || ''}"`;
  } else {
    sourceText = `Title: "${content.title}"\nDescription: "${content.description}"`;
  }
  
  console.log(`[AI] Translating ${contentType} metadata: ${content.title || 'Sloka ' + content.verse}`);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const prompt = `
      You are an expert spiritual and cinematic translator. 
      Translate the following ${contentType} content metadata into THESE LANGUAGES: ${SUPPORTED_LANGUAGES.join(', ')}.
      
      Original Content (Source Language: English/Mix):
      ${sourceText}
      
      Requirements:
      1. Preserve spiritual, theological, mythological, and cinematic context accurately.
      2. Use regional cultural nuances where appropriate.
      3. Return a SINGLE JSON object where keys are the 2-letter language codes (e.g., "hi", "te", "en", "es") and values are objects.
      4. For Slokas, the object should be {"meaning": "..."}.
      5. For Movies/Videos, the object should be {"title": "...", "description": "..."}.
      6. For Stories, the object should be {"title": "...", "description": "..."}.
      7. Support these codes: ${SUPPORTED_LANGUAGES.map(l => l.toLowerCase().substring(0, 2)).join(', ')}.
      8. Return ONLY the JSON object. No preamble.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleaned = text.replace(/```json|```/g, '').trim();
    const translations = JSON.parse(cleaned);
    
    return translations;
  } catch (error) {
    console.error(`[AI] Batch translation failed:`, error.message);
    return {};
  }
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
    console.error(`[AI] Story chaptering failed:`, error.message);
    return [];
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

const axios = require('axios');

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
