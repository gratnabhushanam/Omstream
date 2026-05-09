import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, Book, Video, BookOpen, ExternalLink, Film, Mic, MicOff, Sparkles, TrendingUp, Star, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/MoviesPremium.css'; // Shared cinematic styles

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const RECENT_SEARCHES_KEY = 'gita_recent_searches';
const MAX_RECENT_SEARCHES = 8;

export default function Search() {
  const navigate = useNavigate();
  const { t, tLabel, language } = useLanguage();
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
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const normalizedQuery = query.trim();
      const searchUrl = normalizedQuery
        ? `${API_BASE_URL}/api/search?q=${encodeURIComponent(normalizedQuery)}&lang=${language}`
        : `${API_BASE_URL}/api/search?lang=${language}`;
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
      ? <BookOpen className="text-[#FF7A00]" />
      : type === 'story'
        ? <Book className="text-blue-400" />
        : type === 'video'
          ? <Video className="text-red-400" />
          : type === 'reel'
            ? <Film className="text-purple-400" />
            : <Film className="text-[#F5C542]" />;
    
    return (
      <button
        type="button"
        onClick={onOpen}
        className="text-left w-full bg-[#0F172A]/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/5 hover:border-[#FF7A00]/40 transition-all group shadow-2xl relative overflow-hidden"
      >
         <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF7A00]/5 blur-3xl group-hover:bg-[#FF7A00]/10 transition-all" />
         <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
               <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30">{type}</span>
                  {type === 'movie' && (
                    <div className="flex flex-wrap gap-2 items-center mt-1">
                      <span className="text-[9px] bg-[#FF7A00]/10 text-[#FF7A00] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-[#FF7A00]/20">{item.genre || 'Divine'}</span>
                      {item.duration > 0 && <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{item.duration}m</span>}
                    </div>
                  )}
               </div>
            </div>
            <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-[#FF7A00] transition-colors" />
         </div>
         <h4 className="text-xl font-black text-white mb-3 group-hover:text-[#FF7A00] transition-colors uppercase tracking-tight">
            {t(item, 'title') || item.title || (item.chapter ? `Chapter ${item.chapter}, Verse ${item.verse}` : 'Gita Wisdom')}
         </h4>
         <p className="text-white/50 text-sm line-clamp-2 leading-relaxed font-serif italic">
            {t(item, 'description') || item.englishMeaning || item.summary || item.description || 'Dive into the ancient wisdom of Lord Krishna.'}
         </p>
         {Array.isArray(item.tags) && item.tags.length > 0 && (
           <div className="mt-6 flex flex-wrap gap-2">
              {item.tags.slice(0, 3).map(tag => <span key={tag} className="text-[9px] bg-white/5 px-3 py-1 rounded-full text-white/40 uppercase tracking-widest font-black border border-white/5">#{tag}</span>)}
           </div>
         )}
      </button>
    );
  };

  const openResult = (item, type) => {
    const pathMap = {
      story: '/stories',
      reel: '/reels',
      video: item?.isKids ? '/kids' : '/videos',
      movie: '/movies',
      sloka: '/daily-sloka'
    };
    const keyMap = {
      story: 'openStoryId',
      reel: 'focusReelId',
      video: 'openVideoId',
      movie: 'openMovieId',
      sloka: 'savedVerse'
    };
    navigate(pathMap[type], { state: { [keyMap[type]]: type === 'sloka' ? item : (item._id || item.id) } });
  };

  return (
     <div className="min-h-screen pt-28 sm:pt-36 pb-20 px-6 sm:px-10 lg:px-24 relative bg-[#0F172A] text-white overflow-hidden selection:bg-[#FF7A00]/30">
       <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.05),transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#FF7A00]/5 blur-[120px] rounded-full" />
       </div>

       <div className="max-w-[1600px] mx-auto relative z-10">
          {/* Search Header */}
          <div className="relative mb-20 animate-slide-down">
             <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                <SearchIcon className="w-8 h-8 text-[#FF7A00]" />
             </div>
             <input 
               type="text" 
               className={`w-full bg-[#0F172A]/60 backdrop-blur-3xl border-2 ${isListening ? 'border-[#FF7A00] animate-pulse shadow-[0_0_50px_rgba(255,122,0,0.2)]' : 'border-white/10'} rounded-[3rem] py-8 pl-24 pr-40 text-2xl lg:text-3xl font-black text-white placeholder:text-white/10 focus:border-[#FF7A00] focus:outline-none transition-all shadow-2xl uppercase tracking-tight`}
               placeholder={isListening ? 'Listening to your frequency...' : tLabel('aiSearch')}
               value={query}
               onChange={(e) => setQuery(e.target.value)}
             />
             <div className="absolute inset-y-0 right-8 flex items-center gap-6">
               <button
                 onClick={handleVoiceSearch}
                 className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-white/5 text-[#FF7A00] hover:bg-white/10 border border-white/10'}`}
               >
                 {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
               </button>
               {query && (
                 <button onClick={() => setQuery('')} className="text-white/20 hover:text-white transition-colors">
                    <X className="w-8 h-8" />
                 </button>
               )}
             </div>
          </div>
          
          {/* AI Wisdom Insight */}
          {(isAiLoading || aiInsight) && (
            <div className="mb-20 animate-slide-up">
               <div className="bg-gradient-to-br from-[#FF7A00]/20 via-[#F5C542]/10 to-transparent p-[2px] rounded-[3rem] shadow-2xl">
                  <div className="bg-[#0F172A]/90 backdrop-blur-3xl rounded-[3rem] p-10 lg:p-14 border border-white/5 relative overflow-hidden group">
                     <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#FF7A00]/10 rounded-full blur-[100px] group-hover:bg-[#FF7A00]/20 transition-all duration-1000" />
                     <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 relative z-10">
                        <div className="w-24 h-24 rounded-3xl bg-[#FF7A00]/20 flex items-center justify-center border border-[#FF7A00]/30 shrink-0 shadow-[0_0_40px_rgba(255,122,0,0.2)]">
                           <Sparkles className={`w-12 h-12 text-[#FF7A00] ${isAiLoading ? 'animate-spin' : 'animate-pulse'}`} />
                        </div>
                        <div className="flex-1 space-y-6">
                           <div className="flex items-center gap-4">
                              <h4 className="text-[#FF7A00] font-black text-xs uppercase tracking-[0.5em]">Divine AI Insight</h4>
                              {isAiLoading && <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-[#FF7A00] w-1/2 animate-shimmer-progress"/></div>}
                           </div>
                           {isAiLoading ? (
                             <div className="space-y-4">
                               <div className="h-6 bg-white/5 rounded-full w-[90%] animate-pulse" />
                               <div className="h-6 bg-white/5 rounded-full w-[70%] animate-pulse" />
                             </div>
                           ) : (
                             <p className="text-2xl lg:text-4xl font-serif text-white leading-relaxed italic drop-shadow-2xl">
                                "{aiInsight}"
                             </p>
                           )}
                        </div>
                        {!isAiLoading && (
                           <div className="bg-[#FF7A00] text-navy-deep px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl self-start lg:self-center">Oracle Active</div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* Results Area */}
          {loading ? (
             <div className="h-[400px] flex flex-col items-center justify-center gap-8">
                <div className="relative w-24 h-24">
                   <div className="absolute inset-0 border-4 border-white/5 rounded-[2rem] rotate-45" />
                   <div className="absolute inset-0 border-t-4 border-[#FF7A00] rounded-[2rem] rotate-45 animate-spin" />
                </div>
                <p className="text-[#FF7A00] text-xs font-black uppercase tracking-[0.6em] animate-pulse">Scanning Akashic Records</p>
             </div>
          ) : (results.slokas.length > 0 || results.stories.length > 0 || results.videos.length > 0 || results.movies.length > 0 || results.reels.length > 0) ? (
            <div className="space-y-24 animate-slide-up">
               {results.movies.length > 0 && (
                  <section>
                     <div className="flex items-center gap-6 mb-10">
                        <div className="h-1.5 w-12 bg-[#FF7A00] rounded-full shadow-[0_0_15px_#FF7A00]" />
                        <h2 className="text-3xl font-black uppercase tracking-[0.3em] italic">Divine Cinema</h2>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                        {results.movies.map(m => <ResultCard key={m._id} item={m} type="movie" onOpen={() => openResult(m, 'movie')} />)}
                     </div>
                  </section>
               )}

               {results.reels.length > 0 && (
                  <section>
                     <div className="flex items-center gap-6 mb-10">
                        <div className="h-1.5 w-12 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                        <h2 className="text-3xl font-black uppercase tracking-[0.3em] italic">Spiritual Reels</h2>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                        {results.reels.map(r => <ResultCard key={r._id} item={r} type="reel" onOpen={() => openResult(r, 'reel')} />)}
                     </div>
                  </section>
               )}

               {results.slokas.length > 0 && (
                 <section>
                    <div className="flex items-center gap-6 mb-10">
                        <div className="h-1.5 w-12 bg-[#FF7A00] rounded-full shadow-[0_0_15px_#FF7A00]" />
                        <h2 className="text-3xl font-black uppercase tracking-[0.3em] italic text-white/40">Sacred Slokas</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                       {results.slokas.map(s => <ResultCard key={s._id} item={s} type="sloka" onOpen={() => openResult(s, 'sloka')} />)}
                    </div>
                 </section>
               )}

               {results.stories.length > 0 && (
                 <section>
                    <div className="flex items-center gap-6 mb-10">
                        <div className="h-1.5 w-12 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        <h2 className="text-3xl font-black uppercase tracking-[0.3em] italic text-white/40">Wisdom Tales</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                       {results.stories.map(s => <ResultCard key={s._id} item={s} type="story" onOpen={() => openResult(s, 'story')} />)}
                    </div>
                 </section>
               )}
            </div>
          ) : (
            <div className="space-y-32 animate-slide-up">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                  <div className="space-y-10">
                     <h3 className="text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.8] italic premium-text-gradient">Seek &<br/>Awaken</h3>
                     <p className="text-white/40 text-2xl leading-relaxed font-serif italic max-w-xl">"Beyond the veil of ignorance lies the eternal truth. Use the Divine Oracle to find your path."</p>
                     
                     <div className="flex flex-wrap gap-4 pt-4">
                        {['Bhagavad Gita', 'Karma Yoga', 'Meditation', 'Krishna', 'Dharma', 'Peace'].map(tag => (
                          <button 
                            key={tag} 
                            onClick={() => setQuery(tag)}
                            className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.3em] text-[#FF7A00] hover:bg-[#FF7A00] hover:text-navy-deep transition-all shadow-2xl active:scale-95"
                          >
                            #{tag}
                          </button>
                        ))}
                     </div>
                  </div>
                  <div className="relative aspect-video rounded-[4rem] overflow-hidden border-[8px] border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] group">
                     <img src="/scene-krishna.svg" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[4s] opacity-50" alt="Wisdom" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent" />
                     <div className="absolute bottom-12 left-12 right-12 flex items-end justify-between">
                        <div className="space-y-3">
                           <div className="flex items-center gap-3">
                              <Sparkles className="w-4 h-4 text-[#FF7A00] animate-pulse" />
                              <span className="text-[10px] font-black text-[#FF7A00] uppercase tracking-[0.4em]">Oracle Guidance</span>
                           </div>
                           <h4 className="text-4xl font-black uppercase tracking-tighter italic">The Path of Devotion</h4>
                        </div>
                        <TrendingUp className="w-10 h-10 text-white/20" />
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {[
                    { title: 'Divine Cinema', count: results.movies.length || '50+', color: 'text-[#F5C542]' },
                    { title: 'Sacred Slokas', count: results.slokas.length || '700+', color: 'text-[#FF7A00]' },
                    { title: 'Wisdom Tales', count: results.stories.length || '120+', color: 'text-blue-400' }
                  ].map(stat => (
                    <div key={stat.title} className="bg-white/5 p-12 rounded-[3rem] border border-white/5 backdrop-blur-3xl hover:border-[#FF7A00]/20 transition-all group relative overflow-hidden">
                       <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-[#FF7A00]/10 transition-all" />
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4">{stat.title}</p>
                       <div className="flex items-end justify-between relative z-10">
                          <span className={`text-6xl font-serif font-black ${stat.color} italic`}>{stat.count}</span>
                          <span className="text-[8px] text-white/10 font-bold uppercase tracking-[0.5em] mb-3">Vault Records</span>
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
