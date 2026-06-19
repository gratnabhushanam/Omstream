const { Sloka, Video, Story } = require('../models');
const mongoose = require('mongoose');
const { broadcastEvent } = require('../services/socketService');
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

const DAILY_ROTATION_START = new Date(2026, 0, 1);
const MS_PER_DAY = 1000 * 60 * 60 * 24;

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

// Mentor config data removed as part of the curated verses cleanup

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

    broadcastEvent('content_updated', { type: 'slokas' });
    return res.status(201).json(mapSloka(newSloka));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mentor endpoints removed as part of the curated verses cleanup

exports.getDailyHistory = async (req, res) => {
  try {
    const history = await Sloka.find({ dailyKey: { $ne: null } }).lean().sort({ dailyKey: -1 });
    return res.json({ items: history.map(mapSloka) });
  } catch (error) {
    console.error('getDailyHistory Error:', error);
    return res.json({ items: mockSlokas.map(mapSloka) });
  }
};

exports.addDailyHistory = async (req, res) => { return res.status(201).json({ message: 'Saved to watchlist' }); };
// Mentor history endpoints removed as part of the curated verses cleanup
