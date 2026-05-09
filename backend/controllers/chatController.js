const { OpenAI } = require('openai');

// ─── Curated Bhagavad Gita Wisdom Database ───
const GITA_WISDOM = [
  {
    keywords: ['stress', 'anxiety', 'worry', 'tension', 'fear', 'scared', 'nervous', 'panic'],
    verse: 'Bhagavad Gita 2.47',
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
    translation: 'You have the right to perform your prescribed duty, but you are not entitled to the fruits of action.',
    advice: "Dear seeker, anxiety comes when we try to control what is beyond our hands. Lord Krishna teaches us to **focus only on our actions**, not the results. Do your best today — study, work, love — and release attachment to outcomes. When you stop fearing failure, peace flows naturally. 🙏\n\n*Take 5 deep breaths right now. Inhale peace, exhale worry.*"
  },
  {
    keywords: ['sad', 'depression', 'unhappy', 'lonely', 'alone', 'crying', 'hopeless', 'pain', 'suffering'],
    verse: 'Bhagavad Gita 2.14',
    sanskrit: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः',
    translation: 'The contacts of the senses with their objects, O son of Kunti, give rise to cold and heat, pleasure and pain. They are transient — they come and go. Bear them patiently.',
    advice: "Beloved soul, your sadness is temporary — like clouds passing before the sun. Krishna reminds us that **both joy and sorrow are fleeting**. This pain you feel is not permanent. You are the eternal soul (Atman), untouched by temporary experiences.\n\nLet yourself feel it, but don't become it. Brighter days are already on their way. 💛"
  },
  {
    keywords: ['anger', 'angry', 'rage', 'frustrated', 'irritated', 'hate', 'revenge'],
    verse: 'Bhagavad Gita 2.63',
    sanskrit: 'क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः',
    translation: 'From anger comes delusion; from delusion, confusion of memory; from confusion of memory, loss of reason; and from loss of reason, one is completely ruined.',
    advice: "Dear friend, anger is like holding a burning coal — **it burns you more than the other person**. Krishna warns that anger clouds our judgment and leads us down a destructive path.\n\nBefore reacting, pause for 10 seconds. Ask yourself: *Will this matter in 5 years?* Usually, the answer brings instant peace. Choose wisdom over wrath. 🕉️"
  },
  {
    keywords: ['love', 'relationship', 'breakup', 'heartbreak', 'partner', 'marriage', 'girlfriend', 'boyfriend'],
    verse: 'Bhagavad Gita 6.5',
    sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्',
    translation: 'One must elevate oneself by one\'s own mind, not degrade oneself. The mind alone is the friend of the soul, and the mind alone is the enemy of the soul.',
    advice: "Precious seeker, true love begins with **loving yourself first**. Krishna teaches that your greatest relationship is with your own soul. A heartbreak is not your ending — it is the universe redirecting you toward something more aligned with your dharma.\n\nHeal first. Grow first. The right person will arrive when you are whole within yourself. 💕"
  },
  {
    keywords: ['career', 'job', 'work', 'business', 'money', 'success', 'failure', 'interview', 'exam', 'study'],
    verse: 'Bhagavad Gita 3.35',
    sanskrit: 'श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्',
    translation: 'It is better to perform one\'s own duty imperfectly than to perform another\'s duty perfectly.',
    advice: "Dear aspirant, stop comparing your journey with others. Krishna says your **own path (svadharma)**, even if imperfect, is more sacred than perfectly copying someone else's life.\n\nFocus on what YOU are naturally drawn to. Work with dedication without obsessing over results. Success is not a destination — it is the integrity with which you walk your path. 📿"
  },
  {
    keywords: ['death', 'dying', 'die', 'loss', 'grief', 'mourning', 'funeral', 'passed away'],
    verse: 'Bhagavad Gita 2.22',
    sanskrit: 'वासांसि जीर्णानि यथा विहाय नवानि गृह्णाति नरोऽपराणि',
    translation: 'As a person puts on new garments, giving up old ones, the soul similarly accepts new material bodies, giving up the old and useless ones.',
    advice: "Beloved one, the soul never dies. Krishna beautifully compares death to **changing clothes** — the body is shed, but the eternal Atman moves forward. Your loved one is not gone; they have simply changed form.\n\nGrieve with love, but know that the soul's journey continues eternally. They are at peace. And one day, you will understand this divine design. 🙏✨"
  },
  {
    keywords: ['god', 'faith', 'believe', 'prayer', 'spiritual', 'meditation', 'yoga', 'purpose', 'meaning', 'life'],
    verse: 'Bhagavad Gita 9.22',
    sanskrit: 'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते',
    translation: 'To those who worship Me with devotion, meditating on My transcendental form, I carry what they lack and preserve what they have.',
    advice: "Beautiful soul, the divine is not far away — **God dwells within your own heart**. Krishna promises that when you turn toward the divine with sincerity, the universe itself conspires to support you.\n\nStart small: 5 minutes of silent meditation each morning. Close your eyes, breathe deeply, and simply say *\"I am at peace.\"* The answers you seek will come from within. 🙏🙏"
  },
  {
    keywords: ['confused', 'lost', 'direction', 'decision', 'choice', 'what should i do', 'help', 'guide', 'advice'],
    verse: 'Bhagavad Gita 18.66',
    sanskrit: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज',
    translation: 'Abandon all varieties of dharma and simply surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.',
    advice: "Dear seeker, when life feels overwhelming and you don't know which way to turn, Krishna offers the most beautiful advice: **surrender**. This doesn't mean giving up — it means trusting the divine plan.\n\nDo your best with what you know today. Make the decision that feels most aligned with truth and kindness. The rest will unfold perfectly. You are never truly lost — you are simply finding your way. 🌟"
  },
  {
    keywords: ['hello', 'hi', 'hey', 'namaste', 'start', 'who are you', 'what can you do'],
    verse: 'Bhagavad Gita 4.7',
    sanskrit: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत',
    translation: 'Whenever there is a decline in righteousness and an increase in unrighteousness, O Arjuna, at that time I manifest Myself.',
    advice: "🙏 **Namaste, dear seeker!** I am your Gita Mentor — a spiritual guide inspired by the timeless wisdom of the Bhagavad Gita.\n\nYou can ask me about:\n• Stress, anxiety, or worry\n• Relationships and love\n• Career and purpose\n• Grief and loss\n• Faith and meditation\n• Any life challenge\n\nSpeak from your heart, and I shall share Krishna's divine wisdom to light your path. 🙏✨"
  },
  {
    keywords: ['thank', 'thanks', 'grateful', 'appreciate'],
    verse: 'Bhagavad Gita 12.13',
    sanskrit: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च',
    translation: 'One who is not envious but is a kind friend to all living entities — such a devotee is very dear to Me.',
    advice: "Your gratitude itself is a form of devotion, dear one. 🙏 Krishna smiles upon a grateful heart.\n\nRemember: **every challenge you overcome makes you wiser, every kindness you show makes you divine.** Continue walking the path of dharma with this beautiful spirit.\n\nI am always here whenever you need guidance. Hare Krishna! 🙏✨"
  }
];

