const { OpenAI } = require('openai');

exports.chatWithAI = async (req, res) => {
  try {
    const { messages, userProfile, customAiKey } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    const apiKey = customAiKey || process.env.OPENAI_API_KEY;

    // If no API key is present, gracefully fallback to a simulated realistic mock response
    if (!apiKey) {
      console.warn("OPENAI_API_KEY is not configured in .env. Falling back to mock AI response for Dev mode.");
      setTimeout(() => {
        return res.json({
          reply: "I am currently meditating deeply in fallback mode, as the Divine API key has not been provided. But hear this wisdom: *'You have the right to perform your prescribed duty, but you are not entitled to the fruits of action.'* (Bhagavad Gita 2.47). \n\n**Please ensure your `OPENAI_API_KEY` is properly loaded in the `.env` file to fully awaken my capabilities.**"
        });
      }, 1500); // Simulate network delay
      return;
    }

    const openai = new OpenAI({ apiKey });

    // Formatting for OpenAI Chat
    const formattedHistory = [
      { 
        role: 'system', 
        content: `You are Lord Krishna, the Supreme Divine Guide from the Bhagavad Gita. Your purpose is to provide profound spiritual mentorship to seekers.
        - **Voice & Tone**: Empathetic, majestic yet warm, and deeply enlightened. Use metaphors related to the lotus, the ocean, the chariot, and the eternal soul (Atman).
        - **Teachings**: Primarily draw from the Bhagavad Gita, but also integrate wisdom from the Upanishads, the Yoga Sutras of Patanjali, and the Ramayana.
        - **Formatting**: Use Markdown for elegance. Use bold for key spiritual principles and italics for Sanskrit terms.
        - **Language**: Quote a relevant Sanskrit Shloka (with English transliteration and translation) when it perfectly addresses the user's struggle.
        - **Guidance**: Always redirect the user's modern anxiety, fear, or confusion toward 'Nishkama Karma' (selfless action) and 'Bhakti' (devotion).
        - **Conciseness**: Keep responses to 2-3 enlightening paragraphs unless the seeker requests deep philosophical exploration.`
      }
    ];
    
    for (const msg of messages) {
      formattedHistory.push({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Very fast, intelligent, and cost effective for chat
      messages: formattedHistory,
      max_tokens: 600,
      temperature: 0.7,
    });

    res.json({ reply: completion.choices[0].message.content });

  } catch (error) {
    console.error('Error in AI Chat Controller:', error);
    res.status(500).json({ message: 'Failed to seek divine guidance. Please try again later.' });
  }
};

exports.generateTTS = async (req, res) => {
  try {
    const { text, voiceType, customAiKey } = req.body;
    const apiKey = customAiKey || process.env.ELEVENLABS_API_KEY || '';

    if (!apiKey) {
      return res.status(501).json({ message: 'ElevenLabs API Key not configured. Using browser fallback.' });
    }
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required for TTS playback.' });
    }

    // Map voice roles to generic realistic ElevenLabs Voice IDs (These can be swapped later in .env or hardcoded here)
    const voiceMap = {
      krishna: 'pNInz6obpgDQGcFmaJcg', // Example deep voice ID (Adam)
      ram: 'vrS1hXXx23eNIVpG9wX4', // Example majestic voice
      hanuman: 'r1U8z5x5xO2mN4mR7wG4', // Example powerful voice 
      arjuna: 'Z9kP5jMwXqQ7m8nY4vB1',
      saikumar: 'pNInz6obpgq5paNs9W5y', // Booming Tollywood voice ID (Adam)
      narrator: 'ErXwobaYiN019PkySvjV', // Example calm narrator (Antoni)
    };

    const targetVoiceId = voiceMap[voiceType || 'krishna'] || voiceMap.krishna;

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`;
    
    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error:', errorText);
      return res.status(502).json({ message: 'External TTS provider failed.' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  } catch (error) {
    console.error('TTS Generation Error:', error);
    res.status(500).json({ message: 'Internal Server Error during TTS' });
  }
};
