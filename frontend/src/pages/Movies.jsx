import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Film, Play, X, Star, Sparkles, Heart, Maximize, ChevronRight } from 'lucide-react';
import MediaPlayerHLS from '../components/MediaPlayerHLS';

export default function Movies() {
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);

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
      setMovies(response.data);
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

  return (
    <div className="min-h-[100dvh] bg-[#050B14] pt-20 landscape:pt-14 md:pt-28 pb-32 px-4 sm:px-6 lg:px-8 relative overflow-y-auto overflow-x-hidden text-white pl-safe pr-safe">
      <style>{`
        @keyframes sparkle-bg { 0%,100%{opacity:.15} 50%{opacity:.25} }
        .animate-sparkle-bg {
          background: repeating-radial-gradient(circle at 60% 30%,#FFD70033 0 2px,transparent 3px 100px),
          repeating-radial-gradient(circle at 20% 80%,#FFD70022 0 1.5px,transparent 2.5px 100px);
          animation: sparkle-bg 4s ease-in-out infinite;
        }
        @keyframes float-streak {
          0%{transform:translate(-100px,100px) rotate(45deg);opacity:0}
          50%{opacity:.3}
          100%{transform:translate(100vw,-100vh) rotate(45deg);opacity:0}
        }
        .light-streak {
          position:absolute;width:300px;height:1px;
          background:linear-gradient(90deg,transparent,rgba(255,215,0,.4),transparent);
          animation:float-streak 10s linear infinite;filter:blur(3px);pointer-events:none;
        }
        @media (orientation:landscape) and (max-width:1024px) {
          .landscape-header { display: none !important; }
          .landscape-mini-header { display: flex !important; }
          .movie-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
        .landscape-mini-header { display: none; }
      `}</style>

      {/* Background layers */}
      <div className="absolute inset-0 bg-[#020610] z-0"></div>
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_top_right,rgba(255,159,28,0.1),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(0,50,100,0.3),transparent_60%)]"></div>
      
      <div className="pointer-events-none absolute inset-0 z-10 animate-sparkle-bg" />
      <div className="light-streak" style={{ top: '70%', left: '-10%', animationDelay: '0s' }}></div>
      <div className="light-streak" style={{ top: '30%', left: '-20%', animationDelay: '5s' }}></div>

      <div className="max-w-[1920px] mx-auto relative z-10">
        
        {/* Mobile-First Cinematic Header */}
        <div className="landscape-header text-center mb-16 md:mb-32 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-devotion-gold/30 bg-devotion-gold/5 backdrop-blur-xl mb-6 text-devotion-gold text-[9px] font-black tracking-[0.4em] uppercase">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Divine Cinema
          </div>
          <h1 className="text-6xl md:text-9xl font-serif font-black text-white mb-4 tracking-tighter uppercase leading-none drop-shadow-2xl">
            Pure <span className="text-devotion-gold italic font-light tracking-normal opacity-90">Wisdom</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-400 font-serif italic max-w-2xl mx-auto leading-relaxed opacity-60">"Stories of valor, devotion, and the eternal spirit."</p>
        </div>

        {/* Landscape Mini-Header */}
        <div className="landscape-mini-header items-center gap-3 mb-6 animate-fade-in-up bg-black/50 backdrop-blur-xl p-4 rounded-2xl border border-white/10 sticky top-2 z-50 shadow-2xl">
          <Film className="w-5 h-5 text-devotion-gold" />
          <span className="text-devotion-gold font-black text-xs uppercase tracking-widest">Library</span>
          <ChevronRight className="w-4 h-4 text-white/30" />
          <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">{movies.length} TITLES</span>
        </div>

        {/* Movie Grid - Optimized Gaps */}
        <div className="movie-grid grid grid-cols-1 sm:grid-cols-2 landscape:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10 pb-24 relative z-10">
          {movies.map((movie, index) => (
            <MovieCard
              key={movie._id || movie.id || index}
              video={movie}
              index={index}
              onSelect={setSelectedMovie}
            />
          ))}
        </div>

        {movies.length === 0 && (
          <div className="text-center py-40 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10">
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

function MovieModal({ movie, onClose }) {
  const videoRef = useRef(null);

  const handleFullscreen = () => {
    const el = videoRef.current?.querySelector('video') || videoRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen();
      if (screen.orientation?.lock) screen.orientation.lock('landscape').catch(() => {});
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#02060B]/98 backdrop-blur-3xl flex flex-col overflow-y-auto pl-safe pr-safe">
      {/* Mobile-Native Top Bar */}
      <div className="sticky top-0 w-full z-[120] flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
         <div className="pointer-events-auto">
            <span className="text-devotion-gold text-[10px] font-black uppercase tracking-[0.3em] bg-devotion-gold/10 px-3 py-1 rounded-full border border-devotion-gold/20">Now Playing</span>
         </div>
         <button onClick={onClose} className="pointer-events-auto bg-black/60 backdrop-blur-md text-white w-11 h-11 rounded-2xl flex items-center justify-center border border-white/10 hover:bg-red-500/40 transition-all active:scale-90 shadow-2xl">
            <X className="w-6 h-6" />
         </button>
      </div>

      {/* Video Panel */}
      <div ref={videoRef} className="relative w-full bg-black flex-shrink-0 z-10 shadow-[0_20px_100px_rgba(0,0,0,1)]">
        <div className="max-w-6xl mx-auto w-full aspect-video">
          <MediaPlayerHLS
            url={movie.videoUrl || movie.youtubeUrl || movie.url}
            hlsUrl={movie.hlsUrl}
            title={movie.title}
            className="w-full h-full object-contain"
            youtubeParams="autoplay=1&rel=0&modestbranding=1"
            autoPlay
            controls
            playLimitSeconds={120}
          />
        </div>
        <button onClick={handleFullscreen} className="absolute bottom-6 right-6 bg-devotion-gold/20 backdrop-blur-md text-devotion-gold p-3 rounded-2xl border border-devotion-gold/40 hover:bg-devotion-gold hover:text-black transition-all z-20 active:scale-95 shadow-2xl">
          <Maximize className="w-5 h-5" />
        </button>
      </div>

      {/* Info Panel - PREMIUM CINEMATIC LAYOUT */}
      <div className="w-full min-h-screen bg-[#06101E] px-6 py-12 md:p-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-devotion-gold/10 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-[180px] translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-12">
          <div className="border-b border-white/10 pb-12">
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <span className="bg-devotion-gold text-[#06101E] px-4 py-1 rounded-xl font-black text-[10px] tracking-widest uppercase shadow-[0_10px_25px_rgba(255,215,0,0.3)]">PREMIUM VIEW</span>
              <span className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-black">{movie.releaseYear || 'ORIGINAL'}</span>
            </div>
            <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase font-serif drop-shadow-2xl mb-8 leading-[0.9]">
              {movie.title}
            </h2>
            <div className="max-w-2xl border-l-4 border-devotion-gold/40 pl-8">
               <p className="text-gray-300 text-xl md:text-3xl leading-relaxed font-serif italic opacity-90">
                 {movie.desc || movie.description || 'A journey through divine narratives and spiritual wisdom.'}
               </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8 flex flex-col">
              {movie.ownerHistory && (
                <div className="bg-white/[0.02] border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-2xl flex-1 border-t-white/20">
                  <p className="text-devotion-gold text-[10px] font-black uppercase tracking-[0.5em] mb-6 opacity-80">Divine History</p>
                  <p className="text-white text-lg md:text-xl leading-relaxed font-serif italic opacity-80">{movie.ownerHistory}</p>
                </div>
              )}
            </div>

            <div className="space-y-8">
               <div className="bg-gradient-to-br from-devotion-gold/10 to-transparent border border-devotion-gold/20 rounded-[3rem] p-10 space-y-8 shadow-2xl">
                  <div className="flex flex-col gap-4">
                    <button onClick={handleFullscreen} className="w-full bg-devotion-gold text-[#06101E] px-8 py-6 rounded-2xl font-black tracking-[0.2em] transition-all text-xs uppercase flex items-center justify-center gap-4 shadow-[0_20px_45px_rgba(255,215,0,0.3)] hover:scale-[1.02] active:scale-95">
                      <Maximize className="w-6 h-6" /> FULL CINEMA MODE
                    </button>
                    <button onClick={onClose} className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-6 rounded-2xl font-black tracking-[0.2em] transition-all text-xs uppercase active:scale-95">
                      BACK TO LIBRARY
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MovieCard({ video, onSelect, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    setIsDesktop(window.innerWidth > 1024);
    const handleResize = () => setIsDesktop(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isDesktop) hoverTimeoutRef.current = setTimeout(() => setShowVideo(true), 800);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowVideo(false);
    clearTimeout(hoverTimeoutRef.current);
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
      className="relative cursor-pointer group rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5
                 h-[420px] sm:h-[480px] md:h-[560px]
                 transition-all duration-300 ease-out preserve-3d"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={(e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      }}
      onClick={() => onSelect(video)}
    >
      {/* Thumbnail */}
      <div className="absolute inset-0 bg-black">
        <img
          src={thumbUrl}
          alt={video.title}
          loading="lazy"
          className={`w-full h-full object-cover opacity-70 transition-transform duration-[2s] ease-out ${isHovered ? 'scale-110' : 'scale-100'}`}
        />
        {showVideo && ytId && (
          <div className="absolute inset-0 z-10 bg-black animate-fade-in duration-1000">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${ytId}`}
              className="w-full h-[140%] -translate-y-[15%] pointer-events-none opacity-80"
              allow="autoplay; encrypted-media"
              frameBorder="0"
              title="Preview"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06101E] via-[#06101E]/40 to-transparent z-20"></div>
      </div>

      {/* Badges */}
      <div className="absolute top-6 left-6 z-30 flex gap-2">
        {index < 2 && <span className="bg-devotion-gold text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-2xl">Featured</span>}
        {video.releaseYear && <span className="bg-black/60 backdrop-blur-md border border-white/20 text-white text-[9px] font-black px-3 py-1.5 rounded-xl">{video.releaseYear}</span>}
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 p-8 z-30 flex flex-col justify-end items-start group-hover:pb-12 transition-all duration-500">
        <div className={`w-14 h-14 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-white/20 mb-6 transition-all duration-500 ${isHovered ? 'bg-devotion-gold text-black border-devotion-gold scale-110 rotate-[10deg] shadow-[0_0_40px_rgba(255,215,0,0.4)]' : 'text-devotion-gold'}`}>
          <Play className="w-6 h-6 ml-1 fill-current" />
        </div>
        <h3 className="text-3xl md:text-4xl font-serif font-black text-white mb-2 leading-[0.9] drop-shadow-2xl tracking-tighter uppercase transition-transform group-hover:-translate-y-2" style={{ transform: 'translateZ(50px)' }}>
          {video.title}
        </h3>
        <p className="text-gray-400 text-sm mb-6 line-clamp-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 italic font-serif">
          {video.description || 'A journey through the divine essence of the Gita.'}
        </p>
        <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
           <div className="h-0.5 w-8 bg-devotion-gold"></div>
           <span className="text-[10px] font-black text-devotion-gold uppercase tracking-[0.3em]">Watch Experience</span>
        </div>
      </div>
    </div>
  );
}