// Intelligent keyword-matching fallback engine
function getOfflineWisdom(message) {
  const lowerMessage = message.toLowerCase();
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const wisdom of GITA_WISDOM) {
    let score = 0;
    for (const keyword of wisdom.keywords) {
      if (lowerMessage.includes(keyword)) {
        score += keyword.length; // Longer keyword matches are more specific
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = wisdom;
    }
  }
  
  // Default wisdom if no keyword matches
  if (!bestMatch) {
    bestMatch = GITA_WISDOM[7]; // The "confused/lost/help" entry
  }
  
  return `**${bestMatch.verse}**\n\n*${bestMatch.sanskrit}*\n\n> "${bestMatch.translation}"\n\n${bestMatch.advice}`;
}

exports.chatMentor = async (req, res) => {
  try {
    const { message, customAiKey, language = 'en' } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ reply: 'Message is required and must be text.' });
    }
    
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({ reply: 'Message cannot be empty.' });
    }
    
    if (trimmedMessage.length > 500) {
      return res.status(400).json({ reply: 'The burden of words is too heavy. Please keep your message under 500 characters.' });
    }

    // Resolve language name for AI prompt
    const languageMap = {
      'en': 'English', 'hi': 'Hindi', 'te': 'Telugu', 'ta': 'Tamil', 'kn': 'Kannada', 
      'ml': 'Malayalam', 'bn': 'Bengali', 'mr': 'Marathi', 'gu': 'Gujarati', 'pa': 'Punjabi',
      'sa': 'Sanskrit', 'ur': 'Urdu', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
      'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic', 'zh': 'Chinese'
    };
    const targetLanguageName = languageMap[language] || 'English';

    // Try DeepSeek AI or Custom AI Key first
    const apiKey = customAiKey || process.env.DEEPSEEK_API_KEY;

    if (apiKey) {
      try {
        const isCustomKey = Boolean(customAiKey);
        const openai = new OpenAI({
          apiKey,
          baseURL: isCustomKey && !customAiKey.startsWith('sk-') ? undefined : 'https://api.deepseek.com',
        });

        const completion = await openai.chat.completions.create({
          model: "deepseek-chat",
          messages: [
            { 
              role: 'system', 
              content: `You are Gita Mentor, a spiritual guide based on Bhagavad Gita. 
              Respond strictly in ${targetLanguageName}. 
              Give practical life advice with simple explanations. Be warm, compassionate, and divine. 
              Keep responses concise (2-3 paragraphs). If relevant, quote a Sanskrit verse with translation in ${targetLanguageName}. 
              Use markdown formatting.`
            },
            { role: 'user', content: trimmedMessage }
          ],
          max_tokens: 400,
          temperature: 0.7,
        });

        const reply = completion.choices[0].message.content;
        return res.status(200).json({ reply });
      } catch (aiError) {
        console.warn('DeepSeek API unavailable, falling back to offline wisdom:', aiError.message);
        // Fall through to offline wisdom below
      }
    }

    // Offline Gita Wisdom Fallback — always works, zero API cost
    const reply = getOfflineWisdom(trimmedMessage);
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Error in chatMentor controller:', error.message || error);
    return res.status(200).json({ 
      reply: getOfflineWisdom(req.body?.message || 'help')
    });
  }
};
