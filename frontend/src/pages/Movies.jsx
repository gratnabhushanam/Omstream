import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Play, Star, Sparkles, Heart, Search, Mic, Lock, Volume2, 
  VolumeX, ArrowLeft, Film, Compass, Flame, X, Monitor, 
  Smartphone, Tv, PlusCircle, User, ArrowRight, ChevronLeft, 
  ChevronRight, Info, Plus
} from 'lucide-react';
import MediaPlayerHLS from '../components/MediaPlayerHLS';
import { useLanguage } from '../context/LanguageContext';

export default function Movies() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [hoveredMovieId, setHoveredMovieId] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 10;
    const y = (clientY / window.innerHeight - 0.5) * 10;
    setTilt({ x, y });
  };

  useEffect(() => {
    setLoading(true);
    axios.get('/api/movies')
      .then((res) => setMovies(Array.isArray(res.data) ? res.data : []))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroMovies = movies.slice(0, 5);

  useEffect(() => {
    if (heroMovies.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroMovies.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [heroMovies.length]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0F1014] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#00A8FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const categories = [
    { title: 'Trending Now', filter: (m) => m.views > 1000 || !m.isComingSoon },
    { title: 'New Releases', filter: (m) => m.releaseYear >= 2024 && !m.isComingSoon },
    { title: 'Top Rated', filter: (m) => parseFloat(m.rating || 0) >= 4 },
    { title: 'Action Movies', filter: (m) => m.genre === 'Action' },
    { title: 'Mythological Stories', filter: (m) => m.genre === 'Mythology' || m.genre === 'Epic' },
    { title: 'Historical Movies', filter: (m) => m.genre === 'History' },
    { title: 'Spiritual Content', filter: (m) => m.genre === 'Spiritual' || m.genre === 'Divine' },
    { title: 'Animated Movies', filter: (m) => m.isKids || m.genre === 'Animation' },
    { title: 'Regional Indian Movies', filter: (m) => m.language !== 'English' && m.language !== 'en' },
    { title: 'Continue Watching', filter: (m) => false }, // Placeholder for actual watch history
    { title: 'Recommended For You', filter: (m) => true } // Placeholder for AI recommendations
  ];

  const featured = heroMovies[heroIndex] || movies[0];

  return (
    <div className="min-h-screen bg-[#0F1014] text-white selection:bg-[#00A8FF]/30">
      {/* Premium OTT Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 px-8 lg:px-16 flex items-center justify-between ${scrolled ? 'bg-[#0F1014]/95 backdrop-blur-2xl py-4 border-b border-white/5 shadow-2xl' : 'bg-transparent py-8'}`}>
        <div className="flex items-center gap-12">
          <div onClick={() => navigate('/home')} className="cursor-pointer flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A8FF] to-[#7B2FF7] flex items-center justify-center shadow-[0_0_20px_rgba(0,168,255,0.4)]">
                <Film className="w-6 h-6 text-white" />
             </div>
             <span className="text-2xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Divine Cinema</span>
          </div>
          <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
             {['Home', 'Movies', 'Kids', 'Live', 'Library'].map(m => (
               <button key={m} onClick={() => navigate(`/${m.toLowerCase()}`)} className={`hover:text-white transition-colors ${m === 'Movies' ? 'text-[#00A8FF]' : ''}`}>{m}</button>
             ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-6 py-3 focus-within:border-[#00A8FF] focus-within:shadow-[0_0_20px_rgba(0,168,255,0.3)] transition-all group">
              <Search className="w-4 h-4 text-gray-500 group-focus-within:text-[#00A8FF]" />
              <input type="text" placeholder="AI Search..." className="bg-transparent border-none outline-none px-4 w-48 lg:w-80 text-sm font-medium" />
              <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
                 <Mic className="w-4 h-4 text-[#00A8FF] cursor-pointer hover:scale-125 transition-transform" />
                 <Sparkles className="w-4 h-4 text-[#7B2FF7] animate-pulse" />
              </div>
           </div>
           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00A8FF] to-[#7B2FF7] p-[2px] cursor-pointer hover:scale-110 transition-transform">
              <div className="w-full h-full rounded-full bg-[#0F1014] flex items-center justify-center">
                 <User className="w-5 h-5 text-white" />
              </div>
           </div>
        </div>
      </nav>

      {/* Hero Carousel Section */}
      <section 
        className="relative h-[90vh] w-full overflow-hidden"
        onMouseMove={handleMouseMove}
        style={{ perspective: '2000px' }}
      >
        {featured && (
          <div 
            className="absolute inset-0 transition-all duration-300 ease-out"
            style={{ transform: `rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)` }}
          >
            <div className="absolute inset-0 z-0">
               {(featured.trailerUrl || featured.videoUrl) ? (
                 <div className="w-full h-full relative">
                   <MediaPlayerHLS
                     url={featured.trailerUrl || featured.videoUrl}
                     className="w-full h-full object-cover scale-105 opacity-60"
                     autoPlay={true}
                     muted={isMuted}
                     loop={true}
                     controls={false}
                     instagramMode={true}
                   />
                   <button 
                     onClick={() => setIsMuted(!isMuted)}
                     className="absolute bottom-32 right-12 lg:right-24 z-30 w-14 h-14 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                   >
                     {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                   </button>
                 </div>
               ) : (
                 <img src={featured.thumbnail || "/scene-krishna.svg"} className="w-full h-full object-cover scale-105 animate-slow-zoom" alt="Hero" />
               )}
               <div className="absolute inset-0 bg-gradient-to-r from-[#00A8FF] via-[#0F1014]/40 to-transparent" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0F1014] via-transparent to-transparent h-[40%] top-0" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0F1014] via-transparent to-transparent h-[60%] bottom-0" />
            </div>

            <div className="absolute inset-0 z-10 flex flex-col justify-center px-8 lg:px-24 max-w-5xl gap-6 preserve-3d">
                {/* 3D Floating Layers */}
                <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00A8FF]/10 rounded-full blur-[120px] translate-z-20 pointer-events-none" />
                <div className="absolute right-0 bottom-0 w-[400px] h-[400px] bg-[#7B2FF7]/10 rounded-full blur-[100px] translate-z-40 pointer-events-none" />
                
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left duration-700 translate-z-50">
                   <span className="px-3 py-1 bg-[#00A8FF] text-black text-[10px] font-black rounded-md tracking-tighter shadow-[0_0_20px_rgba(0,168,255,0.5)]">FEATURED</span>
                   <div className="h-px w-12 bg-white/20" />
                   <span className="text-[#00A8FF] font-black text-[10px] tracking-[0.3em] uppercase">Now Streaming</span>
                </div>
               
               <h1 className="text-7xl lg:text-9xl font-black uppercase tracking-tighter leading-none animate-in fade-in slide-in-from-left duration-1000 delay-200">
                  {t(featured, 'title')}
               </h1>

               <div className="flex items-center gap-6 text-sm font-bold text-gray-300 animate-in fade-in slide-in-from-left duration-1000 delay-300">
                  <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-[#00A8FF] fill-current" /> {featured.rating || '9.8'}</span>
                  <span>{featured.releaseYear}</span>
                  <span className="px-2 py-0.5 border border-white/20 rounded text-[10px] uppercase">U/A 13+</span>
                  <span className="text-[#00A8FF]">{featured.genre || 'Divine Epic'}</span>
                  <span>{featured.duration || '120'}m</span>
               </div>

               <p className="text-lg lg:text-xl text-gray-400 line-clamp-3 max-w-2xl font-medium leading-relaxed animate-in fade-in slide-in-from-left duration-1000 delay-400">
                  {t(featured, 'description')}
               </p>

               <div className="flex items-center gap-6 mt-8 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
                  <button 
                    onClick={() => setSelectedMovie(featured)}
                    className="group relative px-12 py-5 bg-[#00A8FF] text-black rounded-2xl font-black text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(0,168,255,0.4)]"
                  >
                     <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                     <div className="relative flex items-center gap-3">
                        <Play className="w-6 h-6 fill-current" /> Watch Now
                     </div>
                  </button>
                  <button className="px-12 py-5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3">
                     <Plus className="w-6 h-6" /> Watchlist
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* Hero Indicators */}
        <div className="absolute bottom-12 right-12 lg:right-24 z-20 flex flex-col gap-4 items-end">
           <div className="flex gap-3">
              {heroMovies.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setHeroIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${heroIndex === idx ? 'w-12 bg-[#00A8FF]' : 'w-3 bg-white/20'}`}
                />
              ))}
           </div>
           <div className="text-[10px] font-black tracking-widest text-white/40 uppercase">Up Next: {heroMovies[(heroIndex + 1) % heroMovies.length]?.title}</div>
        </div>
      </section>

      {/* Movie Content Rows */}
      <div className={`relative z-20 -mt-32 pb-32 space-y-24 transition-all duration-700 ${hoveredMovieId ? 'blur-sm brightness-50 scale-[0.98]' : ''}`}>
         {categories.map((cat, idx) => {
           const isWide = cat.title.toLowerCase().includes('trailer') || cat.title.toLowerCase().includes('soon');
           return (
             <MovieRow 
               key={idx} 
               title={cat.title} 
               movies={movies.filter(cat.filter)} 
               onSelect={setSelectedMovie} 
               setHoveredMovieId={setHoveredMovieId} 
               wideTeaser={isWide}
             />
           );
         })}
      </div>

      {/* Selected Movie Modal Overlay */}
      {selectedMovie && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
          <button onClick={() => setSelectedMovie(null)} className="absolute top-8 right-8 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-[#00A8FF]/20 transition-all z-[110]">
             <X className="w-8 h-8 text-white" />
          </button>
          
          <div className="w-full max-w-6xl aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black relative shadow-[0_0_100px_rgba(0,168,255,0.2)]">
             <MediaPlayerHLS 
               url={selectedMovie.videoUrl} 
               hlsUrl={selectedMovie.hlsUrl}
               title={selectedMovie.title}
               className="w-full h-full"
               autoPlay={true}
               controls={true}
             />
          </div>
        </div>
      )}
    </div>
  );
}

function MovieRow({ title, movies, onSelect, setHoveredMovieId, wideTeaser = false }) {
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
    <div className="px-8 lg:px-24">
       <div className="flex justify-between items-end mb-8">
          <div className="space-y-2">
             <div className="h-1 w-16 bg-[#00A8FF] rounded-full shadow-[0_0_10px_#00A8FF]" />
             <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight text-white">{title}</h2>
          </div>
          <div className="flex gap-3">
             <button onClick={() => scroll('left')} className="p-4 rounded-full bg-white/5 hover:bg-[#00A8FF]/20 transition-all border border-white/10 group"><ChevronLeft className="w-6 h-6 group-hover:scale-125 transition-transform"/></button>
             <button onClick={() => scroll('right')} className="p-4 rounded-full bg-white/5 hover:bg-[#00A8FF]/20 transition-all border border-white/10 group"><ChevronRight className="w-6 h-6 group-hover:scale-125 transition-transform"/></button>
          </div>
       </div>
       
       <div 
         ref={scrollRef}
         className="ott-slider no-scrollbar flex gap-12 overflow-x-auto pb-12"
       >
          {movies.map((movie) => (
            <MovieCard 
              key={movie._id || movie.id} 
              movie={movie} 
              onSelect={onSelect} 
              setHoveredMovieId={setHoveredMovieId} 
              wideTeaser={wideTeaser}
            />
          ))}
       </div>
    </div>
  );
}

function MovieCard({ movie, onSelect, setHoveredMovieId, wideTeaser = false }) {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [activeTrailerIndex, setActiveTrailerIndex] = useState(0);
  const [cardMuted, setCardMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const trailers = (movie.trailerUrl || movie.videoUrl || '').split(',').map(u => u.trim()).filter(Boolean);
  const currentTrailer = trailers[activeTrailerIndex] || trailers[0];
  const ytId = movie.videoUrl?.match(/[?&]v=([^&]+)/)?.[1] || movie.videoUrl?.match(/youtu\.be\/([^?]+)/)?.[1];
  const thumbUrl = movie.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '/scene-krishna.svg');

  useEffect(() => {
    if (!isHovered || trailers.length <= 1) {
      setProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setActiveTrailerIndex((prev) => (prev + 1) % trailers.length);
      setProgress(0);
    }, 6000); // Rotate every 6 seconds on hover
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + (100 / 60), 100)); // 6 seconds = 60 intervals of 100ms
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [isHovered, trailers.length]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSelect(movie);
  };

  return (
    <div 
      tabIndex={0}
      className={`ott-card aspect-video group cursor-pointer bg-white/5 border-[4px] lg:border-[10px] border-white/5 hover:border-[#00A8FF] rounded-[2.5rem] lg:rounded-[4rem] overflow-hidden shadow-2xl shrink-0 transition-all duration-700 tv-focusable hover:scale-[1.05] hover:z-50 hover:shadow-[0_40px_100px_rgba(0,0,0,0.8)] tilt-on-hover holographic-glow ${wideTeaser ? 'w-[320px] lg:w-[920px]' : 'w-[240px] lg:w-[520px]'}`}
      onMouseEnter={() => {
        setIsHovered(true);
        setHoveredMovieId(movie._id || movie.id);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoveredMovieId(null);
        setActiveTrailerIndex(0);
        setCardMuted(true);
      }}
      onClick={() => onSelect(movie)}
      onKeyDown={handleKeyDown}
    >
       <div className="relative w-full h-full">
         <img src={thumbUrl} className={`w-full h-full object-cover transition-all duration-1000 ${isHovered ? 'scale-125 opacity-0 blur-3xl' : 'opacity-80'}`} alt={movie.title} />
         {movie.isComingSoon && (
           <div className="absolute top-6 lg:top-10 left-6 lg:left-10 z-20 px-6 py-2 bg-devotion-gold text-black text-[10px] lg:text-xs font-black rounded-xl uppercase tracking-widest shadow-[0_0_30px_rgba(211,154,74,0.5)]">Coming Soon</div>
         )}
         
         {/* Spatial Navigation Tooltip */}
         <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-500 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
            <div className="w-20 h-20 rounded-full bg-devotion-gold text-black flex items-center justify-center shadow-[0_0_40px_rgba(255,215,0,0.4)] mb-4 animate-pulse">
               <Play className="w-10 h-10 fill-current translate-x-1" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-white">Press Enter to Watch</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-devotion-gold/80 mt-2">{movie.genre} • {movie.duration}m</p>
         </div>
         
         {isHovered && currentTrailer && (
           <div className="absolute inset-0 z-0 animate-in fade-in zoom-in-110 duration-1000">
              <MediaPlayerHLS
                url={currentTrailer}
                className="w-full h-full object-cover"
                autoPlay={true}
                muted={cardMuted}
                controls={false}
                loop={trailers.length === 1}
                instagramMode={true}
              />
              
              {/* Card Controls */}
              <div className="absolute top-8 right-8 flex items-center gap-4 z-20">
                 <button 
                   onClick={(e) => { e.stopPropagation(); setCardMuted(!cardMuted); }}
                   className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                 >
                    {cardMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                 </button>
                 {trailers.length > 1 && (
                    <div className="flex gap-2 bg-black/40 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10">
                       {trailers.map((_, i) => (
                         <div key={i} className="h-1.5 bg-white/20 rounded-full overflow-hidden w-8">
                            <div 
                              className={`h-full bg-[#00A8FF] transition-all duration-100 ${activeTrailerIndex === i ? '' : 'w-0'}`} 
                              style={{ width: activeTrailerIndex === i ? `${progress}%` : activeTrailerIndex > i ? '100%' : '0%' }}
                            />
                         </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
         )}
       </div>
       
       <div className={`absolute inset-0 z-10 flex flex-col justify-end p-6 lg:p-10 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none transition-all duration-500 ${isHovered && wideTeaser ? 'opacity-100' : ''}`}>
          <div className="transform translate-y-6 group-hover:translate-y-0 transition-transform duration-700">
             <div className="flex flex-col gap-2 mb-4">
                {wideTeaser && (
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-[#00A8FF] text-black text-[11px] font-black rounded-lg uppercase tracking-widest shadow-[0_0_20px_rgba(0,168,255,0.4)]">Divine Preview</span>
                    <div className="h-px w-12 bg-white/20" />
                  </div>
                )}
                <h4 className={`font-black uppercase tracking-tighter text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] ${wideTeaser ? 'text-5xl lg:text-7xl' : 'text-xl lg:text-2xl'}`}>{t(movie, 'title')}</h4>
             </div>
             <p className={`text-white/80 font-medium line-clamp-2 mb-8 transition-all duration-700 delay-100 ${wideTeaser && isHovered ? 'opacity-100 h-auto' : 'opacity-0 h-0'}`}>
                {t(movie, 'description')}
             </p>
             <div className="flex items-center gap-8 text-sm font-black text-[#00A8FF] opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200">
                <span className="flex items-center gap-2"><Star className="w-5 h-5 fill-current" /> {movie.rating || '9.8'}</span>
                <span className="text-white/70">{movie.releaseYear}</span>
                <span className="px-4 py-1.5 border-2 border-[#00A8FF]/30 rounded-2xl uppercase text-[10px] tracking-widest">Premium 4K</span>
                {wideTeaser && <span className="text-white/40 uppercase tracking-[0.4em] font-black text-[10px]">{trailers.length} TEASERS ROTATING</span>}
             </div>
          </div>
          <div className="mt-12 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all duration-700 delay-300">
             <div className="flex gap-6 pointer-events-auto">
                <div className={`rounded-full bg-white text-black flex items-center justify-center shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-90 transition-all ${wideTeaser ? 'px-10 py-4 gap-4' : 'w-14 h-14'}`}>
                   <Play className={`${wideTeaser ? 'w-8 h-8' : 'w-10 h-10'} fill-current ml-1`} />
                   {wideTeaser && <span className="text-lg font-black uppercase tracking-[0.2em]">Play Feature</span>}
                </div>
                <div className={`${wideTeaser ? 'w-16 h-16' : 'w-14 h-14'} rounded-full bg-white/5 backdrop-blur-3xl border-2 border-white/10 text-white flex items-center justify-center hover:bg-[#7B2FF7] hover:border-[#7B2FF7] hover:shadow-[0_0_50px_rgba(123,47,247,0.4)] transition-all`}>
                   <Heart className="w-9 h-9" />
                </div>
             </div>
             <button className="p-5 text-white/40 hover:text-white transition-colors pointer-events-auto hover:rotate-90 transition-transform duration-500"><Plus className="w-10 h-10" /></button>
          </div>
       </div>

       {movie.isComingSoon && (
         <div className="absolute top-12 left-12 z-20 px-8 py-3 bg-gradient-to-r from-[#00A8FF] to-[#7B2FF7] text-white text-[14px] font-black rounded-2xl uppercase tracking-[0.4em] shadow-2xl animate-pulse border border-white/20">
            SOON
         </div>
       )}

       <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-[#00A8FF] to-[#7B2FF7] rounded-[3rem] flex items-center justify-center text-white shadow-3xl rotate-12 scale-0 group-hover:scale-100 transition-all duration-700 delay-500">
          <Sparkles className="w-12 h-12" />
       </div>
    </div>
  );
}
