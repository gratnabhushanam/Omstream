const cron = require('node-cron');
const { Sloka } = require('../models');

const mockSlokas = [
  {
    id: 1001,
    chapter: 2,
    verse: 47,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि।।',
    englishMeaning: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.',
    teluguMeaning: 'నీకు కర్మ చేయుటలోనే హక్కు కలదు, ఫలితంపై కాదు.',
    hindiMeaning: 'तुम्हारा अधिकार केवल कर्म करने में है, फल में कभी नहीं।',
    simpleExplanation: 'Focus on sincere effort. Let go of anxiety about outcomes.',
    realLifeExample: 'Prepare well for exams and interviews without being consumed by result fear.',
    tags: ['stress', 'duty', 'focus', 'work'],
    isDaily: false,
  },
  {
    id: 1002,
    chapter: 6,
    verse: 5,
    sanskrit: 'उद्धरेदात्मनाऽत्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः।।',
    englishMeaning: 'One must elevate oneself by their own mind, not degrade oneself. The mind is the friend of the conditioned soul, and his enemy as well.',
    teluguMeaning: 'మనిషి తనను తాను పైకి తీసుకోవాలి, దిగజార్చకూడదు.',
    hindiMeaning: 'मनुष्य को स्वयं अपने को ऊपर उठाना चाहिए, नीचे नहीं गिराना चाहिए।',
    simpleExplanation: 'Your inner attitude can either lift you or pull you down.',
    realLifeExample: 'Replace self-criticism with disciplined daily habits and positive self-talk.',
    tags: ['motivation', 'discipline', 'confidence'],
    isDaily: false,
  },
  {
    id: 1003,
    chapter: 4,
    verse: 39,
    sanskrit: 'श्रद्धावान् लभते ज्ञानं तत्परः संयतेन्द्रियः।\nज्ञानं लब्ध्वा परां शान्तिमचिरेणाधिगच्छति।।',
    englishMeaning: 'A faithful man who is dedicated to transcendental knowledge and who subdues his senses is eligible to achieve such knowledge, and having achieved it he quickly attains the supreme spiritual peace.',
    teluguMeaning: 'శ్రద్ధ కలవారికి జ్ఞానం లభిస్తుంది.',
    hindiMeaning: 'श्रद्धावान और संयमी व्यक्ति ज्ञान प्राप्त करता है।',
    simpleExplanation: 'Faith plus consistent practice leads to clarity and ultimate peace.',
    realLifeExample: 'When confused, keep learning and practicing patiently instead of quitting.',
    tags: ['confusion', 'clarity', 'faith', 'learning'],
    isDaily: false,
  },
  {
    id: 1004,
    chapter: 2,
    verse: 56,
    sanskrit: 'दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः।\nवीतरागभयक्रोधः स्थितधीर्मुनिरुच्यते।।',
    englishMeaning: 'One who is not disturbed in mind even amidst the threefold miseries or elated when there is happiness, and who is free from attachment, fear and anger, is called a sage of steady mind.',
    teluguMeaning: 'దుఃఖంలో కలవరపడని, సుఖంలో ఆసక్తి చెందని వాడు స్థిరబుద్ధి.',
    hindiMeaning: 'जो दुःख में विचलित न हो और सुख में आसक्त न हो, वही स्थिरबुद्धि है।',
    simpleExplanation: 'Emotional balance reduces fear and panic in uncertain times.',
    realLifeExample: 'Before exams or interviews, calm your breath and focus on effort, not panic.',
    tags: ['fear', 'courage', 'stability', 'calm'],
    isDaily: false,
  },
  {
    id: 1005,
    chapter: 2,
    verse: 63,
    sanskrit: 'क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः।\nस्मृतिभ्रंशाद् बुद्धिनाशो बुद्धिनाशात्प्रणश्यति।।',
    englishMeaning: 'From anger, complete delusion arises, and from delusion bewilderment of memory. When memory is bewildered, intelligence is lost, and when intelligence is lost one falls down again into the material pool.',
    teluguMeaning: 'కోపం నుండి మోహం, మోహం నుండి స్మృతి భ్రంశం కలుగుతుంది.',
    hindiMeaning: 'क्रोध से मोह उत्पन्न होता है, मोह से स्मृति भ्रमित हो जाती है।',
    simpleExplanation: 'Anger clouds judgment and makes decisions worse.',
    realLifeExample: 'When angry in a conversation, pause and respond after a few breaths.',
    tags: ['anger', 'self-control', 'mindfulness', 'calm'],
    isDaily: false,
  },

  {
    id: 1006,
    chapter: 3,
    verse: 8,
    sanskrit: 'नियतं कुरु कर्म त्वं कर्म ज्यायो ह्यकर्मणः।\nशरीरयात्रापि च ते न प्रसिद्ध्येत् अकर्मणः।।',
    englishMeaning: 'Perform your prescribed duty, for doing so is better than not working. One cannot even maintain one\'s physical body without work.',
    teluguMeaning: 'నీకు నిర్దేశించిన కర్మను ఆచరించు, ఎందుకంటే కర్మ చేయకపోవడం కంటే కర్మ చేయడం శ్రేష్ఠం.',
    hindiMeaning: 'तुम अपना नियत कर्म करो, क्योंकि कर्म न करने की अपेक्षा कर्म करना श्रेष्ठ है।',
    simpleExplanation: 'Action is necessary; laziness is not an option.',
    realLifeExample: 'Even taking small steps toward your goals is better than overthinking and doing nothing.',
    tags: ['duty', 'action', 'overthinking'],
    isDaily: false,
  },
  {
    id: 1007,
    chapter: 18,
    verse: 78,
    sanskrit: 'यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः।\nतत्र श्रीर्विजयो भूतिर्ध्रुवा नीतिर्मतिर्मम।।',
    englishMeaning: 'Wherever there is Krishna, the master of all mystics, and wherever there is Arjuna, the supreme archer, there will also certainly be opulence, victory, extraordinary power, and morality. That is my opinion.',
    teluguMeaning: 'యోగేశ్వరుడైన శ్రీకృష్ణుడు, ధనుర్ధారి అయిన అర్జునుడు ఎక్కడ ఉంటారో, అక్కడ సిరిసంపదలు, విజయం, అసాధారణ శక్తి మరియు నీతి కచ్చితంగా ఉంటాయి.',
    hindiMeaning: 'जहाँ योगेश्वर श्रीकृष्ण हैं और जहाँ धनुर्धर अर्जुन हैं, वहाँ ऐश्वर्य, विजय, असाधारण शक्ति और नीति निश्चित रूप से होती है।',
    simpleExplanation: 'Aligning your actions with divine principles ensures true success.',
    realLifeExample: 'Stay truthful and ethical in business; long-term success will follow.',
    tags: ['success', 'ethics', 'victory'],
    isDaily: false,
  }

];

