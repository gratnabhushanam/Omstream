const { Sloka, Video, Story } = require('../models');
const mongoose = require('mongoose');
const { mapSloka, mapVideo } = require('../utils/responseMappers');

let mockSlokas = [
  {
    id: 1001,
    chapter: 2,
    verse: 47,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।',
    teluguMeaning: 'నీకు కర్మ చేయుటలోనే హక్కు కలదు, ఫలితంపై కాదు.',
    hindiMeaning: 'तुम्हारा अधिकार केवल कर्म करने में है, फल में कभी नहीं।',
    englishMeaning: 'You have a right to perform your duty, but not to the fruits of your actions.',
    simpleExplanation: 'Focus on sincere effort. Let go of anxiety about outcomes.',
    realLifeExample: 'Prepare well for exams and interviews without being consumed by result fear.',
    tags: ['stress', 'duty', 'focus', 'work'],
    isDaily: true,
  },
  {
    id: 1002,
    chapter: 6,
    verse: 5,
    sanskrit: 'उद्धरेदात्मनाऽत्मानं नात्मानमवसादयेत्।',
    teluguMeaning: 'మనిషి తనను తాను పైకి తీసుకోవాలి, దిగజార్చకూడదు.',
    hindiMeaning: 'मनुष्य को स्वयं अपने को ऊपर उठाना चाहिए, नीचे नहीं गिराना चाहिए।',
    englishMeaning: 'One must elevate oneself by the mind, not degrade oneself.',
    simpleExplanation: 'Your inner attitude can either lift you or pull you down.',
    realLifeExample: 'Replace self-criticism with disciplined daily habits and positive self-talk.',
    tags: ['motivation', 'discipline', 'confidence'],
    isDaily: true,
  },
  {
    id: 1003,
    chapter: 4,
    verse: 39,
    sanskrit: 'श्रद्धावान् लभते ज्ञानं तत्परः संयतेन्द्रियः।',
    teluguMeaning: 'శ్రద్ధ కలవారికి జ్ఞానం లభిస్తుంది.',
    hindiMeaning: 'श्रद्धावान और संयमी व्यक्ति ज्ञान प्राप्त करता है।',
    englishMeaning: 'The faithful and disciplined gain wisdom.',
    simpleExplanation: 'Faith plus consistent practice leads to clarity.',
    realLifeExample: 'When confused, keep learning and practicing patiently instead of quitting.',
    tags: ['confusion', 'clarity', 'faith', 'learning'],
    isDaily: true,
  },
  {
    id: 1004,
    chapter: 2,
    verse: 56,
    sanskrit: 'दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः।',
    teluguMeaning: 'దుఃఖంలో కలవరపడని, సుఖంలో ఆసక్తి చెందని వాడు స్థిరబుద్ధి.',
    hindiMeaning: 'जो दुःख में विचलित न हो और सुख में आसक्त न हो, वही स्थिरबुद्धि है।',
    englishMeaning: 'One who is not disturbed in sorrow and not attached in joy is steady in wisdom.',
    simpleExplanation: 'Emotional balance reduces fear and panic in uncertain times.',
    realLifeExample: 'Before exams or interviews, calm your breath and focus on effort, not panic.',
    tags: ['fear', 'courage', 'stability', 'calm'],
    isDaily: true,
  },
  {
    id: 1005,
    chapter: 2,
    verse: 63,
    sanskrit: 'क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः।',
    teluguMeaning: 'కోపం నుండి మోహం, మోహం నుండి స్మృతి భ్రంశం కలుగుతుంది.',
    hindiMeaning: 'क्रोध से मोह उत्पन्न होता है, मोह से स्मृति भ्रमित हो जाती है।',
    englishMeaning: 'From anger comes delusion; from delusion, memory is confused.',
    simpleExplanation: 'Anger clouds judgment and makes decisions worse.',
    realLifeExample: 'When angry in a conversation, pause and respond after a few breaths.',
    tags: ['anger', 'self-control', 'mindfulness', 'calm'],
    isDaily: true,
  },
];

