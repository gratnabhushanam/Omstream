import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Film, Play, X, Star, Sparkles, Heart, Maximize, ChevronRight, ChevronLeft, Info } from 'lucide-react';
import MediaPlayerHLS from '../components/MediaPlayerHLS';

export default function Movies() {
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [featuredMovie, setFeaturedMovie] = useState(null);

  useEffect(() => { fetchMovies(); }, []);

  useEffect(() => {
    const openMovieId = location.state?.openMovieId;
    if (!openMovieId || movies.length === 0 || selectedMovie) return;
    const matchedMovie = movies.find((m) => String(m._id || m.id) === String(openMovieId));
    if (matchedMovie) setSelectedMovie(matchedMovie);
  }, [location.state, movies, selectedMovie]);

  const fetchMovies = async () => {
    try {
      const response = await axios.get('/api/movies');
      const fetchedMovies = response.data || [];
      setMovies(fetchedMovies);
      if (fetchedMovies.length > 0) {
        // Pick the first one as featured, or one with a specific flag if we had one
        setFeaturedMovie(fetchedMovies[0]);
      }
    } catch {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#06101E]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-devotion-gold"></div>
    </div>
  );

  // Group movies by tags/genre for swimlanes
  const rows = {};
  movies.forEach(movie => {
    const categories = movie.tags && movie.tags.length > 0 ? movie.tags : (movie.genre ? [movie.genre] : ['Featured']);
    categories.forEach(cat => {
      const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
      if (!rows[catName]) rows[catName] = [];
      // Prevent duplicates in a row
      if (!rows[catName].find(m => m._id === movie._id)) {
        rows[catName].push(movie);
      }
    });
  });

  // Ensure 'Featured' row exists if nothing else
  if (Object.keys(rows).length === 0 && movies.length > 0) {
    rows['All Movies'] = [...movies];
  }

  const extractYoutubeId = (url) => {
    if (!url) return null;
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return match ? match[1] : null;
  };

  const featuredYtId = featuredMovie ? extractYoutubeId(featuredMovie.videoUrl || featuredMovie.youtubeUrl || featuredMovie.url || '') : null;
  const featuredThumbUrl = featuredMovie ? (featuredMovie.thumbnail || featuredMovie.thumbnailUrl || (featuredYtId ? `https://img.youtube.com/vi/${featuredYtId}/maxresdefault.jpg` : '/scene-krishna.svg')) : '';

  return (
    <div className="min-h-[100dvh] bg-[#050B14] relative overflow-y-auto overflow-x-hidden text-white pl-safe pr-safe">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes subtle-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .animate-subtle-zoom {
          animation: subtle-zoom 20s infinite alternate ease-in-out;
        }
      `}</style>

      {/* Netflix-style Hero Banner */}
      {featuredMovie && (
        <div className="relative w-full h-[70vh] md:h-[85vh] tv:h-[90vh] flex items-end pb-24 md:pb-32 px-4 sm:px-6 lg:px-12 tv:px-20 pt-20">
          <div className="absolute inset-0 z-0 bg-black overflow-hidden">
            {featuredMovie.trailerUrl ? (
              <div className="w-full h-full relative">
                <MediaPlayerHLS
                  url={featuredMovie.trailerUrl}
                  title={featuredMovie.title}
                  className="w-full h-full scale-[1.1] opacity-70"
                  autoPlay={true}
                  muted={true}
                  loop={true}
                  controls={false}
                  instagramMode={true} // Minimal UI
                />
                <div className="absolute inset-0 bg-black/40" />
              </div>
            ) : (
              <img 
                src={featuredThumbUrl} 
                alt={featuredMovie.title}
                className="w-full h-full object-cover opacity-60 animate-subtle-zoom"
              />
            )}
            
            {/* Elegant Gradient overlays to blend into background */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#050B14] via-[#050B14]/40 to-transparent w-[70%]"></div>
          </div>

          <div className="relative z-10 max-w-3xl tv:max-w-5xl space-y-4 md:space-y-6 animate-fade-in-up">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-devotion-gold" />
                <span className="text-devotion-gold font-black tracking-[0.4em] uppercase text-xs tv:text-sm">Gita Original</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px] tv:text-xs">
                <span>{featuredMovie.genre || 'Divine'}</span>
                {featuredMovie.duration > 0 && (
                   <>
                     <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                     <span>{featuredMovie.duration}m</span>
                   </>
                )}
              </div>
              {featuredMovie.isComingSoon && (
                 <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Upcoming</span>
              )}
            </div>
            
            <h1 className="text-5xl md:text-7xl tv:text-[8rem] font-serif font-black text-white leading-[0.9] drop-shadow-2xl uppercase tracking-tighter">
              {featuredMovie.title}
            </h1>
            
            <p className="text-sm md:text-lg tv:text-2xl text-gray-300 line-clamp-3 md:line-clamp-4 font-serif italic max-w-2xl drop-shadow-lg leading-relaxed">
              {featuredMovie.desc || featuredMovie.description || 'A journey through divine narratives and spiritual wisdom.'}
            </p>

            <div className="flex items-center gap-4 pt-4">
              <button 
                onClick={() => setSelectedMovie(featuredMovie)}
                tabIndex={0}
                className="tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold flex items-center justify-center gap-3 bg-white text-black px-6 py-3 md:px-8 md:py-4 tv:px-12 tv:py-5 rounded-xl font-black text-sm md:text-base tv:text-xl uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-2xl active:scale-95"
              >
                <Play className="w-5 h-5 tv:w-7 tv:h-7 fill-current" /> {featuredMovie.isComingSoon ? 'Watch Trailer' : 'Play Now'}
              </button>
              <button 
                onClick={() => setSelectedMovie(featuredMovie)}
                tabIndex={0}
                className="tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold flex items-center justify-center gap-3 bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-3 md:px-8 md:py-4 tv:px-12 tv:py-5 rounded-xl font-black text-sm md:text-base tv:text-xl uppercase tracking-widest hover:bg-white/30 transition-colors shadow-2xl active:scale-95"
              >
                <Info className="w-5 h-5 tv:w-7 tv:h-7" /> More Info
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 pb-32 -mt-10 md:-mt-20 tv:-mt-32">
        {/* Horizontal Rows */}
        {Object.entries(rows).map(([category, categoryMovies], index) => (
          <MovieRow 
            key={category} 
            title={category} 
            movies={categoryMovies} 
            onSelect={setSelectedMovie} 
            index={index}
          />
        ))}

        {movies.length === 0 && (
          <div className="text-center py-40 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10 mx-4 md:mx-12">
            <Film className="w-16 h-16 text-gray-700 mx-auto mb-6 opacity-30" />
            <p className="text-xl font-serif italic text-gray-500 uppercase tracking-widest">Awaiting Divine Content</p>
          </div>
        )}
      </div>

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      )}
    </div>
  );
}

function MovieRow({ title, movies, onSelect, index }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth + 100 : clientWidth - 100;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-10 md:mb-16 tv:mb-20">
      <div className="px-4 md:px-12 tv:px-20 mb-4 flex items-center justify-between group">
        <h2 className="text-xl md:text-2xl tv:text-4xl font-bold text-white capitalize flex items-center gap-2 transition-colors group-hover:text-devotion-gold">
          {title} <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0" />
        </h2>
      </div>
      
      <div className="relative group/row">
        {/* Scroll Controls (Desktop only) */}
        <button 
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 w-16 bg-gradient-to-r from-[#050B14] to-transparent items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:from-[#050B14]/90"
        >
          <ChevronLeft className="w-10 h-10 text-white hover:scale-125 transition-transform" />
        </button>
        
        <button 
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 w-16 bg-gradient-to-l from-[#050B14] to-transparent items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:from-[#050B14]/90"
        >
          <ChevronRight className="w-10 h-10 text-white hover:scale-125 transition-transform" />
        </button>

        {/* Horizontal Scroll Container */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto overflow-y-visible hide-scrollbar px-4 md:px-12 tv:px-20 gap-4 tv:gap-6 py-6 snap-x snap-mandatory"
        >
          {movies.map((movie) => (
            <div key={movie._id || movie.id} className="snap-start shrink-0">
              <RowMovieCard video={movie} onSelect={onSelect} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RowMovieCard({ video, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const extractYoutubeId = (url) => {
    if (!url) return null;
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return match ? match[1] : null;
  };

  const ytId = extractYoutubeId(video.videoUrl || video.youtubeUrl || video.url || '');
  const thumbUrl = video.thumbnail || video.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '/scene-krishna.svg');

  return (
    <div
      tabIndex={0}
      className="relative cursor-pointer group rounded-xl md:rounded-2xl tv:rounded-3xl overflow-hidden shadow-xl border border-white/5 bg-[#0A1220]
                 w-[280px] h-[160px] md:w-[320px] md:h-[180px] tv:w-[480px] tv:h-[270px]
                 transition-all duration-500 ease-out tv-focusable focus:outline-none focus:ring-4 focus:ring-white z-10 hover:z-30 hover:scale-[1.15] hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] origin-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(video)}
    >
      <div className="absolute inset-0 bg-black">
        <img
          src={thumbUrl}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover opacity-80"
        />
        {/* Subtle gradient so text is readable */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
      </div>

      <div className={`absolute inset-0 p-4 md:p-6 z-20 flex flex-col justify-end transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3 mb-2">
          <button className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
            <Play className="w-4 h-4 md:w-5 md:h-5 ml-1 text-black fill-current" />
          </button>
          <div className="flex-1">
             <h3 className="text-sm md:text-base font-bold text-white line-clamp-1">{video.title}</h3>
             {video.isComingSoon && (
               <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest mt-1 inline-block">Upcoming</span>
             )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">
          <span className={video.isComingSoon ? "text-devotion-gold" : "text-green-500 font-black"}>{video.isComingSoon ? "Coming Soon" : "98% Match"}</span>
          <span className="bg-white/5 px-1.5 py-0.5 rounded text-gray-500 border border-white/10">{video.genre || 'Divine'}</span>
          <span>{video.releaseYear || 'NEW'}</span>
          {video.duration > 0 && <span className="border border-gray-500 px-1 rounded">{video.duration}m</span>}
        </div>
      </div>
    </div>
  );
}

function MovieModal({ movie, onClose }) {
  const videoRef = useRef(null);

  return (
    <div className="fixed inset-0 z-[100] bg-[#02060B] flex flex-col overflow-y-auto pl-safe pr-safe no-scrollbar animate-in fade-in zoom-in duration-300">
      {/* Top Header Controls */}
      <div className="absolute top-0 w-full z-[130] flex items-center justify-between px-6 py-6 pointer-events-none">
         <div className="pointer-events-auto">
            <span className="bg-devotion-gold text-devotion-darkBlue px-5 py-2 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-2xl border border-white/20">Divine Cinema</span>
         </div>
         <button onClick={onClose} className="tv-focusable pointer-events-auto bg-black/40 backdrop-blur-xl text-white w-14 h-14 tv:w-20 tv:h-20 rounded-[2rem] flex items-center justify-center border border-white/20 hover:bg-red-500/40 transition-all active:scale-90 shadow-2xl">
            <X className="w-7 h-7 tv:w-10 tv:h-10" />
         </button>
      </div>

      {/* Video Player Section */}
      <div ref={videoRef} className="relative w-full bg-black flex-shrink-0 z-10 shadow-[0_20px_100px_rgba(0,0,0,1)]">
        <div className="w-full aspect-video">
          <MediaPlayerHLS
            url={(movie.isComingSoon && movie.trailerUrl) ? movie.trailerUrl : (movie.videoUrl || movie.youtubeUrl || movie.url)}
            hlsUrl={movie.hlsUrl}
            title={movie.title}
            className="w-full h-full"
            autoPlay={true}
            controls={true}
            playLimitSeconds={120}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none z-0" />
      </div>

      {/* Detailed Info Section (Spiritual Aesthetic) */}
      <div className="w-full min-h-screen bg-[#FFFDF5] px-6 py-12 md:p-24 relative overflow-hidden text-devotion-darkBlue">
        <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none bg-[url('/scene-krishna.svg')] bg-repeat bg-[length:400px_400px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-devotion-gold/10 rounded-full blur-[120px] -mr-40 -mt-40" />
        
        <div className="max-w-5xl mx-auto relative z-10 space-y-16">
          <div className="border-b-2 border-devotion-gold/10 pb-12">
            <div className="flex flex-wrap items-center gap-4 mb-8">
               <span className="text-green-600 font-black text-sm uppercase tracking-widest">98% Match</span>
               <span className="text-gray-500 font-bold">{movie.releaseYear || '2025'}</span>
               <span className="bg-devotion-gold/10 px-3 py-1 rounded-lg text-devotion-gold font-black text-xs border border-devotion-gold/20">{movie.genre || 'Divine'}</span>
               {movie.duration > 0 && <span className="text-[#5C2B11] font-bold text-sm">{movie.duration}m</span>}
               <span className="bg-devotion-gold/10 px-3 py-1 rounded-lg text-devotion-gold font-black text-xs border border-devotion-gold/20">ULTRA HD</span>
            </div>
            
            <h2 className="text-5xl md:text-8xl tv:text-[8rem] font-serif font-black text-[#5C2B11] mb-8 drop-shadow-sm tracking-tight leading-[0.9] uppercase">
              {movie.title}
            </h2>
            
            <p className="text-[#6D4224] text-2xl md:text-3xl font-serif italic leading-relaxed opacity-90 border-l-8 border-devotion-gold pl-8">
              {movie.desc || movie.description || 'A journey through divine narratives and spiritual wisdom.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
             <div className="lg:col-span-2 space-y-12">
                {/* Spiritual Insights / Moral */}
                <div className="bg-white rounded-[3.5rem] p-12 shadow-[0_30px_70px_rgba(0,0,0,0.08)] border-2 border-devotion-gold/5">
                   <div className="flex items-center gap-5 mb-8">
                      <div className="w-14 h-14 bg-devotion-gold/10 rounded-3xl flex items-center justify-center">
                         <Sparkles className="w-8 h-8 text-devotion-gold" />
                      </div>
                      <span className="text-[11px] font-black text-[#8B4513] uppercase tracking-[0.4em]">Spiritual Insight</span>
                   </div>
                   <p className="text-3xl md:text-4xl font-serif font-black italic text-[#5C2B11] leading-tight">
                      {movie.ownerHistory || "This sacred narrative reveals the eternal connection between the soul and the divine."}
                   </p>
                </div>

                {/* Cast & Credits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Directed By</p>
                      <p className="text-xl font-bold text-[#5C2B11]">Divine Visionaries</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Featured Genre</p>
                      <p className="text-xl font-bold text-[#5C2B11]">{movie.tags?.join(', ') || movie.genre || 'Spiritual, Epic'}</p>
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                {/* Watch Next Card */}
                <div className="bg-gradient-to-br from-devotion-gold to-[#FFB800] rounded-[3rem] p-8 text-devotion-darkBlue shadow-2xl">
                   <h4 className="text-xl font-black uppercase tracking-widest mb-4">Divine Bounty</h4>
                   <p className="text-sm font-serif italic mb-8 opacity-80">Share the wisdom and earn spiritual points for every chapter watched.</p>
                   <button className="w-full py-4 bg-devotion-darkBlue text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
                      Share Wisdom
                   </button>
                </div>

                <div className="p-8 border-2 border-dashed border-devotion-gold/20 rounded-[3rem]">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Content Rating</p>
                   <p className="text-lg font-bold text-[#5C2B11]">U - Universal Wisdom</p>
                   <p className="text-xs text-gray-500 mt-2">Suitable for all seeking souls.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
