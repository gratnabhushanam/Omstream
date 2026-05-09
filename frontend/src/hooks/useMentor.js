import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMentorHistory, saveMentorHistory as saveHistoryApi, getMentorSolution, getRelatedMentorContent, generateTTS, sendAiChat } from '../api/mentorApi';
import { ENV, API_ORIGIN } from '../config/env';

const HISTORY_KEY = 'mentor_history_v1';
const SAVED_VERSES_KEY = 'mentor_saved_verses_v1';

export const useMentor = () => {
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState(null);
  const [relatedContent, setRelatedContent] = useState({ slokas: [], stories: [], videos: [] });
  const [mentorHistory, setMentorHistory] = useState([]);
  const [showVideo, setShowVideo] = useState(false);
  const [language, setLanguage] = useState('english');
  const [voiceCharacter, setVoiceCharacter] = useState('krishna');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  const [playbackType, setPlaybackType] = useState(null);
  const [voices, setVoices] = useState([]);
  const [savedVerses, setSavedVerses] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState('curated');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isAiLoading]);

  const handleNavigateToContent = (item, type) => {
    if (type === 'story') {
      navigate('/stories', { state: { openStoryId: item._id || item.id } });
    } else if (type === 'video') {
      navigate('/videos', { state: { openVideoId: item._id || item.id } });
    } else if (type === 'sloka') {
      navigate('/daily-sloka', { state: { savedVerse: item } });
    }
  };

  const hasValidSloka = (payload) => Boolean(payload && typeof payload.sanskrit === 'string' && payload.sanskrit.trim().length > 0);

  const loadMentorHistory = async () => {
    try {
      const data = await getMentorHistory();
      const apiItems = data && Array.isArray(data.items) ? data.items : [];
      if (apiItems.length) {
        setMentorHistory(apiItems);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(apiItems));
        return;
      }
    } catch (error) {
      console.error('Failed to load API mentor history, using local cache:', error);
    }

    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setMentorHistory(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error('Failed to load mentor history:', error);
      setMentorHistory([]);
    }
  };

  const saveMentorHistory = async (entry) => {
    try {
      await saveHistoryApi(entry);
    } catch (error) {
      console.error('Failed to save mentor history to API, using local cache:', error);
    }

    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const base = Array.isArray(parsed) ? parsed : [];
      const deduped = base.filter((item) => !(item.problem === entry.problem && item.sanskrit === entry.sanskrit));
      const next = [entry, ...deduped].slice(0, 40);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      setMentorHistory(next);
    } catch (error) {
      console.error('Failed to save mentor history:', error);
    }
  };

  const handleSendAiMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;
    
    const userMsg = { role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    const inputCopy = chatInput.trim();
    setChatInput('');
    setIsAiLoading(true);
    
    try {
      const customAiKey = localStorage.getItem('geminiApiKey') || '';
      const data = await sendAiChat(inputCopy, customAiKey, language);
      const aiReply = { role: 'ai', content: data.reply || 'Divine connectivity interrupted.' };
      setChatMessages(prev => [...prev, aiReply]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const aiError = { role: 'ai', content: 'Forgive me, the spiritual connection is currently disrupted. Please try again or verify your API key in settings.' };
      setChatMessages(prev => [...prev, aiError]);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    loadMentorHistory();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_VERSES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setSavedVerses(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error('Failed to load saved mentor verses:', error);
      setSavedVerses([]);
    }
  }, []);

  useEffect(() => {
    const savedVerse = location.state && location.state.savedVerse;
    if (!savedVerse || !hasValidSloka(savedVerse)) return;

    setSolution({
      ...savedVerse,
      localizedMeaning: {
        english: savedVerse.englishMeaning || '',
        hindi: savedVerse.hindiMeaning || savedVerse.englishMeaning || '',
        telugu: savedVerse.teluguMeaning || savedVerse.englishMeaning || '',
      },
      mentorTitle: savedVerse.mentorTitle || 'Saved Guidance',
      mentorTip: savedVerse.mentorTip || 'Reflect on this saved verse and apply it calmly.',
      mentorPractice: savedVerse.mentorPractice || 'Practice this wisdom once today in real life.',
    });

    if (savedVerse.problem) {
      setSelectedProblem(savedVerse.problem);
    }

    setLoading(false);
    setSaveStatus('Loaded saved verse');
    window.setTimeout(() => setSaveStatus(''), 2000);
  }, [location.state]);

  const fetchSolution = async (problemId) => {
    setSelectedProblem(problemId);
    setLoading(true);
    setShowVideo(false);
    setIsPlaying(false);
    setAudio(null);
    
    try {
      const data = await getMentorSolution(problemId);
      if (hasValidSloka(data)) {
        setSolution(data);
        await saveMentorHistory({
          problem: problemId,
          sanskrit: data.sanskrit,
          englishMeaning: data.englishMeaning || (data.localizedMeaning && data.localizedMeaning.english) || '',
          mentorTitle: data.mentorTitle || '',
          viewedAt: new Date().toISOString(),
        });
      } else {
        setSolution(null);
      }
    } catch (error) {
      console.error('Error fetching mentor sloka:', error);
      setSolution(null);
    }
    
    try {
      const contentData = await getRelatedMentorContent(problemId);
      setRelatedContent({
        slokas: contentData.slokas || [],
        stories: contentData.stories || [],
        videos: contentData.videos || [],
      });
    } catch (contentError) {
      console.error('Error fetching related content:', contentError);
      setRelatedContent({ slokas: [], stories: [], videos: [] });
    } finally {
      setLoading(false);
    }
  };

  const getMeaningByLanguage = (currentSolution, selectedLanguage) => {
    if (!currentSolution) return '';
    const localized = currentSolution.localizedMeaning || {};
    if (selectedLanguage === 'telugu') {
      return localized.telugu || currentSolution.teluguMeaning || currentSolution.englishMeaning || '';
    }
    if (selectedLanguage === 'hindi') {
      return localized.hindi || currentSolution.hindiMeaning || currentSolution.englishMeaning || '';
    }
    return localized.english || currentSolution.englishMeaning || currentSolution.teluguMeaning || '';
  };

  const getAudioByLanguage = (currentSolution, selectedLanguage) => {
    if (!currentSolution) return '';
    const audioByLanguage = currentSolution.audioByLanguage || {};
    return audioByLanguage[selectedLanguage] || currentSolution.audioUrl || '';
  };

  const resolveAudioUrl = (rawUrl) => {
    const value = String(rawUrl || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/')) return `${API_ORIGIN}${value}`;
    return value;
  };

  const activeAudioUrl = resolveAudioUrl(getAudioByLanguage(solution, language));
  const canPlayAudio = Boolean(activeAudioUrl) || (typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined');

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
  }, []);

  const getSpeechLang = (selectedLanguage) => {
    if (selectedLanguage === 'hindi') return 'hi-IN';
    if (selectedLanguage === 'telugu') return 'te-IN';
    return 'en-US';
  };

  const getSpeechText = (currentSolution, selectedLanguage) => {
    if (!currentSolution) return '';
    const meaning = getMeaningByLanguage(currentSolution, selectedLanguage);
    return `${currentSolution.sanskrit}\n\n${meaning}`.trim();
  };

  const getVoiceByCharacter = (selectedLanguage) => {
    const langHint = selectedLanguage === 'hindi' ? 'hi' : selectedLanguage === 'telugu' ? 'te' : 'en';
    const langVoices = voices.filter((voice) => String(voice.lang || '').toLowerCase().startsWith(langHint));

    if (langVoices.length === 0) {
      return voices.find((voice) => voice.default) || voices[0] || null;
    }

    const voiceIndex = ['ram', 'krishna', 'hanuman', 'arjuna'].indexOf(voiceCharacter);
    const selectedVoiceIndex = Math.min(voiceIndex >= 0 ? voiceIndex : 0, langVoices.length - 1);
    
    return langVoices[selectedVoiceIndex] || langVoices[0] || null;
  };

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
    stopPlayback();

    const speechText = getSpeechText(solution, selectedLanguage);
    if (!speechText) {
      setSaveStatus('Audio unavailable for this verse');
      window.setTimeout(() => setSaveStatus(''), 2000);
      return;
    }

    setPlaybackType('loading');

    try {
      const customTtsKey = localStorage.getItem('elevenlabsApiKey') || '';
      const ttsData = await generateTTS(speechText, voiceCharacter, customTtsKey);
      const blob = new Blob([ttsData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const newAudio = new Audio(audioUrl);
      
      setAudio(newAudio);
      setPlaybackType('api');
      setIsPlaying(true);
      
      newAudio.play().catch(e => {
        console.error('Audio api playback failed:', e);
        fallbackToSpeechSynthesis(speechText, selectedLanguage);
      });

      newAudio.onended = () => {
        setIsPlaying(false);
        setPlaybackType(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      newAudio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        fallbackToSpeechSynthesis(speechText, selectedLanguage);
      };

    } catch (apiError) {
      fallbackToSpeechSynthesis(speechText, selectedLanguage);
    }
  };

  const fallbackToSpeechSynthesis = (speechText, selectedLanguage) => {
    if (!isSpeechSupported) {
      setIsPlaying(false);
      setPlaybackType(null);
      setSaveStatus('Audio unavailable for this verse on this browser');
      window.setTimeout(() => setSaveStatus(''), 2000);
      return;
    }

    const currentAudioUrl = resolveAudioUrl(getAudioByLanguage(solution, selectedLanguage));
    if (currentAudioUrl) {
        const newAudio = new Audio(currentAudioUrl);
        setAudio(newAudio);
        setPlaybackType('file');
        setIsPlaying(true);
        newAudio.play().catch(() => launchSpeechUtterance(speechText, selectedLanguage));
        newAudio.onended = () => { setIsPlaying(false); setPlaybackType(null); };
        newAudio.onerror = () => launchSpeechUtterance(speechText, selectedLanguage);
        return;
    }
    
    launchSpeechUtterance(speechText, selectedLanguage);
  };

  const launchSpeechUtterance = (speechText, selectedLanguage) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = getSpeechLang(selectedLanguage);
    const selectedVoice = getVoiceByCharacter(selectedLanguage);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    const characterVoiceTraits = {
      ram: { pitch: 0.95, rate: 0.9 },
      krishna: { pitch: 0.9, rate: 0.85 },
      hanuman: { pitch: 1.0, rate: 0.92 },
      arjuna: { pitch: 0.98, rate: 0.88 },
    };
    const traits = characterVoiceTraits[voiceCharacter] || characterVoiceTraits.krishna;
    utterance.pitch = traits.pitch;
    utterance.rate = traits.rate;
    
    utterance.onend = () => { setIsPlaying(false); setPlaybackType(null); };
    utterance.onerror = () => { setIsPlaying(false); setPlaybackType(null); };

    setPlaybackType('speech');
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (isSpeechSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || !solution) return;
    stopPlayback();
    startPlayback(language);
  }, [language, voiceCharacter]);

  const toggleAudio = () => {
    if (isPlaying) {
      stopPlayback();
      if (isSpeechSupported) {
        window.speechSynthesis.cancel();
      }
      return;
    }
    startPlayback(language);
  };

  const getVerseKey = (item) => `${item.chapter || '0'}:${item.verse || '0'}:${String(item.sanskrit || '').trim()}`;

  const isCurrentVerseSaved = Boolean(
    solution && savedVerses.some((item) => item.verseKey === getVerseKey(solution))
  );

  const handleToggleSaveVerse = () => {
    if (!solution) return;

    const verseKey = getVerseKey(solution);
    const exists = savedVerses.some((item) => item.verseKey === verseKey);
    const entry = {
      verseKey,
      problem: selectedProblem || solution.problem || '',
      chapter: solution.chapter || null,
      verse: solution.verse || null,
      sanskrit: solution.sanskrit || '',
      englishMeaning: solution.englishMeaning || (solution.localizedMeaning && solution.localizedMeaning.english) || '',
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

  return {
    selectedProblem,
    loading,
    solution,
    relatedContent,
    mentorHistory,
    showVideo,
    setShowVideo,
    language,
    setLanguage,
    voiceCharacter,
    setVoiceCharacter,
    isPlaying,
    canPlayAudio,
    playbackType,
    saveStatus,
    activeTab,
    setActiveTab,
    chatMessages,
    chatInput,
    setChatInput,
    isAiLoading,
    messagesEndRef,
    handleSendAiMessage,
    fetchSolution,
    toggleAudio,
    isCurrentVerseSaved,
    handleToggleSaveVerse,
    getMeaningByLanguage,
    handleNavigateToContent
  };
};
