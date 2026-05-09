import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { BookOpenText, ChevronRight, PlayCircle, Volume2, PauseCircle, Sparkles, Book, Heart, Star, Award, ArrowRight, MessageCircle, Send, X as CloseX, VolumeX } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CHAPTER_BACKGROUND_SCENES = [
  { image: '/scene-ram.svg', label: 'Ram' },
  { image: '/scene-hanuman.svg', label: 'Hanuman' },
  { image: '/scene-krishna.svg', label: 'Krishna' },
];

export default function Stories() {
  const { language: globalLanguage } = useLanguage();
  const location = useLocation();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activeCollection, setActiveCollection] = useState(null);
  const [bgIndex, setBgIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const speechQueueRef = useRef([]);
  const speechStartTimeoutRef = useRef(null);
  
  // AI Chatbot States
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);

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

  const getLocalizedContent = (story) => {
    if (!story) return null;
    const lang = selectedLanguage || globalLanguage || 'en';
    
    // Check if we have translations in the new Map format
    if (story.translations && story.translations[lang]) {
      return story.translations[lang];
    }

    // Fallback to old field-based translations
    const langName = lang === 'te' ? 'telugu' : lang === 'hi' ? 'hindi' : 'english';
    return {
      title: story[`title${langName.charAt(0).toUpperCase() + langName.slice(1)}`] || story.title,
      description: story[`summary${langName.charAt(0).toUpperCase() + langName.slice(1)}`] || story.description,
      content: story[`content${langName.charAt(0).toUpperCase() + langName.slice(1)}`] || story.content
    };
  };

  const handleOpenStory = (story) => {
    setActiveStory(story);
    setActiveChapterIndex(0);
    setSelectedLanguage(globalLanguage || 'en');
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
        voiceType: activeStory?.category?.toLowerCase().includes('krishna') ? 'krishna' : 'ram' 
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
      const langCode = selectedLanguage === 'hi' ? 'hi-IN' : selectedLanguage === 'te' ? 'te-IN' : 'en-IN';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

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
        language: 'en'
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

  const groupedCollections = stories.reduce((collections, story) => {
    const category = story.category || 'General Stories';
    if (!collections[category]) collections[category] = [];
    collections[category].push(story);
    return collections;
  }, {});

  const collectionEntries = Object.entries(groupedCollections).map(([category, catStories]) => ({
    category,
    stories: catStories
  }));

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

            {collectionEntries.map(({ category, stories: catStories }) => {
              const theme = getCategoryTheme(category);
              return (
                <div key={category} className="mb-16">
                  <div className="flex items-center gap-4 mb-8">
                     <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${theme.accent}`} />
                     <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-wider">{category}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {catStories.map((story) => (
                      <button
                        key={story._id}
                        onClick={() => handleOpenStory(story)}
                        className="group relative bg-[#0B1F3A]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden hover:border-devotion-gold/40 transition-all text-left flex flex-col"
                      >
                        <div className="aspect-[16/10] overflow-hidden relative">
                           {story.thumbnail ? (
                             <img src={story.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                           ) : (
                             <div className={`w-full h-full bg-gradient-to-br ${theme.accent} opacity-20`} />
                           )}
                           <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-transparent to-transparent" />
                           <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-2">
                              <BookOpenText className="w-3 h-3 text-devotion-gold" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-white">{story.chapters?.length || 1} Chapters</span>
                           </div>
                        </div>
                        <div className="p-8">
                           <h3 className="text-xl font-serif font-bold text-white mb-2 group-hover:text-devotion-gold transition-colors">
                              {getLocalizedContent(story)?.title}
                           </h3>
                           <p className="text-sm text-gray-400 line-clamp-2 mb-6">
                              {getLocalizedContent(story)?.description || 'Embark on a spiritual journey...'}
                           </p>
                           <div className="mt-auto flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-devotion-gold">Start Reading</span>
                              <div className="w-10 h-10 rounded-full border border-devotion-gold/20 flex items-center justify-center group-hover:bg-devotion-gold group-hover:text-[#06101E] transition-all">
                                 <ArrowRight className="w-5 h-5" />
                              </div>
                           </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
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
                        <img src={activeStory.thumbnail} alt="" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#06101E] via-[#06101E]/20 to-transparent" />
                      <div className="absolute bottom-10 left-10 right-10">
                         <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-devotion-gold text-[#06101E] rounded-full text-[10px] font-black uppercase tracking-widest">
                               {activeStory.category || 'Spiritual'}
                            </span>
                            {activeStory.isKids && <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">KIDS MODE</span>}
                         </div>
                         <h1 className="text-4xl sm:text-5xl font-serif font-black text-white">
                            {getLocalizedContent(activeStory.chapters?.[activeChapterIndex])?.title || getLocalizedContent(activeStory)?.title}
                         </h1>
                      </div>
                   </div>

                   <div className="bg-[#0B1F3A]/40 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 sm:p-14">
                      <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
                         <div className="flex flex-wrap gap-2">
                            {['en', 'hi', 'te', 'ta', 'kn', 'ml', 'bn', 'mr', 'sa'].map(lang => (
                               <button
                                 key={lang}
                                 onClick={() => setSelectedLanguage(lang)}
                                 className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedLanguage === lang ? 'bg-devotion-gold text-[#06101E] border-devotion-gold' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                               >
                                 {lang === 'hi' ? 'Hindi' : lang === 'te' ? 'Telugu' : lang === 'ta' ? 'Tamil' : lang === 'kn' ? 'Kannada' : lang === 'ml' ? 'Malayalam' : lang === 'bn' ? 'Bengali' : lang === 'mr' ? 'Marathi' : lang === 'sa' ? 'Sanskrit' : 'English'}
                               </button>
                            ))}
                         </div>
                         <button
                           onClick={() => handleToggleAudio(getLocalizedContent(activeStory.chapters?.[activeChapterIndex])?.content || getLocalizedContent(activeStory)?.content)}
                           className="inline-flex items-center gap-3 px-8 py-4 bg-devotion-gold text-[#06101E] rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(255,215,0,0.2)]"
                         >
                            {isSpeaking ? <PauseCircle className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            {isSpeaking ? 'Stop AI Narration' : 'Listen with AI'}
                         </button>
                      </div>

                       <div className="prose prose-invert max-w-none">
                         <p className="text-xl sm:text-2xl leading-relaxed text-white/90 font-serif whitespace-pre-wrap">
                            {getLocalizedContent(activeStory.chapters?.[activeChapterIndex])?.content || getLocalizedContent(activeStory)?.content || 'Seeking wisdom...'}
                         </p>
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
                      <div className="space-y-3">
                         {(activeStory.chapters || [{ title: activeStory.title, _id: 'main' }]).map((chapter, index) => (
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
