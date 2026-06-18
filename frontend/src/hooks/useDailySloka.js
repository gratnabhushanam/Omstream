import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { requestNotificationPermission, sendNotification } from '../utils/notificationService';

// Use Vite proxy in dev, direct URL in prod
const SLOKA_API = import.meta.env.MODE === 'production'
  ? (import.meta.env.VITE_API_BASE_URL || 'https://gita-wisdom-1.onrender.com')
  : '';
const API_KEY = String(import.meta.env.VITE_APP_API_KEY || import.meta.env.VITE_PERMANENT_API_KEY || 'spiritual-wisdom-permanent-key-2025').trim();

const HISTORY_KEY = 'daily_sloka_history_v1';
const SAVED_VERSES_KEY = 'daily_saved_verses_v1';
const MIN_DAILY_DATE_KEY = '2026-01-01';

const formatLocalDateKey = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getTodayDateKey = () => formatLocalDateKey();

export const useDailySloka = () => {
  const todayDateKey = getTodayDateKey();
  const defaultDateKey = todayDateKey < MIN_DAILY_DATE_KEY ? MIN_DAILY_DATE_KEY : todayDateKey;

  const [dailySloka, setDailySloka] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('english');
  const [isPlaying, setIsPlaying] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [voices, setVoices] = useState([]);
  const [history, setHistory] = useState([]);
  const [savedVerses, setSavedVerses] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [playbackSource, setPlaybackSource] = useState(null);
  const [selectedDateKey, setSelectedDateKey] = useState(defaultDateKey);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const location = useLocation();
  const audioRef = useRef(null);

  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';

  useEffect(() => {
    if (isSpeechSupported) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (Array.isArray(availableVoices) && availableVoices.length) {
          setVoices(availableVoices);
        }
      };
      loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }
  }, []);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (isSpeechSupported) {
      window.speechSynthesis.cancel();
    }
  }, [isSpeechSupported]);

  useEffect(() => {
    const savedVerse = location.state && location.state.savedVerse;
    if (savedVerse && hasValidSloka(savedVerse)) {
      setDailySloka({
        ...savedVerse,
        localizedMeaning: {
          english: savedVerse.englishMeaning || '',
          hindi: savedVerse.hindiMeaning || savedVerse.englishMeaning || '',
          telugu: savedVerse.teluguMeaning || savedVerse.englishMeaning || '',
        },
      });
      setLoading(false);
      setSaveStatus('Loaded saved verse');
      window.setTimeout(() => setSaveStatus(''), 2000);
    } else {
      fetchDailySloka();
    }

    checkNotificationStatus();
    loadHistory();
    loadSavedVerses();
  }, [location.state]);

  const hasValidSloka = (payload) => Boolean(payload && typeof payload.sanskrit === 'string' && payload.sanskrit.trim().length > 0);

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${SLOKA_API}/api/slokas/daily/history`, { headers: { 'x-api-key': API_KEY } });
      const apiItems = response.data && Array.isArray(response.data.items) ? response.data.items : [];
      if (apiItems.length) {
        setHistory(apiItems);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(apiItems));
        return;
      }
    } catch (error) {
      console.error('Failed to load API daily history, using local cache:', error);
    }

    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setHistory(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error('Failed to load daily sloka history:', error);
      setHistory([]);
    }
  };

  const loadSavedVerses = () => {
    try {
      const raw = localStorage.getItem(SAVED_VERSES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setSavedVerses(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error('Failed to load saved daily verses:', error);
      setSavedVerses([]);
    }
  };

  const getVerseKey = (item) => `${item.chapter || '0'}:${item.verse || '0'}:${String(item.sanskrit || '').trim()}`;

  const saveHistory = async (entry) => {
    try {
      await axios.post(`${SLOKA_API}/api/slokas/daily/history`, entry, { headers: { 'x-api-key': API_KEY } });
    } catch (error) {
      console.error('Failed to save daily history to API, using local cache:', error);
    }

    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const base = Array.isArray(parsed) ? parsed : [];
      const deduped = base.filter((item) => item.dailyKey !== entry.dailyKey && item.id !== entry.id);
      const next = [entry, ...deduped].slice(0, 30);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      setHistory(next);
    } catch (error) {
      console.error('Failed to save daily sloka history:', error);
    }
  };

  const shiftDateKey = (dateKey, offsetDays) => {
    const parsed = new Date(dateKey);
    const safe = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    safe.setDate(safe.getDate() + offsetDays);
    const yyyy = safe.getFullYear();
    const mm = String(safe.getMonth() + 1).padStart(2, '0');
    const dd = String(safe.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const clampDateKey = (dateKey) => {
    const safeDateKey = String(dateKey || '').trim();
    if (!safeDateKey) return selectedDateKey;
    const todayKey = getTodayDateKey();
    if (safeDateKey > todayKey) return todayKey;
    if (safeDateKey < MIN_DAILY_DATE_KEY) return MIN_DAILY_DATE_KEY;
    return safeDateKey;
  };

  const fetchDailySloka = async (dateKey = selectedDateKey) => {
    setLoading(true);
    try {
      const response = await axios.get(`${SLOKA_API}/api/slokas/daily?date=${encodeURIComponent(dateKey)}`, { headers: { 'x-api-key': API_KEY } });
      const payload = response.data;
      if (hasValidSloka(payload)) {
        setDailySloka(payload);
        await saveHistory({
          id: payload.id,
          chapter: payload.chapter,
          verse: payload.verse,
          sanskrit: payload.sanskrit,
          englishMeaning: payload.englishMeaning || (payload.localizedMeaning && payload.localizedMeaning.english) || '',
          dailyKey: dateKey || payload.dailyKey || new Date().toISOString().slice(0, 10),
          viewedAt: new Date().toISOString(),
        });
      } else {
        setDailySloka(null);
      }
    } catch (error) {
      console.error('Error fetching daily sloka:', error);
      setDailySloka(null);
    } finally {
      setLoading(false);
    }
  };

  const openPreviousDay = async () => {
    stopPlayback();
    if (selectedDateKey <= MIN_DAILY_DATE_KEY) {
      setSaveStatus('Calendar starts from 2026-01-01');
      window.setTimeout(() => setSaveStatus(''), 2000);
      return;
    }
    const previousDate = shiftDateKey(selectedDateKey, -1);
    setSelectedDateKey(previousDate);
    await fetchDailySloka(previousDate);
  };

  const handleDateSelection = async (event) => {
    const pickedDate = String(event.target.value || '').trim();
    if (!pickedDate) return;
    const todayKey = getTodayDateKey();
    if (pickedDate > todayKey) {
      setSaveStatus('Future dates are disabled');
      window.setTimeout(() => setSaveStatus(''), 2000);
    }
    if (pickedDate < MIN_DAILY_DATE_KEY) {
      setSaveStatus('Calendar starts from 2026-01-01');
      window.setTimeout(() => setSaveStatus(''), 2000);
    }

    const normalizedDate = clampDateKey(pickedDate);
    if (normalizedDate !== pickedDate) {
      event.target.value = normalizedDate;
    }

    stopPlayback();
    setSelectedDateKey(normalizedDate);
    await fetchDailySloka(normalizedDate);
  };

  const checkNotificationStatus = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const hasPermission = Notification.permission === 'granted';
    setNotificationEnabled(hasPermission);
  };

  const enableNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationEnabled(permission === 'granted');
    if (permission === 'granted' && dailySloka) {
      sendNotification('Daily Sloka', {
        body: dailySloka.sanskrit,
        tag: 'daily-sloka',
        requireInteraction: false,
      });
    }
  };

  const getMeaningByLanguage = (sloka, lang) => {
    if (!sloka) return '';
    
    const code = String(lang || 'en').toLowerCase().substring(0, 2);

    // Priority 1: Authentic scraped fields (Highest accuracy)
    if ((lang === 'telugu' || code === 'te') && sloka.teluguMeaning) return sloka.teluguMeaning;
    if ((lang === 'hindi' || code === 'hi') && sloka.hindiMeaning) return sloka.hindiMeaning;
    if ((lang === 'english' || code === 'en') && sloka.englishMeaning) return sloka.englishMeaning;

    // Priority 2: Unified translations object (AI Generated - may contain mock '[te] English' data)
    // We only use this if the authentic field is missing
    if (sloka.translations?.[lang]?.meaning) {
      const mockMeaning = sloka.translations[lang].meaning;
      // If it's a mock string like "[te] English meaning", we ignore it and fallback to English
      if (!mockMeaning.startsWith('[')) {
         return mockMeaning;
      }
    }
    
    const localized = sloka.localizedMeaning || {};
    if (localized[code]) return localized[code];
    if (localized[lang]) return localized[lang];

    // Priority 3: Other field-based meanings and fallbacks
    if (lang === 'tamil' || code === 'ta') return sloka.tamilMeaning || sloka.englishMeaning || '';
    if (lang === 'kannada' || code === 'kn') return sloka.kannadaMeaning || sloka.englishMeaning || '';
    if (lang === 'malayalam' || code === 'ml') return sloka.malayalamMeaning || sloka.englishMeaning || '';
    
    return sloka.englishMeaning || '';
  };

  const getExplanationByLanguage = (sloka, lang) => {
    if (!sloka) return '';
    
    // Priority 1: Unified translations object (AI Generated) - mapped to 'insight' or 'explanation'
    if (sloka.translations?.[lang]?.insight) return sloka.translations[lang].insight;
    if (sloka.translations?.[lang]?.explanation) return sloka.translations[lang].explanation;
    
    if (lang === 'en') return sloka.simpleExplanation || '';
    const localized = sloka.localizedExplanation || {};
    const code = String(lang || 'en').toLowerCase().substring(0, 2);
    return localized[code] || sloka.simpleExplanation || '';
  };

  const getExampleByLanguage = (sloka, lang) => {
    if (!sloka) return '';
    
    // Priority 1: Unified translations object (AI Generated) - mapped to 'example' or 'wisdom'
    if (sloka.translations?.[lang]?.example) return sloka.translations[lang].example;
    if (sloka.translations?.[lang]?.wisdom) return sloka.translations[lang].wisdom;
    
    if (lang === 'en') return sloka.realLifeExample || '';
    const localized = sloka.localizedExample || {};
    const code = String(lang || 'en').toLowerCase().substring(0, 2);
    return localized[code] || sloka.realLifeExample || '';
  };

  const getAudioByLanguage = (sloka, lang) => {
    if (!sloka) return '';
    const audioByLanguage = sloka.audioByLanguage || {};
    const code = String(lang || 'en').toLowerCase().substring(0, 2);
    
    // Priority 1: New dynamic audio Map (AI generated)
    if (audioByLanguage[code]) return audioByLanguage[code];
    if (audioByLanguage[lang]) return audioByLanguage[lang];

    // Priority 2: Legacy dedicated fields
    if (code === 'en') return sloka.audioUrlEnglish || sloka.audioUrl || '';
    if (code === 'hi') return sloka.audioUrlHindi || sloka.audioUrl || '';
    if (code === 'te') return sloka.audioUrlTelugu || sloka.audioUrl || '';
    if (code === 'ta') return sloka.audioUrlTamil || sloka.audioUrl || '';
    if (code === 'kn') return sloka.audioUrlKannada || sloka.audioUrl || '';
    if (code === 'ml') return sloka.audioUrlMalayalam || sloka.audioUrl || '';
    
    return sloka.audioUrl || '';
  };

  const resolveAudioUrl = (rawUrl) => {
    const value = String(rawUrl || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/')) return `${API_ORIGIN}${value}`;
    return value;
  };

  const getSpeechLang = (lang) => {
    if (lang === 'hindi') return 'hi-IN';
    if (lang === 'telugu') return 'te-IN';
    return 'en-US';
  };

  const getSpeechText = (sloka, lang) => {
    if (!sloka) return '';
    const meaning = getMeaningByLanguage(sloka, lang);
    return `${sloka.sanskrit}\n\n${meaning}`.trim();
  };

  const getSpeechVoice = (lang) => {
    const voiceLanguageHints = {
      english: ['en-us', 'en-gb', 'en-in'],
      hindi: ['hi-in', 'hi'],
      telugu: ['te-in', 'te'],
    };
    const hints = voiceLanguageHints[lang] || voiceLanguageHints.english;
    for (const hint of hints) {
      const byLang = voices.find((voice) => String(voice.lang || '').toLowerCase().startsWith(hint));
      if (byLang) return byLang;
      const byName = voices.find((voice) => String(voice.name || '').toLowerCase().includes(hint.replace('-', '')));
      if (byName) return byName;
    }
    return voices.find((voice) => voice.default) || voices[0] || null;
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (isSpeechSupported) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setPlaybackSource(null);
  };

  const startSpeechPlayback = (lang = language) => {
    if (!isSpeechSupported) {
      return false;
    }

    const speechText = getSpeechText(dailySloka, lang);
    if (!speechText) {
      return false;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = getSpeechLang(lang);
    const selectedVoice = getSpeechVoice(lang);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    setPlaybackSource('speech');
    window.speechSynthesis.speak(utterance);
    return true;
  };

  const startPlayback = async (lang = language) => {
    stopPlayback();

    const speechText = getSpeechText(dailySloka, lang);
    if (!speechText) {
      setSaveStatus('Audio unavailable for this verse');
      window.setTimeout(() => setSaveStatus(''), 2000);
      return;
    }
    
    setPlaybackSource('loading');

    try {
      const customTtsKey = localStorage.getItem('elevenlabsApiKey') || '';
      const ttsResponse = await axios.post(`${SLOKA_API}/api/ai/tts`, {
        text: speechText,
        voiceType: 'narrator',
        customAiKey: customTtsKey
      }, {
        headers: { 'x-api-key': API_KEY },
        responseType: 'arraybuffer'
      });

      const blob = new Blob([ttsResponse.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const newAudio = new Audio(audioUrl);
      
      audioRef.current = newAudio;
      setPlaybackSource('api');
      setIsPlaying(true);
      
      newAudio.play().catch(e => {
        console.error('Audio api playback failed:', e);
        audioRef.current = null;
        fallbackToSpeechPlayback(lang);
      });

      newAudio.onended = () => {
        setIsPlaying(false);
        setPlaybackSource(null);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      
      newAudio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        fallbackToSpeechPlayback(lang);
      };

    } catch (apiError) {
      if (apiError.response && apiError.response.status === 501) {
         console.log('ElevenLabs API key not configured. Falling back to OS Speech Synthesis.');
      } else {
         console.warn('TTS API Error:', apiError);
      }
      fallbackToSpeechPlayback(lang);
    }
  };

  const fallbackToSpeechPlayback = (lang) => {
    const audioUrl = resolveAudioUrl(getAudioByLanguage(dailySloka, lang));
    if (audioUrl) {
      const newAudio = new Audio(audioUrl);
      audioRef.current = newAudio;
      setIsPlaying(true);
      setPlaybackSource('file');
      newAudio.play().catch(() => fallToNativeSpeech(lang));
      newAudio.onended = () => { audioRef.current = null; setIsPlaying(false); setPlaybackSource(null); };
      newAudio.onerror = () => fallToNativeSpeech(lang);
      return;
    }
    fallToNativeSpeech(lang);
  };

  const fallToNativeSpeech = (lang) => {
    const started = startSpeechPlayback(lang);
    if (!started) {
      setIsPlaying(false);
      setPlaybackSource(null);
      setSaveStatus('Audio unavailable for this verse on this browser');
      window.setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const toggleAudio = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback(language);
    }
  };

  const copyToClipboard = () => {
    if (!dailySloka) return;
    const meaning = getMeaningByLanguage(dailySloka, language);
    const text = `${dailySloka.sanskrit}\n\n${meaning}`;
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareSloka = async () => {
    if (!dailySloka || typeof navigator === 'undefined' || !navigator.share) return;
    const meaning = getMeaningByLanguage(dailySloka, language);
    try {
      await navigator.share({
        title: 'Daily Sloka from Omstream',
        text: `${dailySloka.sanskrit}\n\n${meaning}`,
        url: window.location.href,
      });
    } catch (err) {
      console.log('Share failed:', err);
    }
  };

  const handleToggleSaveVerse = () => {
    if (!dailySloka) return;

    const verseKey = getVerseKey(dailySloka);
    const exists = savedVerses.some((item) => item.verseKey === verseKey);

    const entry = {
      verseKey,
      chapter: dailySloka.chapter || null,
      verse: dailySloka.verse || null,
      sanskrit: dailySloka.sanskrit || '',
      englishMeaning: dailySloka.englishMeaning || (dailySloka.localizedMeaning && dailySloka.localizedMeaning.english) || '',
      dailyKey: dailySloka.dailyKey || new Date().toISOString().slice(0, 10),
      savedAt: new Date().toISOString(),
    };

    const next = exists
      ? savedVerses.filter((item) => item.verseKey !== verseKey)
      : [entry, ...savedVerses].slice(0, 80);

    setSavedVerses(next);
    localStorage.setItem(SAVED_VERSES_KEY, JSON.stringify(next));
    setSaveStatus(exists ? 'Verse removed from saved list' : 'Verse saved successfully');

    window.setTimeout(() => {
      setSaveStatus('');
    }, 2000);
  };

  const handleLoadSavedVerse = (item) => {
    if (!item) return;

    stopPlayback();

    setDailySloka((prev) => ({
      ...(prev || {}),
      ...item,
      localizedMeaning: {
        english: item.englishMeaning || '',
        hindi: item.hindiMeaning || item.englishMeaning || '',
        telugu: item.teluguMeaning || item.englishMeaning || '',
      },
    }));

    setSaveStatus('Saved verse loaded');
    window.setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleRemoveSavedVerse = (verseKey) => {
    const next = savedVerses.filter((item) => item.verseKey !== verseKey);
    setSavedVerses(next);
    localStorage.setItem(SAVED_VERSES_KEY, JSON.stringify(next));
    setSaveStatus('Saved verse removed');
    window.setTimeout(() => setSaveStatus(''), 2000);
  };

  return {
    dailySloka,
    loading,
    language,
    setLanguage,
    isPlaying,
    notificationEnabled,
    copied,
    history,
    savedVerses,
    saveStatus,
    playbackSource,
    selectedDateKey,
    showCalendar,
    setShowCalendar,
    MIN_DAILY_DATE_KEY,
    getTodayDateKey,
    openPreviousDay,
    handleDateSelection,
    enableNotifications,
    toggleAudio,
    copyToClipboard,
    shareSloka,
    handleToggleSaveVerse,
    handleLoadSavedVerse,
    handleRemoveSavedVerse,
    getMeaningByLanguage,
    getExplanationByLanguage,
    getExampleByLanguage,
    getVerseKey,
    stopPlayback
  };
};