let nextMockSlokaId = 2000;
let mockDailyHistory = [];
let mockMentorHistory = [];

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).toLowerCase());
  if (typeof tags === 'string') {
    const value = tags.trim();
    if (!value) return [];
    return value.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  }
  return [];
};

const DAILY_ROTATION_START = new Date(2026, 0, 1);
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const getProblemMockFallback = (problem) => {
  const matched = mockSlokas.filter((sloka) => normalizeTags(sloka.tags).some((tag) => tag.includes(problem)));
  if (matched.length) return matched[0];
  return mockSlokas[0];
};

const resolveDailySeed = (inputDate) => {
  if (typeof inputDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
    const parts = inputDate.split('-');
    const dayIndex = Math.floor((new Date(parts[0], parts[1]-1, parts[2]).getTime() - DAILY_ROTATION_START.getTime()) / MS_PER_DAY);
    return { isoDay: inputDate, dayIndex };
  }
  
  const parsedDate = inputDate ? new Date(inputDate) : new Date();
  const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  
  // Use local time for generating the iso string to avoid timezone shifting
  const yyyy = safeDate.getFullYear();
  const mm = String(safeDate.getMonth() + 1).padStart(2, '0');
  const dd = String(safeDate.getDate()).padStart(2, '0');
  const isoDay = `${yyyy}-${mm}-${dd}`;
  
  const floorDate = new Date(yyyy, safeDate.getMonth(), safeDate.getDate());
  const dayIndex = Math.floor((floorDate.getTime() - DAILY_ROTATION_START.getTime()) / MS_PER_DAY);
  return { isoDay, dayIndex };
};

const getLocalizedMeaning = (sloka) => ({
  english: sloka.englishMeaning || '',
  telugu: sloka.teluguMeaning || sloka.englishMeaning || '',
  hindi: sloka.hindiMeaning || sloka.englishMeaning || '',
});

const getAudioByLanguage = (sloka) => {
  const fallback = sloka.audioUrl || '';
  return {
    english: sloka.audioUrlEnglish || fallback,
    telugu: sloka.audioUrlTelugu || fallback,
    hindi: sloka.audioUrlHindi || fallback,
  };
};

const mentorContentBank = {
  stress: { title: 'Release the pressure', tip: 'Do your duty steadily.', practice: 'Take 3 slow breaths.' },
  fear: { title: 'Stand without fear', tip: 'Fear becomes smaller when you act.', practice: 'Take one small action.' },
  confusion: { title: 'Bring clarity first', tip: 'Simplify, reflect.', practice: 'Choose one question.' },
  anger: { title: 'Convert anger to strength', tip: 'Pause before reacting.', practice: 'Count to ten.' },
  motivation: { title: 'Move with purpose', tip: 'Effort grows with meaningful goals.', practice: 'Start with 10 mins.' },
  anxiety: { title: 'Calm the inner storm', tip: 'Surrender the outcome to the Divine.', practice: 'Practice mindful breathing for 5 minutes.' },
  sadness: { title: 'Find eternal comfort', tip: 'The soul is eternal and beyond grief.', practice: 'Reflect on what is permanent in your life.' },
  loneliness: { title: 'You are never alone', tip: 'The Divine resides in your heart.', practice: 'Spend time in silent meditation with the self.' },
  'self-doubt': { title: 'Reclaim your strength', tip: 'You have infinite potential within.', practice: 'List three things you have overcome before.' },
  discipline: { title: 'Master your senses', tip: 'Small habits build great character.', practice: 'Complete one small task with full focus.' },
  depression: { title: 'Lift your spirit', tip: 'Even the darkest night ends with dawn.', practice: 'Step outside and connect with nature.' },
  focus: { title: 'Sharpen your mind', tip: 'One point at a time leads to success.', practice: 'Avoid multitasking for the next hour.' },
  overthinking: { title: 'Simplify your thoughts', tip: 'Don\'t fight the mind, observe it.', practice: 'Write down your worries and let them go.' },
  failure: { title: 'Learn and grow', tip: 'Failure is just a step towards wisdom.', practice: 'Identify one lesson from your recent setback.' },
  success: { title: 'Stay grounded', tip: 'Success is a gift to be shared.', practice: 'Offer your gratitude for your achievements.' },
  relationships: { title: 'Love with wisdom', tip: 'See the same soul in everyone.', practice: 'Practice empathy in your next conversation.' },
  purpose: { title: 'Discover your path', tip: 'Your duty is your highest purpose.', practice: 'Ask yourself: "How can I serve today?"' },
  peace: { title: 'Rest in serenity', tip: 'Inner peace is your natural state.', practice: 'Let go of the need to control everything.' },
  confidence: { title: 'Walk with faith', tip: 'God is with you at every step.', practice: 'Stand tall and take a deep, confident breath.' },
};

