import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { BookOpenText, ChevronRight, PlayCircle, Volume2, PauseCircle } from 'lucide-react';

const CHAPTER_BACKGROUND_SCENES = [
  { image: '/scene-ram.svg', label: 'Ram' },
  { image: '/scene-hanuman.svg', label: 'Hanuman' },
  { image: '/scene-krishna.svg', label: 'Krishna' },
];

export default function Stories() {
  const location = useLocation();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState(null);
  const [activeCollection, setActiveCollection] = useState(null);
  const [bgIndex, setBgIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const speechQueueRef = useRef([]);
  const speechStartTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data } = await axios.get('/api/stories');
        setStories(data);
      } catch (error) {
        console.error('Error fetching stories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  useEffect(() => {
    const openStoryId = location.state?.openStoryId;
    if (!openStoryId || stories.length === 0 || activeStory) return;

    const matchedStory = stories.find((story) => String(story._id || story.id) === String(openStoryId));
    if (matchedStory) {
      handleOpenStory(matchedStory);
    }
  }, [location.state, stories, activeStory]);

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

  const getChapterScene = (chapter) => {
    const normalizedChapter = Number(chapter) || 1;
    return CHAPTER_BACKGROUND_SCENES[(normalizedChapter - 1) % CHAPTER_BACKGROUND_SCENES.length];
  };

  const getLocalizedText = (story, type) => {
    if (!story) return '';

    const fieldMap = {
      summary: {
        telugu: story.summaryTelugu,
        hindi: story.summaryHindi,
        english: story.summaryEnglish,
      },
      content: {
        telugu: story.contentTelugu,
        hindi: story.contentHindi,
        english: story.contentEnglish,
      },
    };

    const primaryLanguage = String(story.language || 'english').toLowerCase();
    const localizedValue = fieldMap[type]?.[selectedLanguage];
    const primaryValue = fieldMap[type]?.[primaryLanguage];
    const defaultValue = type === 'summary'
      ? story.summary || story.description || ''
      : story.content || '';

    return localizedValue || primaryValue || defaultValue;
  };

  const getLocalizedTitle = (story) => {
    if (!story) return '';

    const titleMap = {
      telugu: story.titleTelugu,
      hindi: story.titleHindi,
      english: story.titleEnglish,
    };

    const primaryLanguage = String(story.language || 'english').toLowerCase();
    return titleMap[selectedLanguage] || titleMap[primaryLanguage] || story.title || 'Untitled Story';
  };

  const getSpeechLang = (lang) => {
    if (lang === 'hindi') return 'hi-IN';
    if (lang === 'telugu') return 'te-IN';
    return 'en-IN';
  };

  const getSpeechVoice = (lang) => {
    const voiceLanguageHints = {
      english: ['en-us', 'en-gb', 'en-in'],
      hindi: ['hi-in', 'hi'],
      telugu: ['te-in', 'te'],
    };
    const hints = voiceLanguageHints[lang] || voiceLanguageHints.english;
    const normalizedVoices = voices.map((voice) => ({
      ...voice,
      normalizedLang: String(voice.lang || '').toLowerCase(),
      normalizedName: String(voice.name || '').toLowerCase(),
    }));

    for (const hint of hints) {
      const byLang = normalizedVoices.find((voice) => voice.normalizedLang.startsWith(hint));
      if (byLang) return byLang;

      const byName = normalizedVoices.find((voice) => voice.normalizedName.includes(hint.replace('-', '')));
      if (byName) return byName;
    }

    if (lang === 'english') {
      return normalizedVoices.find((voice) => voice.default) || normalizedVoices[0] || null;
    }

    return null;
  };

  const handleOpenStory = (story) => {
    setActiveStory(story);
    setSelectedLanguage(String(story.language || 'english').toLowerCase());
  };

  const handleCloseStory = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (speechStartTimeoutRef.current) {
      window.clearTimeout(speechStartTimeoutRef.current);
      speechStartTimeoutRef.current = null;
    }
    setIsSpeaking(false);
    setActiveStory(null);
  };

  const groupedCollections = stories.reduce((collections, story) => {
    const collectionTitle = story.seriesTitle || 'Bhagavad Gita';
    if (!collections[collectionTitle]) {
      collections[collectionTitle] = [];
    }
    collections[collectionTitle].push(story);
    return collections;
  }, {});

  const collectionEntries = Object.entries(groupedCollections).map(([seriesTitle, seriesStories]) => ({
    seriesTitle,
    stories: [...seriesStories].sort((a, b) => Number(a.chapter || 0) - Number(b.chapter || 0)),
  }));

  const visibleStories = activeCollection
    ? collectionEntries.find((entry) => entry.seriesTitle === activeCollection)?.stories || []
    : [];

  const getCollectionTheme = (seriesTitle) => {
    const normalized = String(seriesTitle || '').toLowerCase();

    if (normalized.includes('ramayana')) {
      return {
        overlay: 'linear-gradient(rgba(34,12,10,0.58), rgba(6,16,30,0.82))',
        card: 'linear-gradient(135deg, rgba(58,18,14,0.96), rgba(15,37,66,0.95))',
        accent: 'from-[#FFB84D] via-[#E48B35] to-[#8E3E1F]',
        border: 'border-[#E6A24A]/35',
      };
    }

    if (normalized.includes('bhagavad') || normalized.includes('gita')) {
      return {
        overlay: 'linear-gradient(rgba(6,16,30,0.68), rgba(6,16,30,0.84))',
        card: 'linear-gradient(135deg, rgba(11,31,58,0.96), rgba(16,38,65,0.95))',
        accent: 'from-[#E6C38A] via-[#D39A4A] to-[#6FA9C8]',
        border: 'border-[#D39A4A]/30',
      };
    }

    return {
      overlay: 'linear-gradient(rgba(6,16,30,0.72), rgba(6,16,30,0.86))',
      card: 'linear-gradient(135deg, rgba(11,31,58,0.96), rgba(16,38,65,0.95))',
      accent: 'from-[#E6C38A] via-[#D39A4A] to-[#9FD9F0]',
      border: 'border-[#D39A4A]/30',
    };
  };

  const handleToggleAudio = (story) => {
    if (!story || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const speechText = `${getLocalizedText(story, 'summary')} ${getLocalizedText(story, 'content')} ${story.title || ''}`.trim();
    if (!speechText) return;

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const selectedVoice = getSpeechVoice(selectedLanguage);
    const requestedLang = getSpeechLang(selectedLanguage);
    const chunks = speechText.match(/[^.!?\n]+[.!?\n]*/g) || [speechText];
    speechQueueRef.current = chunks.map((chunk) => chunk.trim()).filter(Boolean);

    const speakNextChunk = () => {
      const nextChunk = speechQueueRef.current.shift();
      if (!nextChunk) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(nextChunk);
      utterance.lang = requestedLang;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onstart = () => {
        if (speechStartTimeoutRef.current) {
          window.clearTimeout(speechStartTimeoutRef.current);
          speechStartTimeoutRef.current = null;
        }
        setIsSpeaking(true);
      };
      utterance.onend = speakNextChunk;
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    };

    // Delay slightly to avoid browser race after cancel().
    window.setTimeout(speakNextChunk, 120);

    // If no speech starts quickly, retry once using same requested language without selecting a voice.
    speechStartTimeoutRef.current = window.setTimeout(() => {
      if (window.speechSynthesis.speaking) return;
      window.speechSynthesis.cancel();
      const fallbackUtterance = new SpeechSynthesisUtterance(speechText.slice(0, 300));
      fallbackUtterance.lang = requestedLang;
      fallbackUtterance.rate = 0.95;
      fallbackUtterance.pitch = 1;
      fallbackUtterance.onstart = () => setIsSpeaking(true);
      fallbackUtterance.onend = () => setIsSpeaking(false);
      fallbackUtterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(fallbackUtterance);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#06101E] pt-20 sm:pt-28 tv:pt-36 pb-28 px-4 sm:px-6 lg:px-8 tv:px-16 text-white overflow-x-hidden relative" style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}>
      {CHAPTER_BACKGROUND_SCENES.map((scene, index) => (
        <div
          key={scene.image}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === bgIndex ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url('${scene.image}')` }}
          aria-hidden="true"
        />
      ))}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(230,195,138,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(49,98,126,0.26),transparent_30%),linear-gradient(to_bottom,rgba(6,16,30,0.86),rgba(6,16,30,0.9))]"></div>
      <div className="max-w-4xl tv:max-w-5xl mx-auto relative z-10">
        
        <div className="bg-[#0B1F3A]/78 backdrop-blur-3xl py-6 px-8 rounded-t-[2rem] border border-[#D39A4A]/30 shadow-lg text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-devotion-gold to-transparent opacity-50"></div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl tv:text-[8rem] font-serif font-bold text-devotion-gold tracking-widest drop-shadow-md uppercase">
            Chapters
          </h1>
          <div className="w-24 h-1 bg-devotion-gold mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="bg-[#102641]/82 backdrop-blur-3xl border border-[#D39A4A]/25 rounded-b-[2rem] shadow-xl p-6 md:p-10">
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-devotion-gold"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {activeCollection ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveCollection(null)}
                    className="tv-focusable mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 tv:px-6 tv:py-3 text-xs tv:text-lg font-black uppercase tracking-[0.2em] text-white/75 hover:border-devotion-gold/40 hover:text-devotion-gold"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" /> Back to collections
                  </button>

                  {visibleStories.map((story, index) => (
                    <button
                      key={story._id}
                      type="button"
                      tabIndex={0}
                      onClick={() => handleOpenStory(story)}
                      className="tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold bg-gradient-to-r from-[#102641] to-[#1A3552] border border-[#D39A4A]/35 rounded-2xl p-4 tv:p-8 flex items-center justify-between group hover:border-[#E6C38A] transition-colors shadow-md text-left"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D39A4A] to-[#E6C38A] flex items-center justify-center text-[#102641] font-bold text-xl drop-shadow-sm border-2 border-[#FFECA1]">
                          {index + 1}
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-[0.28em] text-white/40 mb-1">
                            Chapter {story.chapter || index + 1}
                          </p>
                          <h3 className="text-xl font-bold text-devotion-gold font-serif mb-1 group-hover:text-white transition-colors">
                            {getLocalizedTitle(story)}
                          </h3>
                          <p className="text-[10px] uppercase tracking-[0.24em] text-[#E6C38A]/80 mb-1">
                            {String(story.language || 'english')}
                          </p>
                          <p className="text-devotion-textYellow/80 text-sm line-clamp-2">
                            {getLocalizedText(story, 'summary') || getLocalizedText(story, 'content')?.slice(0, 140) || 'No summary available.'}
                          </p>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-3 text-devotion-gold/80 group-hover:text-devotion-gold">
                        <BookOpenText className="w-6 h-6" />
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                collectionEntries.map((collection, index) => {
                  const theme = getCollectionTheme(collection.seriesTitle);

                  return (
                  <button
                    key={collection.seriesTitle}
                    type="button"
                    tabIndex={0}
                    onClick={() => setActiveCollection(collection.seriesTitle)}
                    className={`tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold bg-gradient-to-r ${theme.card.includes('rgba(58,18,14') ? 'from-[#3A120E] to-[#15304F]' : 'from-[#102641] to-[#1A3552]'} ${theme.border} rounded-2xl p-4 tv:p-8 flex items-center justify-between group hover:border-[#E6C38A] transition-colors shadow-md text-left preserve-3d`}
                    onMouseMove={(e) => {
                      const card = e.currentTarget;
                      const rect = card.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const centerX = rect.width / 2;
                      const centerY = rect.height / 2;
                      const rotateX = ((y - centerY) / centerY) * -5;
                      const rotateY = ((x - centerX) / centerX) * 5;
                      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
                    }}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${theme.accent} flex items-center justify-center text-[#102641] font-bold text-xl drop-shadow-sm border-2 border-[#FFECA1]`}>
                        {index + 1}
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-white/40 mb-1">
                          {collection.stories.length} Chapters
                        </p>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                          <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${theme.accent}`}></span>
                          {collection.seriesTitle.toLowerCase().includes('ramayana') ? 'Ramayana Epic' : 'Bhagavad Gita'}
                        </div>
                        <h3 className={`text-xl font-bold font-serif mb-1 group-hover:text-white transition-colors bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>
                          {collection.seriesTitle}
                        </h3>
                        <p className="text-devotion-textYellow/80 text-sm line-clamp-2">
                          Tap to open chapters inside this collection.
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-3 text-devotion-gold/80 group-hover:text-devotion-gold">
                      <BookOpenText className="w-6 h-6" />
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {activeStory && (() => {
        const theme = getCollectionTheme(activeStory.seriesTitle);
        const chapterScene = getChapterScene(activeStory.chapter).image;

        return (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-md bg-cover bg-center"
          style={{ backgroundImage: `${theme.overlay}, url('${chapterScene}')` }}
        >
          <div
            className={`w-full max-w-3xl my-4 mb-28 rounded-[2rem] ${theme.border} p-6 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.45)] bg-cover bg-center relative`}
            style={{ backgroundImage: `${theme.card}, url('${chapterScene}')`, paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-devotion-gold/70">Chapter {activeStory.chapter || 1}</p>
                <p className={`text-[10px] uppercase tracking-[0.3em] mt-1 bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>{activeStory.seriesTitle || 'Bhagavad Gita'}</p>
                <h2 className="mt-2 text-3xl font-serif font-bold text-white">{getLocalizedTitle(activeStory)}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAudio(activeStory)}
                  className="tv-focusable inline-flex items-center gap-2 rounded-full border border-devotion-gold/30 px-4 py-2 tv:px-6 tv:py-3 text-xs tv:text-base uppercase tracking-[0.18em] text-devotion-gold hover:text-white hover:border-devotion-gold"
                >
                  {isSpeaking ? <PauseCircle className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  {isSpeaking ? 'Stop Audio' : 'Play Audio'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseStory}
                  className="tv-focusable rounded-full border border-white/10 px-4 py-2 tv:px-6 tv:py-3 text-xs tv:text-base uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/25"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {['telugu', 'hindi', 'english'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                    setSelectedLanguage(lang);
                  }}
                  className={`tv-focusable px-3 py-1.5 tv:px-5 tv:py-2.5 rounded-full border text-[10px] tv:text-sm font-black uppercase tracking-[0.18em] transition-all ${selectedLanguage === lang ? 'bg-devotion-gold text-[#06101E] border-devotion-gold' : 'bg-white/5 text-gray-200 border-white/20 hover:border-devotion-gold/40'}`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="space-y-4 text-white/80">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/80 space-y-1">
                <p><span className="text-devotion-gold">Telugu Title:</span> {activeStory.titleTelugu || '-'}</p>
                <p><span className="text-devotion-gold">Hindi Title:</span> {activeStory.titleHindi || '-'}</p>
                <p><span className="text-devotion-gold">English Title:</span> {activeStory.titleEnglish || '-'}</p>
              </div>
              <p className="text-sm leading-7 text-devotion-textYellow/90">
                {getLocalizedText(activeStory, 'summary') || 'No summary available.'}
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/70">
                {getLocalizedText(activeStory, 'content') || 'No full content was added for this chapter yet.'}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleCloseStory}
                className="tv-focusable inline-flex items-center gap-2 rounded-2xl bg-devotion-gold px-5 py-3 tv:px-8 tv:py-4 text-xs tv:text-lg font-black uppercase tracking-[0.2em] text-[#06101E]"
              >
                <PlayCircle className="h-4 w-4" />
                Back to chapters
              </button>
            </div>
          </div>
        </div>
      );
      })()}
    </div>
  );
}