// Helper to seed initial slokas if DB is empty
const seedDatabaseIfEmpty = async () => {
  try {
    const count = await Sloka.countDocuments();
    if (count === 0) {
      console.log('[CRON] Database empty. Seeding initial spiritual slokas...');
      await Sloka.insertMany(mockSlokas);
      console.log('[CRON] Successfully seeded database.');
    }
  } catch (err) {
    console.error('[CRON] Error seeding database:', err.message);
  }
};

// Generates or assigns a daily sloka for the given date (YYYY-MM-DD)
const assignDailySloka = async (dateStr) => {
  try {
    // 1. Check if already exists for this date
    const existing = await Sloka.findOne({ dailyKey: dateStr });
    if (existing) {
      console.log(`[CRON] Sloka already assigned for ${dateStr}.`);
      return existing;
    }

    // 2. We need to assign a new one.
    // To prevent repetition, we select a sloka that either has no dailyKey,
    // or has the oldest dailyKey (meaning it was used a long time ago).
    let slokaToAssign = await Sloka.findOne({ dailyKey: { $exists: false } });
    if (!slokaToAssign) {
      slokaToAssign = await Sloka.findOne({ dailyKey: null });
    }
    
    // If all slokas have been used, get the oldest one
    if (!slokaToAssign) {
      slokaToAssign = await Sloka.findOne().sort({ dailyKey: 1 }); // Ascending order
    }

    if (!slokaToAssign) {
      console.error('[CRON] No slokas available in database to assign!');
      return null;
    }

    // Unmark any current daily
    await Sloka.updateMany({ isDaily: true }, { $set: { isDaily: false } });

    // Mark new one
    slokaToAssign.dailyKey = dateStr;
    slokaToAssign.isDaily = true;
    await slokaToAssign.save();

    console.log(`[CRON] Successfully assigned Daily Sloka for ${dateStr} (ID: ${slokaToAssign._id})`);
    
    return slokaToAssign;
  } catch (err) {
    console.error(`[CRON] Error assigning daily sloka for ${dateStr}:`, err.message);
    return null;
  }
};

const initializeCronJobs = async () => {
  await seedDatabaseIfEmpty();

  // Run immediately on boot to ensure today has a sloka
  const today = new Date().toISOString().split('T')[0];
  await assignDailySloka(today);

  // Schedule to run at Midnight every day (00:01)
  cron.schedule('1 0 * * *', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    console.log(`[CRON] Running daily sloka rotation for ${todayStr}...`);
    await assignDailySloka(todayStr);
  });
};

module.exports = {
  initializeCronJobs,
  assignDailySloka
};
