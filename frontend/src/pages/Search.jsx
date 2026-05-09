import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, Book, Video, BookOpen, ExternalLink, Film, Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const RECENT_SEARCHES_KEY = 'gita_recent_searches';
const MAX_RECENT_SEARCHES = 8;

export default function Search() {
  const navigate = useNavigate();
  const { tLabel, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ slokas: [], stories: [], videos: [], movies: [], reels: [] });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    try {
      const savedSearches = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
      setRecentSearches(Array.isArray(savedSearches) ? savedSearches : []);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const getAIWisdom = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 5) {
      setAiInsight(null);
      return;
    }
    
    setIsAiLoading(true);
    try {
      const response = await axios.post('/api/chat', { 
        message: `Summarize what the Bhagavad Gita or other scriptures say about: ${searchTerm}. Keep it concise (max 3 sentences) and provide a key takeaway.`,
        language: language || 'en'
      });
      setAiInsight(response.data.reply);
    } catch (err) {
      console.error('AI Insight error:', err);
      setAiInsight(null);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch();
      if (query.trim().length > 5) getAIWisdom(query.trim());
    }, 500);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const normalizedQuery = query.trim();
      const searchUrl = normalizedQuery
        ? `${API_BASE_URL}/api/search?q=${encodeURIComponent(normalizedQuery)}`
        : `${API_BASE_URL}/api/search`;
      const response = await axios.get(searchUrl);
      setResults({
        slokas: Array.isArray(response.data?.slokas) ? response.data.slokas : [],
        stories: Array.isArray(response.data?.stories) ? response.data.stories : [],
        videos: Array.isArray(response.data?.videos) ? response.data.videos : [],
        reels: Array.isArray(response.data?.reels) ? response.data.reels : [],
        movies: Array.isArray(response.data?.movies) ? response.data.movies : [],
      });

      if (normalizedQuery) {
        const updatedRecentSearches = [
          normalizedQuery,
          ...recentSearches.filter((item) => item.toLowerCase() !== normalizedQuery.toLowerCase()),
        ].slice(0, MAX_RECENT_SEARCHES);

        setRecentSearches(updatedRecentSearches);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedRecentSearches));
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults({ slokas: [], stories: [], videos: [], movies: [], reels: [] });
    } finally {
      setLoading(false);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };

    recognition.start();
  };

  const ResultCard = ({ item, type, onOpen }) => {
    const icon = type === 'sloka'
      ? <BookOpen className="text-devotion-gold" />
      : type === 'story'
        ? <Book className="text-blue-400" />
        : type === 'video'
          ? <Video className="text-red-400" />
          : type === 'reel'
            ? <Film className="text-purple-400" />
            : <Film className="text-yellow-300" />;
    
    return (
      <button
        type="button"
        onClick={onOpen}
        className="text-left w-full bg-glass-gradient backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-devotion-gold/50 transition-all group shadow-lg preserve-3d"
        onMouseMove={(e) => {
          const card = e.currentTarget;
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -8;
          const rotateY = ((x - centerX) / centerX) * 8;
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        }}
      >
         <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
               <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">{type}</span>
                  {type === 'movie' && (
                    <div className="flex flex-wrap gap-2 items-center mt-1">
                      <span className="text-[8px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-white/10">{item.genre || 'Divine'}</span>
                      {item.duration > 0 && <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{item.duration} min</span>}
                      {item.isComingSoon && (
                        <span className="text-[8px] bg-devotion-gold/10 text-devotion-gold px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-devotion-gold/30">Coming Soon</span>
                      )}
                    </div>
                  )}
               </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-devotion-gold" />
         </div>
         <h4 className="text-xl font-bold text-white mb-2 group-hover:text-devotion-gold transition-colors">
            {item.title || (item.chapter ? `Chapter ${item.chapter}, Verse ${item.verse}` : 'Gita Wisdom')}
         </h4>
         <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
            {item.englishMeaning || item.summary || item.description || 'Dive into the ancient wisdom of Lord Krishna.'}
         </p>
         {Array.isArray(item.tags) && item.tags.length > 0 && (
           <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.slice(0, 3).map(tag => <span key={tag} className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-500 uppercase tracking-tighter">#{tag}</span>)}
           </div>
         )}
      </button>
    );
  };

  const openResult = (item, type) => {
    if (type === 'story') {
      navigate('/stories', { state: { openStoryId: item._id || item.id } });
      return;
    }

    if (type === 'reel') {
      navigate('/reels', { state: { focusReelId: item._id || item.id } });
      return;
    }

    if (type === 'video') {
      const isKidsContent = Boolean(item?.isKids) || String(item?.category || '').toLowerCase().includes('animated') || String(item?.category || '').toLowerCase().includes('kids');
      if (isKidsContent) {
        navigate('/kids', { state: { openVideoId: item._id || item.id } });
      } else {
        navigate('/videos', { state: { openVideoId: item._id || item.id } });
      }
      return;
    }

    if (type === 'movie') {
      navigate('/movies', { state: { openMovieId: item._id || item.id } });
      return;
    }

    if (type === 'sloka') {
      navigate('/daily-sloka', { state: { savedVerse: item } });
    }
  };

  return (
     <div className="min-h-screen pt-20 sm:pt-28 tv:pt-36 pb-12 px-4 sm:px-6 tv:px-16 relative bg-[#06101E] text-white overflow-hidden">
       <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(122,46,46,0.2),transparent_28%)]"></div>
       <div className="max-w-6xl tv:max-w-[1600px] mx-auto relative z-10">
          
          {/* Search Header */}
          <div className="relative mb-12">
             <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <SearchIcon className="w-6 h-6 text-devotion-gold" />
             </div>
             <input 
               type="text" 
               className={`w-full bg-white/5 backdrop-blur-md border-2 ${isListening ? 'border-devotion-gold animate-pulse' : 'border-devotion-gold/30'} rounded-3xl py-5 sm:py-6 tv:py-8 pl-16 tv:pl-20 pr-24 sm:pr-32 text-xl sm:text-2xl tv:text-3xl font-light text-white placeholder:text-gray-500 focus:border-devotion-gold focus:outline-none transition-all shadow-2xl`}
               placeholder={isListening ? 'Listening...' : tLabel('aiSearch')}
               value={query}
               onChange={(e) => setQuery(e.target.value)}
             />
             <div className="absolute inset-y-0 right-6 flex items-center gap-2 sm:gap-4">
               <button
                 onClick={handleVoiceSearch}
                 className={`p-2 sm:p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-bounce' : 'bg-white/5 text-devotion-gold hover:bg-white/10'}`}
                 title="Voice Search"
               >
                 {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
               </button>
               {query && (
                 <button 
                   onClick={() => setQuery('')}
                   className="text-gray-500 hover:text-white"
                 >
                   <X className="w-6 h-6" />
                 </button>
               )}
             </div>
          </div>
          
          {/* AI Wisdom Insight */}
          {(isAiLoading || aiInsight) && (
            <div className="mb-12 animate-in fade-in slide-in-from-top-8 duration-700">
               <div className="bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-transparent p-[2px] rounded-[2.5rem] shadow-[0_0_50px_rgba(37,99,235,0.1)]">
                  <div className="bg-[#0B1F3A]/80 backdrop-blur-3xl rounded-[2.5rem] p-8 lg:p-10 border border-white/10 relative overflow-hidden group">
                     {/* Holographic light effect */}
                     <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[80px] group-hover:bg-blue-500/30 transition-all duration-700" />
                     
                     <div className="flex items-start gap-6 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shrink-0">
                           <Sparkles className={`w-8 h-8 text-blue-400 ${isAiLoading ? 'animate-spin' : 'animate-pulse'}`} />
                        </div>
                        <div className="flex-1">
                           <h4 className="text-blue-400 font-black text-xs uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                             Divine AI Insight 
                             {isAiLoading && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />}
                           </h4>
                           {isAiLoading ? (
                             <div className="space-y-3">
                               <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse" />
                               <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse" />
                             </div>
                           ) : (
                             <p className="text-xl sm:text-2xl font-serif text-white/90 leading-relaxed italic">
                                "{aiInsight}"
                             </p>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* Results Area */}
           {loading ? (
             <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-devotion-gold"></div>
             </div>
           ) : (results.slokas.length > 0 || results.stories.length > 0 || results.videos.length > 0 || results.movies.length > 0 || results.reels.length > 0) ? (
            <div className="space-y-12 animate-fade-in-up">
               {results.slokas.length > 0 && (
                 <section>
                    <h3 className="text-devotion-gold font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-4">
                       <span className="w-8 h-px bg-devotion-gold/30"></span> Slokas ({results.slokas.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {results.slokas.map(s => <ResultCard key={s._id} item={s} type="sloka" onOpen={() => openResult(s, 'sloka')} />)}
                    </div>
                 </section>
               )}

               {results.stories.length > 0 && (
                 <section>
                      <h3 className="text-devotion-textYellow font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-4">
                        <span className="w-8 h-px bg-devotion-textYellow/30"></span> Stories ({results.stories.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {results.stories.map(s => <ResultCard key={s._id} item={s} type="story" onOpen={() => openResult(s, 'story')} />)}
                    </div>
                 </section>
               )}

                {results.videos.length > 0 && (
                 <section>
                      <h3 className="text-rose-300 font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-4">
                        <span className="w-8 h-px bg-rose-300/30"></span> Videos ({results.videos.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {results.videos.map(v => <ResultCard key={v._id} item={v} type="video" onOpen={() => openResult(v, 'video')} />)}
                    </div>
                 </section>
               )}

                {results.reels.length > 0 && (
                  <section>
                       <h3 className="text-purple-400 font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-4">
                         <span className="w-8 h-px bg-purple-400/30"></span> Reels ({results.reels.length})
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 tv:grid-cols-4 gap-4 sm:gap-6 tv:gap-8">
                        {results.reels.map(r => <ResultCard key={r._id} item={r} type="reel" onOpen={() => openResult(r, 'reel')} />)}
                     </div>
                  </section>
                )}

                {results.movies.length > 0 && (
                  <section>
                     <h3 className="text-yellow-300 font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-4">
                      <span className="w-8 h-px bg-yellow-300/30"></span> Movies ({results.movies.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.movies.map(m => <ResultCard key={m._id} item={m} type="movie" onOpen={() => openResult(m, 'movie')} />)}
                    </div>
                  </section>
                )}

                {results.slokas.length === 0 && results.stories.length === 0 && results.videos.length === 0 && results.movies.length === 0 && results.reels.length === 0 && (
                 <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl">
                    <div className="text-4xl mb-4 opacity-20">🔍</div>
                    <p className="text-gray-500 font-medium">No results found for "{query}"</p>
                 </div>
               )}
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in duration-700">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                     <h3 className="text-4xl lg:text-5xl font-serif font-black text-white uppercase tracking-tight leading-none">Seek & <span className="text-devotion-gold">Awaken</span></h3>
                     <p className="text-gray-400 text-lg leading-relaxed font-medium">"Explore the depths of ancient wisdom. From the battlefield of Kurukshetra to the paths of Karma Yoga, discover everything here."</p>
                     
                     <div className="flex flex-wrap gap-4 pt-4">
                        {['Bhagavad Gita', 'Karma Yoga', 'Meditation', 'Krishna', 'Peace', 'Dharma'].map(tag => (
                          <button 
                            key={tag} 
                            onClick={() => setQuery(tag)}
                            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-devotion-gold hover:bg-devotion-gold hover:text-black transition-all shadow-xl"
                          >
                            #{tag}
                          </button>
                        ))}
                     </div>
                  </div>
                  <div className="relative aspect-video rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl group">
                     <img src="/scene-krishna.svg" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60" alt="Wisdom" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#06101E] via-transparent to-transparent" />
                     <div className="absolute bottom-8 left-8 right-8">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-1.5 h-1.5 bg-devotion-gold rounded-full animate-pulse" />
                           <span className="text-[10px] font-black text-devotion-gold uppercase tracking-[0.3em]">AI Topic of the Day</span>
                        </div>
                        <h4 className="text-2xl font-black uppercase tracking-tighter">The Path of Devotion</h4>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { title: 'Divine Movies', count: results.movies.length || 0, color: 'text-yellow-400' },
                    { title: 'Sacred Slokas', count: results.slokas.length || 0, color: 'text-devotion-gold' },
                    { title: 'Spiritual Stories', count: results.stories.length || 0, color: 'text-blue-400' }
                  ].map(stat => (
                    <div key={stat.title} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl hover:border-white/10 transition-all group">
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{stat.title}</p>
                       <div className="flex items-end justify-between">
                          <span className={`text-4xl font-serif font-black ${stat.color}`}>{stat.count}+</span>
                          <span className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.3em]">Vault Count</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
       </div>
    </div>
  );
}
