import React, { useState, useEffect, useRef, Suspense } from 'react';
import React, { useState, useEffect, Suspense, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Plus, Star, ChevronLeft, ChevronRight, 
  Clock, TrendingUp, Sparkles, Heart, Search, User,
  LayoutGrid, History, Bookmark, Check, Download, CheckCircle
} from 'lucide-react';
import MediaPlayerHLS from '../components/MediaPlayerHLS';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/MoviesPremium.css';



export default function Movies() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, setUser } = useAuth();
  const [movies, setMovies] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredMovieId, setHoveredMovieId] = useState(null);

  const [downloading, setDownloading] = useState({});
  const [downloadedMovies, setDownloadedMovies] = useState(() => {
    try { return JSON.parse(localStorage.getItem('downloadedMovies') || '[]'); } catch { return []; }
  });

  const [upNextMode, setUpNextMode] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const upNextTimerRef = useRef(null);

  const getNextMovie = () => {
    if (!selectedMovie) return null;
    if (recommendations && recommendations.length > 0) {
      const rec = recommendations.find(r => r._id !== selectedMovie._id);
      if (rec) return rec;
    }
    const similar = movies.find(m => m.genre === selectedMovie.genre && m._id !== selectedMovie._id);
    return similar || movies.find(m => m._id !== selectedMovie._id);
  };
  const nextMovie = getNextMovie();

  const handleVideoEnded = () => {
    if (nextMovie) {
      setUpNextMode(true);
      setCountdown(10);
    }
  };

  useEffect(() => {
    if (upNextMode && countdown > 0) {
      upNextTimerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (upNextMode && countdown === 0) {
      setUpNextMode(false);
      setSelectedMovie(nextMovie);
    }
    return () => clearTimeout(upNextTimerRef.current);
  }, [upNextMode, countdown, nextMovie]);

  const cancelUpNext = () => {
    setUpNextMode(false);
    clearTimeout(upNextTimerRef.current);
  };

  const downloadVideo = async (movie) => {
    if (!movie.videoUrl || downloading[movie._id] === 'downloading') return;
    if (!('caches' in window)) {
      alert('Offline downloads are not supported in this browser.');
      return;
    }
    try {
      setDownloading(prev => ({ ...prev, [movie._id]: 'downloading' }));
      
      const videoUrlToCache = movie.videoUrl.startsWith('http') ? movie.videoUrl : `${window.location.origin}${movie.videoUrl}`;
      const cache = await window.caches.open('offline-video-cache');
      await cache.add(videoUrlToCache);
      
      const currentDownloaded = JSON.parse(localStorage.getItem('downloadedMovies') || '[]');
      if (!currentDownloaded.find(m => m._id === movie._id)) {
        const newDownloaded = [movie, ...currentDownloaded];
        localStorage.setItem('downloadedMovies', JSON.stringify(newDownloaded));
        setDownloadedMovies(newDownloaded);
      }
      
      setDownloading(prev => ({ ...prev, [movie._id]: 'done' }));
    } catch (err) {
      console.error('Download failed', err);
      setDownloading(prev => ({ ...prev, [movie._id]: 'error' }));
      alert('Failed to download video. It may be too large or network error.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch movies first as they are critical
        const moviesRes = await axios.get('/api/movies');
        const moviesData = Array.isArray(moviesRes.data) ? moviesRes.data : [];
        setMovies(moviesData);
        if (moviesData.length > 0) {
          setFeaturedMovie(moviesData[0]);
        }
        
        // Fetch watchlist and recommendations separately
        if (user) {
          try {
            const [watchlistRes, recsRes] = await Promise.all([
              axios.get('/api/movies/watchlist'),
              axios.get('/api/movies/recommendations')
            ]);
            setWatchlist(Array.isArray(watchlistRes.data) ? watchlistRes.data : []);
            setRecommendations(Array.isArray(recsRes.data) ? recsRes.data : []);
          } catch (watchErr) {
            console.error("Watchlist or recs fetch failed", watchErr);
            setWatchlist([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch movies", error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user]);

  const toggleWatchlist = async (movieId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await axios.post(`/api/movies/${movieId}/toggle-watchlist`);
      setWatchlist(data.watchlist);
      // Update local user object if needed
      if (user) {
        const updatedUser = { ...user, watchlist: data.watchlist };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
    }
  };


  const categories = [
    ...(downloadedMovies.length > 0 ? [{ title: 'My Downloads', icon: <Download className="w-5 h-5 text-[#FF7A00]"/>, customMovies: downloadedMovies }] : []),
    ...(recommendations.length > 0 ? [{ title: 'Recommended for You', icon: <Sparkles className="w-5 h-5 text-[#FF7A00]"/>, customMovies: recommendations }] : []),
    { title: 'Divine Selection', icon: <Sparkles className="w-5 h-5 text-[#FF7A00]"/>, filter: () => true },
    { title: 'Your Divine Watchlist', icon: <Bookmark className="w-5 h-5 text-[#FF7A00]"/>, filter: (m) => watchlist.some(w => (w._id || w) === m._id) },
    { title: 'Trending Spiritual Videos', icon: <TrendingUp className="w-5 h-5"/>, filter: (m) => m.views >= 0 }, // Show even with 0 views if no others
    { title: 'Bhagavad Gita Chapters', icon: <LayoutGrid className="w-5 h-5"/>, filter: (m) => m.genre?.toLowerCase().includes('gita') || m.genre?.toLowerCase().includes('chapter') || m.genre?.toLowerCase().includes('divine') },
    { title: 'Meditation & Peace', icon: <Sparkles className="w-5 h-5"/>, filter: (m) => m.genre?.toLowerCase().includes('meditation') || m.genre?.toLowerCase().includes('peace') },
    { title: 'Motivational Wisdom', icon: <History className="w-5 h-5"/>, filter: (m) => m.genre?.toLowerCase().includes('motivation') || m.genre?.toLowerCase().includes('wisdom') },
    { title: 'Devotional Content', icon: <Heart className="w-5 h-5"/>, filter: (m) => m.genre?.toLowerCase().includes('devotional') || m.genre?.toLowerCase().includes('bhakti') || m.genre?.toLowerCase().includes('divine') },
  ];

  if (loading) return <MoviesSkeleton />;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-[#FF7A00]/30 font-sans overflow-x-hidden">
      {/* Premium OTT Navbar */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-700 px-6 lg:px-12 flex items-center justify-between ${scrolled ? 'bg-[#0F172A]/90 backdrop-blur-2xl py-3 border-b border-white/5 shadow-2xl' : 'bg-transparent py-6'}`}>
        <div className="flex items-center gap-10">
          <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-2 group">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#F5C542] flex items-center justify-center shadow-[0_0_20px_rgba(255,122,0,0.6)] group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-navy-deep fill-current" />
             </div>
             <span className="text-2xl font-black tracking-tight premium-text-gradient uppercase italic">Omstream</span>
          </div>
          <div className="hidden lg:flex items-center gap-10 text-xs font-black uppercase tracking-[0.25em] text-white/50">
             {['Home', 'Movies', 'Library'].map(m => (
               <button key={m} onClick={() => navigate(m === 'Library' ? '/stories' : `/${m.toLowerCase()}`)} className={`hover:text-white transition-all hover:tracking-[0.4em] relative group ${m === 'Movies' ? 'text-white' : ''}`}>
                 {m}
                 {m === 'Movies' && <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#FF7A00] rounded-full shadow-[0_0_10px_#FF7A00]" />}
               </button>
             ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div onClick={() => navigate('/search')} className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-2.5 hover:border-[#FF7A00]/50 transition-all cursor-pointer group">
              <Search className="w-4 h-4 text-white/40 group-hover:text-[#FF7A00]" />
              <span className="px-4 text-sm font-medium text-white/20">Search divine wisdom...</span>
           </div>
           <div 
             onClick={() => navigate('/profile')}
             className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF7A00] to-[#7B2FF7] p-[2px] cursor-pointer hover:rotate-12 transition-transform shadow-lg"
           >
              <div className="w-full h-full rounded-[0.9rem] bg-[#0F172A] flex items-center justify-center">
                 <User className="w-5 h-5 text-white" />
              </div>
           </div>
        </div>
      </nav>

       <section className="relative h-[85vh] lg:h-[90vh] w-full px-4 lg:px-24 pt-20 lg:pt-28 mb-16 flex flex-col items-center">
          <div className="relative w-full h-full rounded-[2.5rem] lg:rounded-[4rem] border-2 border-white/10 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] group">
             {/* Navigation Arrows */}
             <div className="absolute inset-y-0 left-6 lg:left-12 z-40 flex items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const idx = movies.indexOf(featuredMovie);
                    const prevIdx = (idx - 1 + movies.length) % movies.length;
                    setFeaturedMovie(movies[prevIdx]);
                  }}
                  className="w-14 h-14 lg:w-20 lg:h-20 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-[#FF7A00] hover:text-navy-deep hover:scale-110 transition-all shadow-2xl group/nav"
                >
                   <ChevronLeft className="w-8 h-8 lg:w-10 lg:h-10 group-hover/nav:-translate-x-1 transition-transform" />
                </button>
             </div>
             <div className="absolute inset-y-0 right-6 lg:right-12 z-40 flex items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const idx = movies.indexOf(featuredMovie);
                    const nextIdx = (idx + 1) % movies.length;
                    setFeaturedMovie(movies[nextIdx]);
                  }}
                  className="w-14 h-14 lg:w-20 lg:h-20 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-[#FF7A00] hover:text-navy-deep hover:scale-110 transition-all shadow-2xl group/nav"
                >
                   <ChevronRight className="w-8 h-8 lg:w-10 lg:h-10 group-hover/nav:translate-x-1 transition-transform" />
                </button>
             </div>

             <AnimatePresence mode="wait">
                {featuredMovie && (
                   <motion.div 
                     key={featuredMovie._id || featuredMovie.id}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 1.2 }}
                     className="absolute inset-0 w-full h-full"
                   >
                   {/* Full Card Background: Visual/Teaser Section */}
                   <div className="absolute inset-0 z-0">
                      <motion.div 
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 2 }}
                        className="w-full h-full overflow-hidden"
                      >
                        {featuredMovie.trailerUrl ? (
                          <div className="w-full h-full pointer-events-none">
                             <MediaPlayerHLS 
                                url={featuredMovie.trailerUrl} 
                                className="w-full h-full object-cover scale-110 premium-video-refinement" 
                                autoPlay={true} 
                                muted={true} 
                                loop={true} 
                                controls={false}
                             />
                          </div>
                        ) : (
                          <img 
                            src={featuredMovie.thumbnail || "/scene-krishna.svg"} 
                            className="w-full h-full object-cover scale-105 premium-video-refinement"
                            alt=""
                          />
                        )}
                        
                        {/* Smart Cinematic Overlay System */}
                        <div className="smart-cinematic-mask" />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-transparent to-transparent z-10 opacity-60" />
                      </motion.div>
                   </div>

                   {/* Hero Metadata Overlay Content */}
                   <div className="relative z-20 h-full flex flex-col justify-center px-10 lg:px-24 max-w-5xl">
                      <motion.div 
                        initial={{ x: -40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="flex flex-wrap items-center gap-4 mb-8 lg:mb-12"
                      >
                         <span className="px-6 py-2 bg-gradient-to-r from-devotion-saffron to-devotion-gold text-navy-deep text-[10px] font-black rounded-lg uppercase tracking-[0.25em] shadow-[0_10px_30px_rgba(255,138,0,0.4)] border border-white/20">
                            {featuredMovie.genre || 'Divine Series'}
                         </span>
                         <div className="flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-5 py-2 rounded-xl border border-white/10 glass-morphism">
                            <Star className="w-4 h-4 text-devotion-gold fill-current" />
                            <span className="text-devotion-gold font-black text-xs">9.8</span>
                         </div>
                         <span className="flex items-center gap-2 text-white/70 font-black text-[10px] uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <Clock className="w-4 h-4" /> {featuredMovie.duration || '2:45:00'}
                         </span>
                         <span className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            U/A ALL AGES
                         </span>
                         <span className="hidden md:inline-flex text-white/40 font-black text-[10px] uppercase tracking-widest">
                            {featuredMovie.views || '425K'} WATCHED
                         </span>
                      </motion.div>

                      <motion.h1 
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 1 }}
                        className="text-5xl lg:text-[7rem] font-black uppercase tracking-tighter leading-[0.8] mb-10 italic premium-text-gradient drop-shadow-3xl"
                      >
                         {t(featuredMovie, 'title')}
                      </motion.h1>

                      <motion.p 
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-lg lg:text-2xl text-white/60 font-serif italic leading-relaxed max-w-3xl line-clamp-2 mb-12 lg:mb-16 cinematic-text-shadow"
                      >
                         {t(featuredMovie, 'description') || "Experience the timeless wisdom of the Gita reimagined with state-of-the-art cinematic storytelling."}
                      </motion.p>

                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="flex flex-wrap items-center gap-6"
                      >
                         <button 
                           tabIndex="0"
                           onClick={() => setSelectedMovie(featuredMovie)}
                           className="tv-focusable premium-btn-primary px-8 lg:px-12 py-5 lg:py-6 rounded-[1.5rem] lg:rounded-[2rem] font-black text-lg lg:text-xl uppercase tracking-[0.2em] flex items-center justify-center gap-5 group shadow-2xl relative z-30"
                         >
                            <Play className="w-6 h-6 lg:w-8 lg:h-8 fill-current" /> 
                            <span className="whitespace-nowrap">Watch Now</span>
                         </button>
                         <button 
                           tabIndex="0"
                           onClick={() => toggleWatchlist(featuredMovie._id)}
                           className={`tv-focusable premium-btn-secondary w-16 h-16 lg:w-20 lg:h-20 rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center transition-all group border-2 relative z-30 ${watchlist.some(w => (w._id || w) === featuredMovie._id) ? 'bg-devotion-saffron border-devotion-saffron text-navy-deep' : 'border-white/10 text-white hover:border-devotion-saffron/50'}`}
                         >
                            {watchlist.some(w => (w._id || w) === featuredMovie._id) ? <Check className="w-9 h-9" /> : <Plus className="w-9 h-9 group-hover:rotate-90 transition-transform" />}
                         </button>
                      </motion.div>
                   </div>

                   {/* Hero Teasers Section */}
                   <div className="absolute bottom-8 lg:bottom-12 right-10 lg:right-24 z-30 hidden md:flex items-center gap-6 max-w-2xl overflow-x-auto no-scrollbar py-4 px-4">
                      {movies.slice(0, 5).map((m) => (
                         <motion.div
                           key={m._id || m.id}
                           whileHover={{ scale: 1.1, y: -5 }}
                           onClick={() => setFeaturedMovie(m)}
                           className={`w-40 lg:w-56 aspect-video rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-500 flex-shrink-0 shadow-2xl ${featuredMovie?._id === m._id ? 'border-[#FF7A00] scale-105 shadow-[0_0_30px_rgba(255,122,0,0.5)]' : 'border-white/10 grayscale hover:grayscale-0'}`}
                         >
                            <img src={m.thumbnail || "/scene-krishna.svg"} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                               <Play className="w-8 h-8 text-[#FF7A00]" />
                            </div>
                         </motion.div>
                      ))}
                   </div>
                </motion.div>
                )}
             </AnimatePresence>
          </div>
       </section>





        {/* Main Content Sections - FIXED: Safe spacing from Hero and TV optimization */}
        <main className={`relative z-20 mt-12 lg:mt-24 tv:mt-32 pb-40 space-y-24 lg:space-y-40 tv:space-y-48 transition-all duration-700 ${hoveredMovieId ? 'brightness-[0.85]' : ''}`}>
          <Suspense fallback={<div className="h-96 w-full skeleton" />}>
            {categories.map((cat, idx) => {
              const rowMovies = cat.customMovies ? cat.customMovies : movies.filter(cat.filter);
              if (rowMovies.length === 0) return null;
              return (
                <MovieRowComponent 
                  key={idx} 
                  title={cat.title} 
                  icon={cat.icon}
                  movies={rowMovies} 
                  onSelect={setSelectedMovie} 
                  setFeaturedMovie={setFeaturedMovie}
                  watchlist={watchlist}
                  toggleWatchlist={toggleWatchlist}
                  featuredMovie={featuredMovie}
                  setHoveredMovieId={setHoveredMovieId}
                />
              );
            })}
          </Suspense>
       </main>

      {/* Premium Footer */}
      <footer className="py-20 lg:py-32 border-t border-white/5 bg-[#0A0F1D] relative overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#FF7A00]/5 rounded-full blur-[120px] pointer-events-none" />
         <div className="container mx-auto px-6 lg:px-24 flex flex-col items-center gap-12 text-center relative z-10">
            <div className="flex items-center gap-4 group">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF7A00] to-[#F5C542] flex items-center justify-center shadow-2xl group-hover:rotate-[360deg] transition-transform duration-1000">
                  <Play className="w-6 h-6 text-navy-deep fill-current" />
               </div>
               <span className="text-3xl font-black tracking-tighter uppercase premium-text-gradient italic">Omstream</span>
            </div>
            <div className="flex flex-wrap justify-center gap-10 text-xs font-black uppercase tracking-[0.3em] text-white/30">
               {['About', 'Categories', 'Privacy Policy', 'Terms of Use', 'Support', 'Contact'].map(l => (
                 <button key={l} className="hover:text-[#FF7A00] transition-colors">{l}</button>
               ))}
            </div>
            <p className="text-white/20 text-sm font-medium tracking-[0.2em] max-w-2xl leading-loose">
               The ultimate spiritual streaming platform dedicated to the eternal wisdom of the Bhagavad Gita and Vedic culture. Experience enlightenment in 4K.
            </p>
         </div>
      </footer>

        {/* Cinematic OTT Video Player Experience */}
        {selectedMovie && (
          <div className="fixed inset-0 z-[1000] bg-[#0B0F1A] animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
            
            {/* Blurred Poster Background */}
            <div className="ott-blurred-bg" style={{ backgroundImage: `url(${selectedMovie.thumbnail})` }} />
            
            {/* Back Button */}
            <button 
              onClick={() => { setSelectedMovie(null); cancelUpNext(); }} 
              className="absolute top-6 left-6 lg:top-10 lg:left-10 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 hover:border-[#FF7A00]/50 transition-all z-[1010] group shadow-2xl tv-focusable"
            >
               <ChevronLeft className="w-8 h-8 text-white group-hover:-translate-x-1 transition-transform" />
            </button>
            
            <div className="relative w-full min-h-screen flex flex-col pb-24">
              
              {/* Player Area */}
              <div className="w-full h-[60vh] lg:h-[75vh] ott-player-container group tv-focusable relative">
                <MediaPlayerHLS 
                  key={selectedMovie._id || selectedMovie.id || selectedMovie.videoUrl}
                  url={selectedMovie.videoUrl} 
                  hlsUrl={selectedMovie.hlsUrl}
                  title={selectedMovie.title}
                  className="w-full h-full object-cover"
                  autoPlay={true}
                  controls={true}
                  youtubeParams="controls=0&modestbranding=1&rel=0&disablekb=1&iv_load_policy=3"
                  onEnded={handleVideoEnded}
                />
                {/* Gradient Overlay linking player to page */}
                <div className="ott-video-overlay pointer-events-none" />

                {/* Up Next Overlay */}
                {upNextMode && nextMovie && (
                   <div className="absolute inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-6 text-center backdrop-blur-md animate-in fade-in duration-500">
                      <p className="text-gray-400 font-bold uppercase tracking-[0.3em] mb-4">Up Next in {countdown}s</p>
                      <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 uppercase tracking-tighter drop-shadow-2xl max-w-4xl truncate">{nextMovie.title}</h2>
                      <div className="w-64 lg:w-96 aspect-video rounded-xl overflow-hidden shadow-2xl mb-8 border-2 border-[#FF7A00]/30">
                         <img src={nextMovie.thumbnail} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex items-center gap-4">
                         <button 
                           onClick={() => { setUpNextMode(false); setSelectedMovie(nextMovie); }}
                           className="px-8 py-4 bg-[#FF7A00] text-black font-black uppercase tracking-widest rounded-lg hover:scale-105 transition-transform tv-focusable shadow-[0_0_20px_rgba(255,122,0,0.4)]"
                         >
                           Play Now
                         </button>
                         <button 
                           onClick={cancelUpNext}
                           className="px-8 py-4 bg-white/10 text-white font-bold uppercase tracking-widest rounded-lg border border-white/20 hover:bg-white/20 transition-colors tv-focusable"
                         >
                           Cancel
                         </button>
                      </div>
                   </div>
                )}
              </div>
              
              {/* Movie Details overlaying bottom of player on desktop */}
              <div className="px-6 lg:px-16 relative z-30 lg:-mt-24 pt-6 lg:pt-0">
                 
                 <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-[#F5A623] text-[#0B0F1A] text-[9px] font-black rounded-sm uppercase tracking-widest shadow-[0_0_10px_rgba(245,166,35,0.4)]">Premium 4K</span>
                    <span className="text-white/70 font-bold text-xs uppercase tracking-widest">{selectedMovie.genre || 'Divine'}</span>
                    <span className="text-white/50 text-xs font-bold">•</span>
                    <span className="text-white/70 font-bold text-xs">{selectedMovie.duration || 120}m</span>
                 </div>
                 
                 <h1 className="text-5xl lg:text-[5rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none mb-6">
                   {selectedMovie.title}
                 </h1>
                 
                 <div className="flex flex-wrap items-center gap-4 mb-8">
                    <button className="ott-play-button tv-focusable flex items-center gap-2 px-8 py-4 rounded-md font-bold text-base uppercase tracking-widest">
                       <Play className="w-6 h-6 fill-current" /> Play Again
                    </button>
                    <button 
                      onClick={() => toggleWatchlist(selectedMovie._id)} 
                      className="ott-secondary-button tv-focusable flex items-center gap-2 px-6 py-4 rounded-md font-bold text-sm uppercase tracking-widest"
                    >
                       {watchlist.some(w => (w._id || w) === selectedMovie._id) ? <Check className="w-5 h-5 text-[#F5A623]" /> : <Plus className="w-5 h-5" />}
                       {watchlist.some(w => (w._id || w) === selectedMovie._id) ? 'Saved' : 'Add to Watchlist'}
                    </button>
                    <button className="ott-secondary-button tv-focusable p-4 rounded-full">
                       <Heart className="w-5 h-5" />
                    </button>
                    {selectedMovie.videoUrl && (
                      <button 
                        onClick={() => downloadVideo(selectedMovie)}
                        disabled={downloading[selectedMovie._id] === 'downloading' || downloadedMovies.some(m => m._id === selectedMovie._id)}
                        className={`ott-secondary-button tv-focusable flex items-center gap-2 px-6 py-4 rounded-md font-bold text-sm uppercase tracking-widest ${downloadedMovies.some(m => m._id === selectedMovie._id) ? 'text-[#F5A623] border-[#F5A623]/50' : ''}`}
                      >
                        {downloadedMovies.some(m => m._id === selectedMovie._id) || downloading[selectedMovie._id] === 'done' ? (
                          <><CheckCircle className="w-5 h-5" /> Downloaded</>
                        ) : downloading[selectedMovie._id] === 'downloading' ? (
                          <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Downloading...</>
                        ) : (
                          <><Download className="w-5 h-5" /> Download</>
                        )}
                      </button>
                    )}
                 </div>
                 
                 <p className="text-white/80 max-w-3xl text-sm lg:text-lg font-serif leading-relaxed" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                   {selectedMovie.description}
                 </p>
              </div>

              {/* Discovery Section - More Like This */}
              <div className="px-6 lg:px-16 mt-16 relative z-30">
                 <h3 className="text-xl lg:text-2xl font-bold text-white mb-6 border-l-4 border-[#F5A623] pl-4">More Like This</h3>
                 <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 pt-4">
                    {movies.filter(m => m.genre === selectedMovie.genre && m._id !== selectedMovie._id).slice(0, 6).map((movie) => (
                       <button 
                         key={movie._id} 
                         onClick={() => setSelectedMovie(movie)}
                         className="flex-shrink-0 w-[240px] lg:w-[320px] aspect-video rounded-xl overflow-hidden relative group ott-card-hover tv-focusable cursor-pointer border border-white/10 text-left"
                       >
                         <img src={movie.thumbnail || movie.coverImage} alt={movie.title} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <h4 className="text-white font-bold text-sm truncate w-full">{movie.title}</h4>
                         </div>
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/50">
                               <Play className="w-5 h-5 text-white fill-current" />
                            </div>
                         </div>
                       </button>
                    ))}
                 </div>
              </div>
              
            </div>
          </div>
        )}
    </div>
  );
}

function MovieRowComponent({ title, icon, movies, onSelect, setFeaturedMovie, watchlist, toggleWatchlist, featuredMovie, setHoveredMovieId }) {
  const scrollRef = useRef(null);
  const scroll = (dir) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const offset = dir === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollLeft + offset, behavior: 'smooth' });
    }
  };

  if (movies.length === 0) return null;

  return (
    <div className="space-y-12">
       <div className="flex justify-between items-center px-4">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-devotion-saffron to-devotion-gold flex items-center justify-center shadow-2xl">
                {icon || <TrendingUp className="w-8 h-8 text-navy-deep" />}
             </div>
             <div className="flex flex-col">
                <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tight text-white italic premium-text-gradient">{title}</h2>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-1">Cinematic Selection</span>
             </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => scroll('left')} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:bg-devotion-saffron hover:text-navy-deep transition-all flex items-center justify-center">
                <ChevronLeft className="w-8 h-8" />
             </button>
             <button onClick={() => scroll('right')} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:bg-devotion-saffron hover:text-navy-deep transition-all flex items-center justify-center">
                <ChevronRight className="w-8 h-8" />
             </button>
          </div>
       </div>
       
       <div ref={scrollRef} className="flex gap-8 overflow-x-auto no-scrollbar py-12 px-4 snap-x snap-mandatory">
         {movies.map((movie) => (
           <MovieCardComponent 
             key={movie._id || movie.id} 
             movie={movie} 
             onSelect={onSelect} 
             setFeaturedMovie={setFeaturedMovie}
             isSaved={watchlist.some(w => (w._id || w) === movie._id)}
             onToggleWatchlist={(movieId) => toggleWatchlist(movieId)}
             isActive={featuredMovie && (featuredMovie._id === movie._id)}
             setHoveredMovieId={setHoveredMovieId}
           />
         ))}
       </div>
    </div>
  );
}

function MovieCardComponent({ movie, onSelect, setFeaturedMovie, isActive, setHoveredMovieId, isSaved, onToggleWatchlist }) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useLanguage();

  return (
    <motion.div
      layout
      tabIndex="0"
      whileHover={{ scale: 1.1, rotateY: 5, rotateX: 2, z: 50 }}
      whileFocus={{ scale: 1.1, rotateY: 5, rotateX: 2, z: 50, outline: 'none' }}
      onFocus={() => {
        setIsHovered(true);
        setFeaturedMovie(movie);
        setHoveredMovieId(movie._id);
      }}
      onBlur={() => {
        setIsHovered(false);
        setHoveredMovieId(null);
      }}
      onHoverStart={() => {
        setIsHovered(true);
        setHoveredMovieId(movie._id);
        setTimeout(() => setFeaturedMovie(movie), 150);
      }}
      onHoverEnd={() => {
        setIsHovered(false);
        setHoveredMovieId(null);
      }}
      onClick={() => {
        setFeaturedMovie(movie);
        onSelect(movie);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setFeaturedMovie && setFeaturedMovie(movie);
          onSelect(movie);
        }
      }}
      className={`relative flex-shrink-0 w-64 lg:w-80 h-[450px] rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 premium-card-shadow premium-focus-ring ${isActive ? 'ring-4 ring-devotion-saffron shadow-[0_0_40px_rgba(255,122,0,0.4)]' : 'border border-white/10'} ${isHovered ? 'brightness-110 saturate-110' : ''}`}
      style={{ perspective: "1000px" }}
    >
        {/* Content Container */}
        <div className="absolute inset-0 z-0">
          {isHovered && movie.trailerUrl ? (
            <div className="w-full h-full animate-fade-in">
              <MediaPlayerHLS 
                url={movie.trailerUrl} 
                className="w-full h-full object-cover scale-110" 
                autoPlay={true} 
                muted={true} 
                loop={true} 
                controls={false}
              />
            </div>
          ) : (
            <img 
              src={movie.thumbnail || "/scene-krishna.svg"} 
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              alt={movie.title}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {/* Floating Watchlist Button */}
        <div className={`absolute top-6 right-6 z-30 transition-all duration-500 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(movie._id);
            }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-3xl border-2 transition-all ${isSaved ? 'bg-devotion-saffron border-devotion-saffron text-navy-deep shadow-[0_0_20px_#FF7A00]' : 'bg-black/20 border-white/20 text-white hover:border-devotion-saffron/50'}`}
          >
            {isSaved ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>

        {/* Metadata Overlay */}
        <div className={`absolute inset-0 flex flex-col justify-end p-8 transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 italic">{t(movie, 'title')}</h3>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-devotion-saffron uppercase tracking-widest">{movie.genre || 'Divine'}</span>
             <span className="w-1 h-1 bg-white/20 rounded-full" />
             <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{movie.releaseYear || '2025'}</span>
          </div>
        </div>

        {/* Hover Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/10 overflow-hidden z-20">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: isHovered ? '100%' : 0 }}
             transition={{ duration: 5 }}
             className="h-full bg-[#FF7A00] shadow-[0_0_10px_#FF7A00]"
           />
        </div>

       {/* Background Glow */}
       <div className={`absolute -inset-8 bg-[#FF7A00]/10 blur-[40px] rounded-full transition-opacity duration-500 -z-10 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
    </motion.div>
  );
}

function MoviesSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F172A] p-0 space-y-24">
      <div className="h-[90vh] w-full relative overflow-hidden bg-white/5">
         <div className="absolute inset-0 skeleton" />
         <div className="absolute inset-0 hero-overlay" />
         <div className="absolute left-24 bottom-32 w-full max-w-4xl space-y-10">
            <div className="h-10 w-48 skeleton rounded-xl" />
            <div className="h-32 w-full skeleton rounded-2xl" />
            <div className="h-24 w-3/4 skeleton rounded-2xl" />
            <div className="flex gap-8">
               <div className="h-16 w-64 skeleton rounded-[2rem]" />
               <div className="h-16 w-64 skeleton rounded-[2rem]" />
            </div>
         </div>
      </div>
      
      {[1, 2].map(i => (
        <div key={i} className="px-24 space-y-10">
          <div className="flex items-center gap-6">
             <div className="h-10 w-10 skeleton rounded-full" />
             <div className="h-10 w-80 skeleton rounded-xl" />
          </div>
          <div className="flex gap-10 overflow-hidden">
             {[1, 2, 3, 4].map(j => (
               <div key={j} className="w-[480px] aspect-video skeleton rounded-3xl shrink-0" />
             ))}
          </div>
        </div>
      ))}
    </div>
  );
}
