import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { BookOpenText, ChevronRight, PlayCircle, Volume2, PauseCircle, Sparkles, Book, Heart, Star, Award, ArrowRight, MessageCircle, Send, X as CloseX, VolumeX, Bookmark, Folder, Search, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const CHAPTER_BACKGROUND_SCENES = [
  { image: '/scene-ram.svg', label: 'Ram' },
  { image: '/scene-hanuman.svg', label: 'Hanuman' },
  { image: '/scene-krishna.svg', label: 'Krishna' },
];

export default function Stories() {
  const { language: globalLanguage, setLanguage: setGlobalLanguage, languages } = useLanguage();
  const { user, setUser } = useAuth();
  const location = useLocation();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activeCollection, setActiveCollection] = useState(null);
  const [bgIndex, setBgIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem('preferred_story_lang') || globalLanguage || 'en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationWarning, setTranslationWarning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('saikumar');
  const [voices, setVoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [chapterSearchQuery, setChapterSearchQuery] = useState('');
  const speechQueueRef = useRef([]);
  const speechStartTimeoutRef = useRef(null);
  
  // AI Chatbot States
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/stories?_t=' + Date.now());
      setStories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch every time the user navigates to this page (location.key is unique per visit)
  useEffect(() => {
    fetchStories();
  }, [location.key]);

  // Also re-fetch when the browser tab regains focus (e.g. after using Admin Dashboard)
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible') fetchStories();
    };
    const handleFocus = () => fetchStories();
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const openStoryId = location.state?.openStoryId;
    if (!openStoryId || stories.length === 0 || activeStory) return;

    const matchedStory = stories.find((story) => String(story._id || story.id) === String(openStoryId));
    if (matchedStory) {
      handleOpenStory(matchedStory);
    }
  }, [location.state, stories, activeStory]);

  // Sync local selectedLanguage with global language context (e.g. if changed from Navbar)
  useEffect(() => {
    if (globalLanguage && globalLanguage !== selectedLanguage) {
      setSelectedLanguage(globalLanguage);
    }
  }, [globalLanguage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % CHAPTER_BACKGROUND_SCENES.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (speechStartTimeoutRef.current) {
      window.clearTimeout(speechStartTimeoutRef.current);
      speechStartTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (Array.isArray(availableVoices) && availableVoices.length) {
        setVoices(availableVoices);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Proactively trigger translation when opening a story or changing language
  useEffect(() => {
    if (activeStory && selectedLanguage !== 'en' && !isTranslating) {
      const hasNewTranslation = activeStory.translations && activeStory.translations[selectedLanguage];
      const langMap = { te: 'Telugu', hi: 'Hindi', ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam', bn: 'Bengali', mr: 'Marathi', sa: 'Sanskrit' };
      const langName = langMap[selectedLanguage];
      const hasLegacyTranslation = langName && (activeStory[`title${langName}`] || activeStory[`content${langName}`]);
      
      if (!hasNewTranslation && !hasLegacyTranslation) {
        handleLanguageChange(selectedLanguage);
      }
    }
  }, [activeStory?._id, selectedLanguage]);

  const getChapterScene = (chapter) => {
    const normalizedChapter = Number(chapter) || 1;
    return CHAPTER_BACKGROUND_SCENES[(normalizedChapter - 1) % CHAPTER_BACKGROUND_SCENES.length];
  };

  const getLocalizedContent = (item, type = 'story', index = activeChapterIndex) => {
    if (!item) return null;
    const lang = selectedLanguage;
    
    if (lang === 'en') return item;

    // 1. New Map-based translation structure
    // If it's a story object being passed
    if (item.translations && item.translations[lang]) {
      const trans = item.translations[lang];
      if (type === 'chapter' && trans.chapters?.[index]) {
        return trans.chapters[index];
      }
      return trans; // returns {title, description, etc.}
    }
    
    // If we're inside a story and asking for a chapter translation from the story's translations
    if (type === 'chapter' && activeStory?.translations?.[lang]?.chapters?.[index]) {
       return activeStory.translations[lang].chapters[index];
    }

    // 2. Fallback to legacy field-based translations
    const langMap = { te: 'Telugu', hi: 'Hindi', ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam', bn: 'Bengali', mr: 'Marathi', sa: 'Sanskrit' };
    const langName = langMap[lang];
    if (langName) {
      const target = type === 'chapter' ? item : (item || activeStory);
      if (!target) return item;
      
      const title = target[`title${langName}`];
      const desc = target[`summary${langName}`] || target[`description${langName}`];
      const content = target[`content${langName}`];
      if (title || desc || content) {
        return { 
          title: title || item.title, 
          description: desc || item.description, 
          content: content || item.content 
        };
      }
    }

    // 3. Strict Override: If not English and no translation found, return a placeholder
    // This prevents "Forced English" while translation is in progress or failing
    if (lang !== 'en') {
      return {
        title: isTranslating ? 'Translating title...' : item.title,
        description: isTranslating ? 'Translating description...' : (item.description || 'Embark on a spiritual journey...'),
        content: isTranslating ? 'Translating divine wisdom into your language...' : item.content,
        takeaways: isTranslating ? [] : (item.takeaways || [])
      };
    }

    return item; // Fallback to original item (English)
  };

  const handleLanguageChange = async (lang) => {
    setSelectedLanguage(lang);
    setGlobalLanguage(lang); // Sync with global language state
    localStorage.setItem('preferred_story_lang', lang);
    
    if (lang === 'en') {
      setTranslationWarning(false);
      return;
    }

    // Improved check for translation existence
    const langMap = { te: 'Telugu', hi: 'Hindi', ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam', bn: 'Bengali', mr: 'Marathi', sa: 'Sanskrit' };
    const langName = langMap[lang];
    const hasNewTranslation = activeStory?.translations && activeStory.translations[lang];
    const hasLegacyTranslation = langName && activeStory && (activeStory[`title${langName}`] || activeStory[`content${langName}`]);
    
    const hasTranslation = hasNewTranslation || hasLegacyTranslation;

    if (!hasTranslation && activeStory) {
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          setIsTranslating(true);
          setTranslationWarning(false);
          const { data } = await axios.post(`/api/stories/${activeStory._id || activeStory.id}/translate`, { targetLang: lang });
          
          // Update active story with new translation
          const updatedStory = {
            ...activeStory,
            translations: {
              ...(activeStory.translations || {}),
              [lang]: data
            }
          };
          setActiveStory(updatedStory);
          
          // Update stories list to cache it in memory
          setStories(prev => prev.map(s => (s._id === updatedStory._id || s.id === updatedStory.id) ? updatedStory : s));
          success = true;
          setTranslationWarning(false);
        } catch (err) {
          retryCount++;
          console.error(`Translation attempt ${retryCount} failed:`, err);
          if (retryCount >= maxRetries) {
            setTranslationWarning(true);
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        } finally {
          if (success || retryCount >= maxRetries) {
            setIsTranslating(false);
          }
        }
      }
    } else {
      setTranslationWarning(false);
    }
  };

  const handleOpenStory = async (story) => {
    // Show the story immediately with cached data for instant UX
    setActiveStory(story);
    setActiveChapterIndex(0);
    const savedLang = localStorage.getItem('preferred_story_lang');
    const initialLang = savedLang || globalLanguage || 'en';
    setSelectedLanguage(initialLang);
    setTranslationWarning(false);

    // Silently refresh with latest data from server (captures admin chapter edits)
    try {
      const storyId = story._id || story.id;
      const { data: fresh } = await axios.get(`/api/stories/${storyId}?_t=` + Date.now());
      if (fresh && (fresh._id || fresh.id)) {
        // Merge fresh chapters into the story so UI updates seamlessly
        setActiveStory(prev => ({
          ...prev,
          chapters: Array.isArray(fresh.chapters) && fresh.chapters.length > 0
            ? fresh.chapters
            : prev.chapters,
          content: fresh.content || prev.content,
          description: fresh.description || prev.description,
        }));
        // Also update the stories list cache
        setStories(prev => prev.map(s =>
          String(s._id || s.id) === String(storyId) ? { ...s, ...fresh } : s
        ));
      }
    } catch (err) {
      // Non-critical: keep showing cached data if refresh fails
      console.warn('Story refresh failed, using cached data:', err.message);
    }

  };

  const handleCloseStory = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setActiveStory(null);
  };

  const handleToggleAudio = async (text) => {
    if (!text) return;

    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      const response = await axios.post('/api/ai/tts', { 
        text, 
        voiceType: selectedVoice 
      }, { responseType: 'blob' });

      const url = URL.createObjectURL(response.data);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
    } catch (error) {
      console.warn('Backend TTS failed, falling back to browser speech:', error.message);
      if (!('speechSynthesis' in window)) {
        setIsSpeaking(false);
        return;
      }
      window.speechSynthesis.cancel();
      const langCodeMap = {
        hi: 'hi-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        sa: 'sa-IN'
      };
      const langCode = langCodeMap[selectedLanguage] || 'en-IN';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleWatchlist = async () => {
    if (!user) {
      alert('Please sign in to save stories to your personal library.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`/api/stories/${activeStory._id || activeStory.id}/toggle-watchlist`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser({ ...user, storyWatchlist: data.storyWatchlist });
      localStorage.setItem('user', JSON.stringify({ ...user, storyWatchlist: data.storyWatchlist }));
    } catch (error) {
      console.error('Error toggling story watchlist:', error);
    }
  };

  const isInWatchlist = user?.storyWatchlist?.includes(activeStory?._id || activeStory?.id);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isAiLoading) return;

    const userMsg = { role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const chapterContent = activeStory?.chapters?.[activeChapterIndex]?.content || '';
      const chapterTitle = activeStory?.chapters?.[activeChapterIndex]?.title || '';
      const storyContext = activeStory 
        ? `[Story: "${activeStory.title}" | Chapter: "${chapterTitle}"] ${chapterContent.substring(0, 800)}\n\nUser question: ${userMsg.content}` 
        : userMsg.content;
      const response = await axios.post('/api/chat', {
        message: storyContext,
        language: selectedLanguage
      });
      
      setChatMessages(prev => [...prev, { role: 'ai', content: response.data.reply }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Forgive me, the spiritual connection is currently disrupted.' }]);
    } finally {
      setIsAiLoading(false);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredAndSortedStories = stories
    .filter(story => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const folderTitle = (story.title || '').toLowerCase();
      const folderDesc = (story.description || '').toLowerCase();
      const folderCategory = (story.category || '').toLowerCase();
      const matchesFolder = folderTitle.includes(q) || folderDesc.includes(q) || folderCategory.includes(q);
      
      const matchesChapters = (story.chapters || []).some(chapter => 
        (chapter.title || '').toLowerCase().includes(q) || 
        (chapter.summary || '').toLowerCase().includes(q)
      );

      return matchesFolder || matchesChapters;
    })
    .sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.createdAt || b.publishedAt || 0) - new Date(a.createdAt || a.publishedAt || 0);
      }
      if (sortOption === 'oldest') {
        return new Date(a.createdAt || a.publishedAt || 0) - new Date(b.createdAt || b.publishedAt || 0);
      }
      if (sortOption === 'alphabetical_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortOption === 'alphabetical_desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });

  const getCategoryTheme = (category) => {
    const cat = category.toLowerCase();
    if (cat.includes('gita')) return { accent: 'from-[#FFD700] to-[#FFA500]', bg: 'bg-[#FFD700]/10', border: 'border-[#FFD700]/30' };
    if (cat.includes('ramayan')) return { accent: 'from-[#FF4500] to-[#FF8C00]', bg: 'bg-[#FF4500]/10', border: 'border-[#FF4500]/30' };
    if (cat.includes('shiv')) return { accent: 'from-[#00BFFF] to-[#4169E1]', bg: 'bg-[#00BFFF]/10', border: 'border-[#00BFFF]/30' };
    return { accent: 'from-[#9FD9F0] to-[#6FA9C8]', bg: 'bg-[#9FD9F0]/10', border: 'border-[#9FD9F0]/30' };
  };

  return (
    <div className="min-h-screen bg-[#06101E] pt-20 sm:pt-28 pb-28 px-4 sm:px-6 lg:px-8 text-white relative overflow-x-hidden">
      {/* Dynamic Backgrounds */}
      {CHAPTER_BACKGROUND_SCENES.map((scene, index) => (
        <div
          key={scene.image}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === bgIndex ? 'opacity-20' : 'opacity-0'}`}
          style={{ backgroundImage: `url('${scene.image}')` }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06101E]/90 via-[#06101E] to-[#06101E]" />

      <div className="max-w-7xl mx-auto relative z-10">
        {!activeStory ? (
          <>
            <div className="mb-12 text-center">
               <h1 className="text-4xl sm:text-6xl font-serif font-black text-white uppercase tracking-tighter mb-4">
                 Divine <span className="text-devotion-gold">Library</span>
               </h1>
               <p className="text-gray-400 text-lg max-w-2xl mx-auto">Immerse yourself in the eternal wisdom of India through AI-powered chapters and audiobooks.</p>
            </div>

            {/* Folder & Search controls */}
            <div className="mb-12 flex flex-col md:flex-row gap-6 items-center justify-between bg-[#0B1F3A]/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem]">
              <div className="relative w-full md:max-w-md flex items-center">
                <input
                  type="text"
                  placeholder="Search folders or chapters..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-sm text-white placeholder-gray-400 focus:border-devotion-gold outline-none"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm">
                    ✕
                  </button>
                )}
              </div>

              <div className="flex gap-4 items-center w-full md:w-auto justify-end">
                <SlidersHorizontal className="w-4 h-4 text-devotion-gold shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-gray-400 whitespace-nowrap">Sort By</span>
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value)}
                  className="bg-[#051121] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-devotion-gold outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical_asc">Alphabetical (A-Z)</option>
                  <option value="alphabetical_desc">Alphabetical (Z-A)</option>
                </select>
              </div>
            </div>

            {/* Folders Grid */}
            {filteredAndSortedStories.length === 0 ? (
              <div className="text-center py-20 bg-[#0B1F3A]/20 rounded-[3rem] border border-white/5">
                <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Folders Found</h3>
                <p className="text-gray-400 text-sm">No spiritual stories or chapters match your search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSortedStories.map((story) => {
                  const theme = getCategoryTheme(story.category || 'General');
                  return (
                    <button
                      key={story._id || story.id}
                      onClick={() => handleOpenStory(story)}
                      className="group relative bg-[#0B1F3A]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden hover:border-devotion-gold/40 transition-all text-left flex flex-col hover:shadow-[0_20px_50px_rgba(255,215,0,0.05)] pt-6"
                    >
                      {/* Stylized Folder Tab Design */}
                      <div className="absolute top-0 left-0 w-32 h-6 bg-gradient-to-r from-devotion-gold/20 to-transparent rounded-tr-xl border-r border-t border-white/10 flex items-center px-4">
                        <Folder className="w-3.5 h-3.5 text-devotion-gold mr-1.5" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-devotion-gold/90">Folder</span>
                      </div>

                      <div className="aspect-[16/10] overflow-hidden relative">
                        {story.thumbnail ? (
                          <img src={story.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${theme.accent} opacity-20`} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-transparent to-transparent" />
                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-2">
                          <BookOpenText className="w-3 h-3 text-devotion-gold" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">{story.chapters?.length || 0} Chapters</span>
                        </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-xl font-serif font-bold text-white mb-2 group-hover:text-devotion-gold transition-colors">
                          {getLocalizedContent(story)?.title}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-6">
                          {getLocalizedContent(story)?.description || 'Embark on a spiritual journey...'}
                        </p>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-devotion-gold">Open Folder</span>
                          <div className="w-10 h-10 rounded-full border border-devotion-gold/20 flex items-center justify-center group-hover:bg-devotion-gold group-hover:text-[#06101E] transition-all">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
             <button
               onClick={handleCloseStory}
               className="mb-8 inline-flex items-center gap-2 text-devotion-gold hover:text-white transition-colors uppercase font-black text-xs tracking-widest"
             >
               <ChevronRight className="w-4 h-4 rotate-180" /> Back to Library
             </button>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                 {/* Left: Content Area */}
                <div className="lg:col-span-8 space-y-8">
                   <div className="relative aspect-video rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                      {activeStory.thumbnail && (
                        <img src={activeStory.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#06101E] via-[#06101E]/20 to-transparent" />
                      <div className="absolute bottom-10 left-10 right-10">
                         <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-devotion-gold text-[#06101E] rounded-full text-[10px] font-black uppercase tracking-widest">
                               {activeStory.category || 'Spiritual'}
                            </span>
                            {activeStory.isKids && <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">KIDS MODE</span>}
                         </div>
                          <h1 className={`text-4xl sm:text-5xl font-serif font-black text-white transition-all duration-500 ${isTranslating ? 'animate-pulse opacity-50' : ''}`}>
                             {isTranslating ? 'Translating Divine Wisdom...' : (getLocalizedContent(activeStory.chapters?.[activeChapterIndex], 'chapter')?.title || getLocalizedContent(activeStory)?.title)}
                          </h1>
                      </div>
                   </div>

                   <div className="bg-[#0B1F3A]/40 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 sm:p-14">
                      <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
                          <div className="flex flex-wrap gap-2">
                             {languages.map(lang => (
                                <button
                                  key={lang.code}
                                  onClick={() => handleLanguageChange(lang.code)}
                                  className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedLanguage === lang.code ? 'bg-devotion-gold text-[#06101E] border-devotion-gold shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                >
                                  {lang.native}
                                </button>
                             ))}
                          </div>

                          <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-devotion-gold/80">AI Voice Style</span>
                            <div className="flex flex-wrap gap-1 bg-[#051121] rounded-2xl p-1 border border-white/5 backdrop-blur-md">
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
                                    if (isSpeaking) {
                                      if (audioRef.current) {
                                        audioRef.current.pause();
                                        audioRef.current = null;
                                      }
                                      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                                      setIsSpeaking(false);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedVoice === v.id ? 'bg-[#FF7A00] text-devotion-darkBlue font-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                  {v.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {translationWarning && (
                             <div className="w-full mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <Sparkles className="w-4 h-4 text-red-400" />
                                <p className="text-[10px] font-bold text-red-300 uppercase tracking-widest">Translation failed. Please try again or switch language.</p>
                             </div>
                          )}

                           <div className="flex items-center gap-3 mt-6 lg:mt-0">
                            <button
                              onClick={toggleWatchlist}
                              className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isInWatchlist ? 'bg-devotion-gold/20 text-devotion-gold border border-devotion-gold' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
                            >
                              <Bookmark className={`w-5 h-5 ${isInWatchlist ? 'fill-current' : ''}`} />
                              {isInWatchlist ? 'Saved' : 'Save Story'}
                            </button>

                            <button
                              onClick={() => handleToggleAudio(getLocalizedContent(activeStory.chapters?.[activeChapterIndex], 'chapter')?.content || getLocalizedContent(activeStory)?.content)}
                              className="inline-flex items-center gap-3 px-8 py-4 bg-devotion-gold text-[#06101E] rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(255,215,0,0.2)]"
                            >
                              {isSpeaking ? <PauseCircle className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                              {isSpeaking ? 'Stop AI Narration' : 'Listen with AI'}
                            </button>
                          </div>
                      </div>

                       <div className="prose prose-invert max-w-none min-h-[300px]">
                          {isTranslating ? (
                            <div className="space-y-4 animate-pulse">
                              <div className="h-4 bg-white/10 rounded-full w-full" />
                              <div className="h-4 bg-white/10 rounded-full w-full" />
                              <div className="h-4 bg-white/10 rounded-full w-3/4" />
                              <div className="h-4 bg-white/10 rounded-full w-full" />
                              <div className="h-4 bg-white/10 rounded-full w-5/6" />
                            </div>
                          ) : (
                            <p className="text-xl sm:text-2xl leading-relaxed text-white/90 font-serif whitespace-pre-wrap transition-all duration-700 ease-in-out">
                               {getLocalizedContent(activeStory.chapters?.[activeChapterIndex], 'chapter')?.content || getLocalizedContent(activeStory)?.content || 'Seeking wisdom...'}
                            </p>
                          )}
                       </div>

                      {getLocalizedContent(activeStory.chapters?.[activeChapterIndex])?.takeaways?.length > 0 && (
                        <div className="mt-16 pt-12 border-t border-white/10">
                           <h4 className="flex items-center gap-3 text-devotion-gold font-black text-xs uppercase tracking-[0.3em] mb-8">
                              <Sparkles className="w-5 h-5" /> Spiritual Takeaways
                           </h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {getLocalizedContent(activeStory.chapters[activeChapterIndex]).takeaways.map((item, i) => (
                                <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-2xl flex items-start gap-4">
                                   <div className="w-8 h-8 rounded-full bg-devotion-gold/10 flex items-center justify-center text-devotion-gold shrink-0">
                                      {i === 0 ? <Heart className="w-4 h-4" /> : i === 1 ? <Star className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                                   </div>
                                   <p className="text-sm text-gray-300 leading-relaxed">{item}</p>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>
                </div>

                {/* Right: Chapter Navigation */}
                <div className="lg:col-span-4 space-y-6">
                   <div className="bg-[#0B1F3A]/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8">
                      <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center justify-between">
                         Chapters
                         <span className="text-devotion-gold">{activeChapterIndex + 1} / {activeStory.chapters?.length || 1}</span>
                      </h4>
                      {/* Chapter Search */}
                      <div className="mb-4 relative flex items-center">
                        <input
                          type="text"
                          placeholder="Search chapters..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-gray-500 focus:border-devotion-gold outline-none"
                          value={chapterSearchQuery}
                          onChange={e => setChapterSearchQuery(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        {chapterSearchQuery && (
                          <button onClick={() => setChapterSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-[10px]">
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                         {(activeStory.chapters || [{ title: activeStory.title, _id: 'main' }])
                           .map((chapter, index) => ({ chapter, index }))
                           .filter(({ chapter }) => !chapterSearchQuery || (chapter.title || '').toLowerCase().includes(chapterSearchQuery.toLowerCase()))
                           .map(({ chapter, index }) => (
                            <button
                              key={chapter._id || index}
                              onClick={() => setActiveChapterIndex(index)}
                              className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between group ${activeChapterIndex === index ? 'bg-devotion-gold/10 border-devotion-gold/40 text-devotion-gold' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                               <div className="flex items-center gap-4">
                                  <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-black ${activeChapterIndex === index ? 'border-devotion-gold bg-devotion-gold text-[#06101E]' : 'border-white/20 text-white/40'}`}>
                                     {index + 1}
                                  </span>
                                  <span className="text-sm font-bold truncate max-w-[150px]">{chapter.title}</span>
                               </div>
                               {activeChapterIndex === index ? <PlayCircle className="w-5 h-5 animate-pulse" /> : <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </button>
                          ))}
                      </div>
                   </div>

                   <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8">
                      <h4 className="text-white font-black text-xs uppercase tracking-widest mb-4">AI Mentor Tip</h4>
                      <p className="text-xs text-blue-200 leading-relaxed mb-6">"Did you know? Each chapter in this epic holds a specific vibration that can help balance your mind. Try listening to the AI narration with your eyes closed."</p>
                      <button 
                        onClick={() => setShowChat(true)}
                        className="w-full py-4 bg-white/10 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                      >
                         <MessageCircle className="w-4 h-4 text-blue-400" /> Ask AI Mentor About This Story
                      </button>
                   </div>
                </div>
             </div>

             {/* AI Chat Overlay */}
             {showChat && (
               <div className="fixed bottom-8 right-8 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-10rem)] bg-[#0B1F3A] border border-blue-500/30 rounded-[2.5rem] shadow-[0_0_80px_rgba(34,211,238,0.2)] flex flex-col overflow-hidden z-[100] animate-in slide-in-from-right-8 duration-500">
                  <div className="p-6 bg-blue-500/10 border-b border-white/10 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                           🦚
                        </div>
                        <div>
                           <h4 className="text-white font-black text-[10px] uppercase tracking-widest">AI Spiritual Mentor</h4>
                           <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Lord Krishna's Wisdom</p>
                        </div>
                     </div>
                     <button onClick={() => setShowChat(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <CloseX className="w-5 h-5" />
                     </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                     {chatMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                           <Sparkles className="w-12 h-12 text-blue-400 mb-4 animate-pulse" />
                           <p className="text-xs font-serif text-white">"Speak your heart, dear Seeker. I am here to guide you through this story."</p>
                        </div>
                     )}
                     {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed group relative ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm font-serif'}`}>
                              {msg.content}
                              {msg.role === 'ai' && (
                                <div className="flex items-center gap-4 mt-3">
                                   <button 
                                     onClick={() => handleToggleAudio(msg.content)}
                                     className={`p-2 rounded-full transition-all ${isSpeaking ? 'bg-red-500 text-white' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white'}`}
                                   >
                                      {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                                   </button>
                                   {isSpeaking && (
                                     <div className="flex items-center gap-0.5 h-3">
                                        {[...Array(8)].map((_, i) => (
                                          <div key={i} className="w-1 bg-blue-400 rounded-full animate-waveform" style={{ animationDelay: `${i * 0.15}s` }} />
                                        ))}
                                     </div>
                                   )}
                                </div>
                              )}
                           </div>
                        </div>
                     ))}
                     {isAiLoading && (
                        <div className="flex justify-start">
                           <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-bl-sm flex gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce delay-100" />
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce delay-200" />
                           </div>
                        </div>
                     )}
                     <div ref={chatEndRef} />
                  </div>

                  <div className="p-6 border-t border-white/10">
                     <div className="relative flex items-center">
                        <input 
                           type="text" 
                           value={chatInput}
                           onChange={e => setChatInput(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                           placeholder="Type your question..." 
                           className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-xs text-white focus:outline-none focus:border-blue-500/50"
                        />
                        <button 
                           onClick={handleSendChat}
                           disabled={isAiLoading || !chatInput.trim()}
                           className="absolute right-2 p-3 bg-blue-500 text-white rounded-full hover:scale-105 transition-transform disabled:opacity-50"
                        >
                           <Send className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
