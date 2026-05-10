const mongoose = require('mongoose');
const { Sloka } = require('./models');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://gitawisdom_user:Ratna%402005@ac-toyzhwn-shard-00-00.wgi3d9w.mongodb.net:27017,ac-toyzhwn-shard-00-01.wgi3d9w.mongodb.net:27017,ac-toyzhwn-shard-00-02.wgi3d9w.mongodb.net:27017/gita_wisdom?ssl=true&replicaSet=atlas-3floza-shard-0&authSource=admin&appName=Cluster0';

const slokaData = [
  {
    chapter: 2, verse: 47,
    sanskrit: 'कर्मण्येवाधिकारस्ते మా ఫలేషు కదాచన।\nమా కర్మఫలహేతుర్భూర్మా తే సఙ్గోऽస్త్వకర్మణి॥',
    englishMeaning: 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself to be the cause of the results of your activities, nor be attached to inaction.',
    simpleExplanation: 'Focus on your effort and process rather than worrying about the outcome. This detachment is the key to mental peace.',
    realLifeExample: 'When preparing for a job interview or exam, focus entirely on your study and preparation. Once you give your best, let go of the anxiety about whether you will get it or not.',
    tags: ['stress', 'anxiety', 'focus', 'failure', 'success', 'work', 'duty'],
    mentorTitle: 'Master Your Action, Not the Result',
    mentorTip: 'Anxiety arises from wanting to control the future. Focus on the now.',
    mentorPractice: 'Set a goal for today. Work on it with 100% focus, and at the end of the day, say "I did my best" and let go of the result.'
  },
  {
    chapter: 2, verse: 3,
    sanskrit: 'క్లైబ్యం మా స్మ గమః పార్థ నైతత్త్వయ్యుపపద్యతే।\nక్షుద్రం హృదయదౌర్బల్యం త్యక్త్వోత్తిష్ఠ పరన్తప॥',
    englishMeaning: 'O Parth, do not yield to this degrading impotence. It does not become you. Give up such petty weakness of heart and arise, O vanquisher of enemies.',
    simpleExplanation: 'Krishna encourages Arjuna to overcome self-doubt and mental weakness. He reminds us that we are stronger than our temporary emotions.',
    realLifeExample: 'When you feel like giving up on a difficult goal because you think you are not good enough, remember this verse. Stand up and take the first step again.',
    tags: ['self-doubt', 'confidence', 'motivation', 'depression', 'fear'],
    mentorTitle: 'Arise from Inner Weakness',
    mentorTip: 'Weakness is a temporary cloud. Your true nature is strength.',
    mentorPractice: 'Whenever a "I can\'t" thought comes, replace it with "I will try" immediately.'
  },
  {
    chapter: 6, verse: 5,
    sanskrit: 'ఉద్ధరేదాత్మనాత్మానం నాత్మానమవసాదయేత్।\nఆత్మైవ హ్యాత్మనో బన్ధురాత్మైవ రిపురాత్మనః॥',
    englishMeaning: 'Elevate yourself through your own mind, and do not degrade yourself. For the mind can be the friend and also the enemy of the self.',
    simpleExplanation: 'Your mind is your greatest tool. If you train it to be positive and disciplined, it becomes your best friend. If left unchecked, it becomes your worst enemy.',
    realLifeExample: 'Instead of waiting for someone else to motivate you, use self-reflection and positive self-talk to lift your mood and start your day.',
    tags: ['motivation', 'discipline', 'self-doubt', 'overthinking', 'depression'],
    mentorTitle: 'Be Your Own Best Friend',
    mentorTip: 'Don\'t let your mind pull you down. Take control of your thoughts.',
    mentorPractice: 'Identify one negative thought you had today and consciously replace it with a supportive one.'
  },
  {
    chapter: 2, verse: 62,
    sanskrit: 'ధ్యాయతో విషయాన్పుంసః సఙ్గస్తేషూపజాయతే।\nసఙ్గాత్సఞ్జాయతే కామః కామాత్క్రోధోऽభిజాయతే॥',
    englishMeaning: 'While contemplating on the objects of the senses, one develops attachment to them; from attachment, desire is born, and from desire, anger arises.',
    simpleExplanation: 'Anger often comes from unfulfilled desires or attachments. By understanding the root of our desire, we can manage our anger.',
    realLifeExample: 'If you get angry when someone disagrees with you, it might be because you are attached to being right. Recognizing this attachment helps you stay calm.',
    tags: ['anger', 'relationships', 'peace', 'self-control'],
    mentorTitle: 'The Root of Anger',
    mentorTip: 'Anger is a signal of attachment. Look within to find the source.',
    mentorPractice: 'The next time you feel a spark of anger, pause and ask: "What desire of mine is being blocked right now?"'
  },
  {
    chapter: 2, verse: 63,
    sanskrit: 'క్రోధాద్భవతి సమ్మోహః సమ్మోహాత్స్మృతివిభ్రమః।\nస్మృతిభ్రంషాద్బుద్ధినాశో బుద్ధినాశాత్ప్రణశ్యతి॥',
    englishMeaning: 'From anger comes delusion; from delusion, the loss of memory; from the loss of memory, the destruction of discrimination; and from the destruction of discrimination, one perishes.',
    simpleExplanation: 'Anger destroys our ability to think clearly. It leads to poor decisions and broken relationships.',
    realLifeExample: 'Never make a major decision or send a harsh text when you are angry. Wait for the emotion to pass so your wisdom can return.',
    tags: ['anger', 'discipline', 'peace', 'relationships'],
    mentorTitle: 'Anger Clouds Wisdom',
    mentorTip: 'A moment of patience in a moment of anger prevents a thousand moments of regret.',
    mentorPractice: 'Practice the "10-breath rule" before responding to anything that makes you angry.'
  },
  {
    chapter: 18, verse: 66,
    sanskrit: 'సర్వధర్మాన్పరిత్యజ్య మామేకం శరణం వ్రజ।\nఅహం త్వా సర్వపాపేభ్యో మోక్షయిష్యామి మా శుచః॥',
    englishMeaning: 'Abandon all varieties of religion and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.',
    simpleExplanation: 'This is the ultimate promise of security and peace. By surrendering our worries to the Divine, we find freedom from fear and anxiety.',
    realLifeExample: 'When life feels overwhelming and you don\'t see a way out, offer your burdens to the Lord and trust that you are being guided.',
    tags: ['fear', 'anxiety', 'peace', 'loneliness', 'depression', 'purpose'],
    mentorTitle: 'The Ultimate Surrender',
    mentorTip: 'You are not alone. There is a higher power holding you.',
    mentorPractice: 'End your day by mentally handing over all your worries to Krishna. Say "I trust You."'
  },
  {
    chapter: 6, verse: 35,
    sanskrit: 'అసంశయం మహాబాహో మనో దుర్నిగ్రహం చలమ్।\nఅభ్యాసేన తు కౌన్తేయ వైరాగ్యేణ చ గృహ్యతే॥',
    englishMeaning: 'O mighty-armed son of Kunti, it is undoubtedly very difficult to curb the restless mind, but it is possible by suitable practice and by detachment.',
    simpleExplanation: 'Overthinking and lack of focus are natural tendencies of the mind. Consistency (Abhyasa) and non-attachment (Vairagya) are the tools to master it.',
    realLifeExample: 'If your mind wanders during work or meditation, gently bring it back without frustration. Do this repeatedly; that is the practice.',
    tags: ['overthinking', 'focus', 'discipline', 'stress'],
    mentorTitle: 'Mastering the Restless Mind',
    mentorTip: 'Don\'t fight the mind; train it with patience.',
    mentorPractice: 'Start a 5-minute daily focus session. Whenever your mind wanders, bring it back to your breath.'
  },
  {
    chapter: 12, verse: 15,
    sanskrit: 'యస్మాన్నోద్విజతే లోకో లోకాన్నోద్విజతే చ యః।\nహర్షామర్షభయోద్వేగైర్ముక్తో యః స చ మే ప్రియః॥',
    englishMeaning: 'He by whom no one is put into difficulty and who is not disturbed by anyone, who is freed from pleasure, envy, fear and anxiety, is very dear to Me.',
    simpleExplanation: 'True peace comes from emotional stability and kindness in relationships. Being a source of comfort to others also brings peace to ourselves.',
    realLifeExample: 'Try to react with empathy even when someone is being difficult. Your own peace will increase when you stop being reactive.',
    tags: ['relationships', 'peace', 'anxiety', 'anger'],
    mentorTitle: 'Harmony in Relationships',
    mentorTip: 'Be the calm in the middle of a storm.',
    mentorPractice: 'Today, consciously avoid saying anything that might hurt someone else\'s feelings.'
  },
  {
    chapter: 18, verse: 61,
    sanskrit: 'ఈశ్వరః సర్వభూతానాం హృద్దేశేऽర్జున తిష్ఠతి।\nభ్రామయన్సర్వభూతాని యన్త్రారూఢాని మాయయా॥',
    englishMeaning: 'The Supreme Lord is situated in everyone\'s heart, O Arjuna, and is directing the wanderings of all living entities, who are seated as on a machine, made of the material energy.',
    simpleExplanation: 'Understanding that the Divine is within everyone helps us overcome loneliness and find our true purpose.',
    realLifeExample: 'Whenever you feel lonely, sit quietly and feel the presence of the Divine within your own heart. You are never truly alone.',
    tags: ['loneliness', 'purpose', 'peace', 'depression'],
    mentorTitle: 'Divine Presence Within',
    mentorTip: 'Your greatest companion is already inside you.',
    mentorPractice: 'Spend 10 minutes in silence today, simply acknowledging the presence of the soul.'
  },
  {
    chapter: 2, verse: 11,
    sanskrit: 'అశోచ్యానన్వశోచస్త్వం ప్రజ్ఞావాదాంశ్చ భాషసే।\nగతాసూనగతాసూంశ్చ నానుశోచన్తి పణ్డితాః॥',
    englishMeaning: 'While speaking learned words, you are mourning for what is not worthy of grief. Those who are wise lament neither for the living nor for the dead.',
    simpleExplanation: 'Sadness often comes from attachment to temporary things. The wise understand the eternal nature of the soul and don\'t get consumed by grief.',
    realLifeExample: 'When you lose something or feel sad about a change, remind yourself that change is the nature of the world, but your inner self is unchanged.',
    tags: ['sadness', 'depression', 'peace', 'death', 'grief'],
    mentorTitle: 'Wisdom Beyond Grief',
    mentorTip: 'Look past the temporary to the eternal.',
    mentorPractice: 'When sad, ask yourself: "Will this matter in 5 years?" Shift your focus to what is permanent.'
  },
  {
    chapter: 4, verse: 39,
    sanskrit: 'శ్రద్ధావాన్లభతే జ్ఞానం తత్పరః సంయతేన్ద్రియః।\nజ్ఞానం లబ్ధ్వా పరాం శాన్తిమచిరేణాధిగచ్ఛతి॥',
    englishMeaning: 'The faithful, the devoted and the master of the senses attains knowledge, and having attained knowledge, he quickly attains the supreme peace.',
    simpleExplanation: 'Focus and discipline come from faith and self-control. This clarity leads to an immediate sense of peace.',
    realLifeExample: 'Dedicate yourself fully to a task without distractions. The deep focus itself will bring you a sense of calm and accomplishment.',
    tags: ['focus', 'discipline', 'peace', 'learning'],
    mentorTitle: 'Clarity through Devotion',
    mentorTip: 'Faith is the bridge to wisdom.',
    mentorPractice: 'Pick one thing you believe in and commit to it fully for just one hour today.'
  }
];

async function seedSlokas() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const data of slokaData) {
      const slokaId = data.chapter * 1000 + data.verse;
      await Sloka.findOneAndUpdate(
        { id: slokaId },
        { ...data, id: slokaId, isDaily: false },
        { upsert: true, new: true }
      );
      console.log(`Seeded Sloka ${data.chapter}.${data.verse}`);
    }

    console.log('Seeding complete. Triggering translation job for all new slokas...');
    
    // Create jobs for the new slokas
    const { Job } = require('./models');
    const newSlokas = await Sloka.find({ id: { $in: slokaData.map(d => d.chapter * 1000 + d.verse) } });
    
    for (const s of newSlokas) {
        await Job.create({
            type: 'all',
            contentId: s._id,
            contentType: 'Sloka',
            status: 'pending'
        });
    }

    console.log(`Created ${newSlokas.length} translation jobs.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedSlokas();