const getMentorMeta = (problem) => mentorContentBank[problem] || { title: 'Seek guidance', tip: 'Keep practicing.', practice: 'Read verse twice daily.' };

exports.getSlokas = async (req, res) => {
  try {
    const slokas = await Sloka.find({});
    return res.json(slokas.map(mapSloka));
  } catch (error) {
    res.json(mockSlokas.map(mapSloka));
  }
};

exports.getSlokaById = async (req, res) => {
  try {
    const slokaId = Number(req.params.id);
    const sloka = await Sloka.findOne({ id: slokaId });
    if (sloka) return res.json(mapSloka(sloka));
    
    const mockSloka = mockSlokas.find((item) => Number(item.id) === slokaId);
    if (mockSloka) return res.json(mapSloka(mockSloka));

    return res.status(404).json({ message: 'Sloka not found' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getDailySloka = async (req, res) => {
  const start = Date.now();
  try {
    const { isoDay } = resolveDailySeed(req.query.date);
    console.log(`[DAILY] Fetching sloka for ${isoDay}`);
    
    // 1. Try to find existing assigned sloka
    let sloka = await Sloka.findOne({ dailyKey: isoDay }).lean();
    
    // 2. If not found and it's today/past, try to assign one
    if (!sloka) {
      const todayIso = new Date().toISOString().split('T')[0];
      if (isoDay <= todayIso) {
         console.log(`[DAILY] No sloka for ${isoDay}. Triggering auto-assignment...`);
         const { assignDailySloka } = require('../services/cronJobs');
         sloka = await assignDailySloka(isoDay);
      }
    }

    const duration = Date.now() - start;
    if (duration > 500) console.warn(`[PERF] getDailySloka took ${duration}ms`);

    if (!sloka) {
       console.log(`[DAILY] No sloka found in DB for ${isoDay}, returning mock.`);
       const { dayIndex } = resolveDailySeed(req.query.date);
       const selectedMock = mockSlokas[dayIndex % mockSlokas.length];
       return res.json({ ...mapSloka(selectedMock), dailyKey: isoDay, source: 'mock' });
    }

    return res.json({ ...mapSloka(sloka), dailyKey: isoDay });
  } catch (error) {
    console.error('[PERF] getDailySloka Error:', error);
    const { isoDay, dayIndex } = resolveDailySeed(req.query.date);
    const selected = mockSlokas[dayIndex % mockSlokas.length];
    return res.json({ ...mapSloka(selected), dailyKey: isoDay, source: 'mock' });
  }
};

exports.addSloka = async (req, res) => {
  try {
    const { Job } = require('../models');
    const newSloka = await Sloka.create(req.body);
    
    await Job.create({
      type: 'all',
      contentId: newSloka._id,
      contentType: 'Sloka',
      status: 'pending'
    });

    return res.status(201).json(mapSloka(newSloka));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMentorSloka = async (req, res) => {
  const start = Date.now();
  try {
    const problem = String(req.query.problem || '').trim().toLowerCase();
    if (!problem) return res.status(400).json({ message: 'Problem keyword is required' });

    const mentorMeta = getMentorMeta(problem);
    
    // 1. Try high-performance Text Search first
    let slokas = [];
    try {
      slokas = await Sloka.find({ $text: { $search: problem } }).limit(5).lean();
    } catch (textSearchErr) {
      console.warn('[MENTOR] Text search failed or index not ready, falling back to regex:', textSearchErr.message);
      // Fallback to regex if text index is not yet built or supported
      slokas = await Sloka.find({ 
        $or: [
          { tags: { $regex: problem, $options: 'i' } },
          { englishMeaning: { $regex: problem, $options: 'i' } }
        ]
      }).limit(5).lean();
    }
    
    const duration = Date.now() - start;
    if (duration > 1000) console.warn(`[PERF] getMentorSloka took ${duration}ms for problem: ${problem}`);

    if (slokas.length === 0) {
      const fallback = getProblemMockFallback(problem);
      return res.json({ ...mapSloka(fallback), problem, mentorTitle: mentorMeta.title, mentorTip: mentorMeta.tip, mentorPractice: mentorMeta.practice });
    }

    const randomSloka = slokas[Math.floor(Math.random() * slokas.length)];
    // Quick lookup for related video
    const relatedVideo = await Video.findOne({ tags: { $regex: problem, $options: 'i' } }).lean();

    res.json({ 
      ...mapSloka(randomSloka), 
      problem, 
      mentorTitle: mentorMeta.title, 
      mentorTip: mentorMeta.tip, 
      mentorPractice: mentorMeta.practice, 
      recommendedVideo: relatedVideo ? mapVideo(relatedVideo) : null 
    });
  } catch (error) {
    console.error('[PERF] getMentorSloka Fatal Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMentorContent = async (req, res) => {
  const start = Date.now();
  try {
    const problem = String(req.query.problem || '').trim().toLowerCase();
    const mentorMeta = getMentorMeta(problem);

    // Optimized parallel lookups
    const [relatedSlokas, relatedStories, relatedVideos] = await Promise.all([
      Sloka.find({ 
        $or: [
          { tags: problem }, // Exact tag match is fast if indexed
          { $text: { $search: problem } }
        ]
      }).limit(6).lean().catch(() => Sloka.find({ tags: { $regex: problem, $options: 'i' } }).limit(6).lean()),
      Story.find({ tags: { $regex: problem, $options: 'i' } }).limit(6).lean(),
      Video.find({ tags: { $regex: problem, $options: 'i' } }).limit(6).lean()
    ]);

    const duration = Date.now() - start;
    if (duration > 1500) console.warn(`[PERF] getMentorContent took ${duration}ms for problem: ${problem}`);

    res.json({ 
      problem, 
      mentorTitle: mentorMeta.title, 
      mentorTip: mentorMeta.tip, 
      mentorPractice: mentorMeta.practice, 
      slokas: relatedSlokas.map(mapSloka), 
      stories: relatedStories, 
      videos: relatedVideos.map(mapVideo)
    });
  } catch (error) {
    console.error('[PERF] getMentorContent Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getDailyHistory = async (req, res) => {
  try {
    const history = await Sloka.find({ dailyKey: { $ne: null } }).sort({ dailyKey: -1 });
    return res.json({ items: history.map(mapSloka) });
  } catch (error) {
    console.error('getDailyHistory Error:', error);
    return res.json({ items: mockSlokas.map(mapSloka) });
  }
};

exports.addDailyHistory = async (req, res) => { return res.status(201).json({ message: 'Saved to watchlist' }); };
exports.getMentorHistory = async (req, res) => res.json({ items: mockMentorHistory });
exports.addMentorHistory = async (req, res) => { mockMentorHistory.push(req.body); return res.status(201).json({ message: 'Saved' }); };
