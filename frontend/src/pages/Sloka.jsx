import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Share2, Bookmark, Volume2, Info, Pause } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ENV } from '../config/env';
import { socket } from '../services/socket';

export default function Sloka() {
  const API_BASE_URL = ENV.API_BASE_URL || '';
  const API_KEY = String(import.meta.env.VITE_APP_API_KEY || import.meta.env.VITE_PERMANENT_API_KEY || '').trim();
  const API_REQUEST_CONFIG = { headers: { 'x-api-key': API_KEY } };
  const { language: globalLanguage } = useLanguage();
  const [sloka, setSloka] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(globalLanguage);

  // Sync with global language changes
  useEffect(() => { setLanguage(globalLanguage); }, [globalLanguage]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  const [playbackType, setPlaybackType] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('saikumar');
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const getMeaningByLanguage = (currentSloka, selectedLanguage) => {
    if (!currentSloka) return '';
    const localized = currentSloka.localizedMeaning || {};
    
    // Check for specific localized meaning first
    if (localized[selectedLanguage]) return localized[selectedLanguage];
    
    // Fallback based on field naming convention
    const fieldMap = { hi: 'hindiMeaning', te: 'teluguMeaning', en: 'englishMeaning', ta: 'tamilMeaning', kn: 'kannadaMeaning', sa: 'sanskritMeaning' };
    const field = fieldMap[selectedLanguage];
    if (field && currentSloka[field]) return currentSloka[field];

    return currentSloka.englishMeaning || currentSloka.hindiMeaning || currentSloka.teluguMeaning || '';
  };

  const getAudioUrlByLanguage = (currentSloka, selectedLanguage) => {
    if (!currentSloka) return '';
    const audioByLanguage = currentSloka.audioByLanguage || {};
    return audioByLanguage[selectedLanguage] || currentSloka.audioUrl || '';
  };

  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';

  useEffect(() => {
    if (!isSpeechSupported) return undefined;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (Array.isArray(availableVoices) && availableVoices.length) {
        setVoices(availableVoices);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSpeechLang = (selectedLanguage) => {
    if (selectedLanguage === 'hi') return 'hi-IN';
    if (selectedLanguage === 'te') return 'te-IN';
    if (selectedLanguage === 'ta') return 'ta-IN';
    if (selectedLanguage === 'kn') return 'kn-IN';
    return 'en-US';
  };

  const getSpeechText = (currentSloka, selectedLanguage) => {
    if (!currentSloka) return '';
    const meaning = getMeaningByLanguage(currentSloka, selectedLanguage);
    return `${currentSloka.sanskrit}\n\n${meaning}`.trim();
  };

  const getSpeechVoice = (selectedLanguage) => {
    const voiceLanguageHints = {
      en: ['en-us', 'en-gb', 'en-in'],
      hi: ['hi-in', 'hi'],
      te: ['te-in', 'te'],
      ta: ['ta-in', 'ta'],
      kn: ['kn-in', 'kn'],
    };

    const hints = voiceLanguageHints[selectedLanguage] || voiceLanguageHints.en;
    const normalizedVoices = voices.map((voice) => ({ ...voice, normalizedLang: String(voice.lang || '').toLowerCase(), normalizedName: String(voice.name || '').toLowerCase() }));

    for (const hint of hints) {
      const byLang = normalizedVoices.find((voice) => voice.normalizedLang.startsWith(hint));
      if (byLang) return byLang;

      const byName = normalizedVoices.find((voice) => voice.normalizedName.includes(hint.replace('-', '')));
      if (byName) return byName;
    }

    return normalizedVoices.find((voice) => voice.default) || normalizedVoices[0] || null;
  };

  const getVoiceLabel = () => {
    if (!isSpeechSupported) return 'Browser narration unavailable';
    if (!voices.length) return 'Loading voices';

    const voice = getSpeechVoice(language);
    if (!voice) return 'Default browser voice';

    const normalizedName = String(voice.name || '').toLowerCase();
    const normalizedLang = String(voice.lang || '').toLowerCase();

    if (language === 'hi' && (normalizedLang.startsWith('hi') || normalizedName.includes('hindi'))) {
      return `Hindi voice: ${voice.name}`;
    }

    if (language === 'te' && (normalizedLang.startsWith('te') || normalizedName.includes('telugu'))) {
      return `Telugu voice: ${voice.name}`;
    }
    
    if (language === 'ta' && (normalizedLang.startsWith('ta') || normalizedName.includes('tamil'))) {
      return `Tamil voice: ${voice.name}`;
    }

    if (language === 'kn' && (normalizedLang.startsWith('kn') || normalizedName.includes('kannada'))) {
      return `Kannada voice: ${voice.name}`;
    }

    if (language === 'en' && normalizedLang.startsWith('en')) {
      return `English voice: ${voice.name}`;
    }

    return `Fallback voice: ${voice.name}`;
  };

  const activeAudioUrl = getAudioUrlByLanguage(sloka, language);
  const canPlayAudio = Boolean(activeAudioUrl) || isSpeechSupported;

  const stopPlayback = () => {
    if (playbackType === 'file' && audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (playbackType === 'speech' && isSpeechSupported) {
      window.speechSynthesis.cancel();
    }

    setIsPlaying(false);
    setPlaybackType(null);
  };

  const startPlayback = async (selectedLanguage = language) => {
    const currentAudioUrl = getAudioUrlByLanguage(sloka, selectedLanguage);

    if (currentAudioUrl) {
      const newAudio = new Audio(currentAudioUrl);
      setAudio(newAudio);
      setPlaybackType('file');
      setIsPlaying(true);
      newAudio.play().catch((e) => {
        console.error('Audio playback failed', e);
        setIsPlaying(false);
        setPlaybackType(null);
      });
      newAudio.onended = () => {
        setIsPlaying(false);
        setPlaybackType(null);
      };
      return;
    }

    const speechText = getSpeechText(sloka, selectedLanguage);
    if (!speechText) return;

    setPlaybackType('loading');
    setIsPlaying(true);

    try {
      const customTtsKey = localStorage.getItem('elevenlabsApiKey') || '';
      const response = await axios.post(`${API_BASE_URL}/api/ai/tts`, {
        text: speechText,
        voiceType: selectedVoice,
        customAiKey: customTtsKey
      }, {
        headers: { 'x-api-key': API_KEY },
        responseType: 'arraybuffer'
      });

      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const newAudio = new Audio(audioUrl);
      
      setAudio(newAudio);
      setPlaybackType('api');
      
      newAudio.play().catch((e) => {
        console.error('AI Audio playback failed', e);
        fallbackToSpeech(speechText, selectedLanguage);
      });

      newAudio.onended = () => {
        setIsPlaying(false);
        setPlaybackType(null);
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.warn('AI TTS failed, falling back to browser speech:', error);
      fallbackToSpeech(speechText, selectedLanguage);
    }
  };

  const fallbackToSpeech = (text, selectedLanguage) => {
    if (!isSpeechSupported) {
      setIsPlaying(false);
      setPlaybackType(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechLang(selectedLanguage);
    utterance.voice = getSpeechVoice(selectedLanguage);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => {
      setIsPlaying(false);
      setPlaybackType(null);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setPlaybackType(null);
    };

    setPlaybackType('speech');
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const fetchSloka = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/slokas/daily`, API_REQUEST_CONFIG);
        setSloka(response.data);
        
        const token = localStorage.getItem('token');
        if (token) {
          axios.post(`${API_BASE_URL}/api/auth/streak`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res => {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData) {
              userData.streak = res.data.streak;
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }).catch(err => console.error("Streak update failed:", err));
        }
      } catch (error) {
        console.error('Error fetching sloka:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSloka();

    const handleContentUpdate = (data) => {
      if (data && data.type === 'slokas') {
        console.log('[SOCKET] Slokas updated, refreshing Sloka.jsx...');
        fetchSloka();
      }
    };
    socket.on('content_updated', handleContentUpdate);

    return () => {
      socket.off('content_updated', handleContentUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPlaying || !sloka) return;

    stopPlayback();
    startPlayback(language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const toggleAudio = () => {
    if (isPlaying) {
      stopPlayback();
      if (isSpeechSupported) {
        window.speechSynthesis.cancel();
      }
    } else {
      startPlayback(language);
    }
  };

  const handleSaveVerse = async () => {
    if (!sloka?.id) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setActionError('Please login to save this verse.');
      setTimeout(() => setActionError(''), 2500);
      return;
    }

    try {
      setBookmarkLoading(true);
      setActionError('');
      setActionMessage('');

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/bookmarks`,
        { slokaId: sloka.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const removed = String(response.data?.message || '').toLowerCase().includes('removed');
      setIsBookmarked(!removed);
      setActionMessage(removed ? 'Verse removed from saved list.' : 'Verse saved successfully.');
      setTimeout(() => setActionMessage(''), 2500);
    } catch (error) {
      setActionError(error.response?.data?.message || 'Failed to save verse.');
      setTimeout(() => setActionError(''), 2500);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShareVerse = async () => {
    if (!sloka) return;

    const verseTitle = `Bhagavad Gita ${sloka.chapter}:${sloka.verse}`;
    const verseText = `${verseTitle}\n\n${sloka.sanskrit}\n\n${getMeaningByLanguage(sloka, language)}`;

    try {
      setActionError('');
      if (navigator.share) {
        await navigator.share({
          title: verseTitle,
          text: verseText,
          url: window.location.href,
        });
        setActionMessage('Verse shared successfully.');
      } else {
        await navigator.clipboard.writeText(verseText);
        setActionMessage('Verse copied to clipboard.');
      }
      setTimeout(() => setActionMessage(''), 2500);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setActionError('Unable to share right now. Please try again.');
      setTimeout(() => setActionError(''), 2500);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-[#06101E] text-white overflow-hidden">
      {/* Background with overlay handled by App.jsx, adding specific glow */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.14),transparent_30%),radial-gradient(circle_at_bottom,rgba(122,46,46,0.18),transparent_28%)]"></div>

      <div className="relative z-10 max-w-5xl w-full mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block px-4 py-1 rounded-full border border-devotion-gold/30 bg-devotion-gold/10 backdrop-blur-md mb-6 text-devotion-gold text-[10px] font-black tracking-[0.3em] shadow-[0_0_15px_rgba(255,215,0,0.1)] uppercase">
            Divine Wisdom for Today
          </div>
          <h1 className="text-6xl md:text-8xl tv:text-[8rem] font-serif font-black text-devotion-gold drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] tracking-tighter">
            Daily <span className="text-white opacity-90 italic font-light drop-shadow-none tracking-normal">Sloka</span>
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96 bg-glass-gradient backdrop-blur-3xl rounded-[3rem] border border-devotion-gold/20 shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-devotion-gold"></div>
          </div>
        ) : sloka && (
          <div 
            className="bg-glass-gradient backdrop-blur-3xl rounded-[3rem] border border-devotion-gold/30 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.4)] transition-all duration-300 ease-out preserve-3d"
            onMouseMove={(e) => {
              const card = e.currentTarget;
              const rect = card.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const rotateX = ((y - centerY) / centerY) * -5;
              const rotateY = ((x - centerX) / centerX) * 5;
              card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            }}
          >
            
            <div className="flex justify-between items-center bg-devotion-darkBlue/40 px-10 py-6 border-b border-devotion-gold/20">
              <span className="text-devotion-gold font-black tracking-[0.2em] text-xs uppercase">
                CHAPTER {sloka.chapter} • VERSE {sloka.verse}
              </span>
              
              <div className="flex flex-wrap gap-2 bg-devotion-darkBlue/60 rounded-3xl p-1 border border-white/10 backdrop-blur-md">
                {[
                  { id: 'en', label: 'English' },
                  { id: 'hi', label: 'Hindi' },
                  { id: 'te', label: 'తెలుగు' },
                  { id: 'ta', label: 'தமிழ்' },
                  { id: 'kn', label: 'ಕನ್ನಡ' },
                  { id: 'sa', label: 'संस्कृतम्' }
                ].map(lang => (
                  <button 
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`tv-focusable px-4 py-1.5 tv:px-6 tv:py-2.5 rounded-full text-[9px] tv:text-xs font-black uppercase tracking-widest transition-all ${language === lang.id ? 'bg-devotion-gold text-devotion-darkBlue shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-10 md:p-20 text-center relative">
              <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none select-none flex items-center justify-center">
                 <img src="/krishna-line-art.svg" alt="" className="w-1/2 h-auto" />
              </div>

              <div className="mb-12 relative z-10">
                <p className="text-3xl md:text-5xl tv:text-7xl text-white font-serif leading-[1.6] whitespace-pre-line drop-shadow-2xl" style={{ transform: 'translateZ(60px)' }}>
                  {sloka.sanskrit}
                </p>
              </div>
              
              <div className="mt-16 relative z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 text-8xl text-devotion-gold/10 font-serif select-none italic">"</div>
                <p className={`text-xl md:text-3xl tv:text-5xl text-gray-200 font-light leading-relaxed px-4 italic font-serif ${language === 'telugu' ? 'font-telugu leading-[2]' : ''}`}>
                  {getMeaningByLanguage(sloka, language)}
                </p>
              </div>
            </div>

            <div className="bg-devotion-darkBlue/25 px-10 py-4 border-t border-devotion-gold/15 flex flex-wrap items-center justify-between gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-devotion-gold/70">
                AI Voice Style
              </span>
              <div className="flex flex-wrap gap-2 bg-devotion-darkBlue/60 rounded-2xl p-1 border border-white/5 backdrop-blur-md">
                {[
                  { id: 'saikumar', label: 'Tollywood' },
                  { id: 'krishna', label: 'Soothing' },
                  { id: 'ram', label: 'Gentle' },
                  { id: 'hanuman', label: 'Strong' }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVoice(v.id);
                      if (isPlaying) {
                        stopPlayback();
                      }
                    }}
                    className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedVoice === v.id ? 'bg-[#FF7A00] text-devotion-darkBlue font-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-devotion-darkBlue/40 px-10 py-8 border-t border-devotion-gold/20 flex flex-wrap justify-center gap-8">
              <button 
                onClick={toggleAudio}
                disabled={!canPlayAudio}
                className={`tv-focusable ${canPlayAudio ? 'text-devotion-gold hover:text-white' : 'text-gray-600 cursor-not-allowed'} transition-all flex items-center gap-3 font-black uppercase tracking-[0.2em] text-[10px] tv:text-sm transform hover:scale-105`}
              >
                {isPlaying ? <Pause className="w-6 h-6 tv:w-8 tv:h-8 fill-current animate-pulse" /> : <Volume2 className="w-6 h-6 tv:w-8 tv:h-8" />}
                {isPlaying ? 'STOP CHANTING' : activeAudioUrl ? 'LISTEN CHANT' : 'AUTO NARRATE'}
              </button>
              
              <button
                onClick={handleSaveVerse}
                disabled={bookmarkLoading}
                className="tv-focusable text-gray-400 hover:text-devotion-gold transition-all flex items-center gap-3 font-black uppercase tracking-[0.2em] text-[10px] tv:text-sm transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bookmark className="w-6 h-6 tv:w-8 tv:h-8" />
                {bookmarkLoading ? 'SAVING...' : isBookmarked ? 'SAVED' : 'SAVE VERSE'}
              </button>
              
              <button
                onClick={handleShareVerse}
                className="tv-focusable text-gray-400 hover:text-devotion-gold transition-all flex items-center gap-3 font-black uppercase tracking-[0.2em] text-[10px] tv:text-sm transform hover:scale-105"
              >
                <Share2 className="w-6 h-6 tv:w-8 tv:h-8" />
                SHARE WISDOM
              </button>
            </div>

            <div className="px-10 pb-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
              {isPlaying
                ? playbackType === 'loading'
                  ? 'Invoking Divine Voice...'
                  : playbackType === 'file'
                    ? 'Playing uploaded audio'
                    : playbackType === 'api' ? 'Using Divine AI Narration' : 'Using browser narration'
                : activeAudioUrl
                  ? 'Audio ready for selected language'
                  : 'Divine AI Narration ready'}
            </div>

            <div className="px-10 pb-6 text-center text-[10px] font-black uppercase tracking-[0.25em] text-devotion-gold/70">
              {getVoiceLabel()}
            </div>

            {(actionMessage || actionError) && (
              <div className={`px-10 pb-8 text-center text-sm font-semibold ${actionError ? 'text-red-300' : 'text-devotion-gold'}`}>
                {actionError || actionMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Card */}
      {!loading && sloka && (
        <div className="mt-12 max-w-4xl w-full bg-glass-gradient backdrop-blur-2xl rounded-3xl p-8 border border-white/5 flex items-start gap-6 animate-fade-in-up shadow-2xl">
           <div className="bg-devotion-gold/10 p-4 rounded-2xl border border-devotion-gold/20"><Info className="text-devotion-gold w-8 h-8" /></div>
           <div>
              <h4 className="text-devotion-gold font-black uppercase tracking-widest text-xs mb-2">Devotional Tip</h4>
              <p className="text-gray-300 text-lg font-light leading-relaxed">Contemplating on a single verse throughout the day brings deep inner peace. Try to memorize this sloka to carry Krishna's wisdom with you always.</p>
           </div>
        </div>
      )}
    </div>
  );
}
