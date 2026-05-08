import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Star, BookOpen, X, Sparkles, Heart, BrainCircuit, Maximize, ChevronRight } from 'lucide-react';
import MediaPlayerHLS from '../components/MediaPlayerHLS';

export default function KidsMode() {
    const location = useLocation();
    const [videos, setVideos] = useState([]);
    const [, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);

    const [favorites, setFavorites] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem('kidsFavorites') || '[]');
      } catch {
        return [];
      }
    });

    const isFavorite = (video) => favorites.includes(video._id || video.id);
    const toggleFavorite = (video) => {
      const id = video._id || video.id;
      setFavorites((prev) => {
        const updated = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
        localStorage.setItem('kidsFavorites', JSON.stringify(updated));
        return updated;
      });
    };

    useEffect(() => {
      setLoading(true);
      axios.get('/api/videos/kids')
        .then(res => setVideos(Array.isArray(res.data) ? res.data : []))
        .catch(() => setVideos([]))
        .finally(() => setLoading(false));
    }, [location]);

    return (
      <div className="min-h-[100dvh] bg-[#020610] pt-20 landscape:pt-14 md:pt-28 pb-32 px-4 sm:px-6 lg:px-8 text-white overflow-y-auto overflow-x-hidden relative pl-safe pr-safe">
        <style>{`
          @keyframes float-krishna { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
          .animate-float-krishna { animation: float-krishna 6s ease-in-out infinite; }
          @keyframes sparkle { 0%,100%{opacity:.2} 50%{opacity:.4} }
          .animate-sparkle { animation: sparkle 3s ease-in-out infinite; }
          @media (orientation:landscape) and (max-width:1024px) {
            .kids-landscape-header { display:none !important; }
            .kids-landscape-mini { display:flex !important; }
            .kids-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          }
          .kids-landscape-mini { display:none; }
        `}</style>

        {/* Background Layers */}
        <div className="absolute inset-0 bg-[#020610] z-0"></div>
        <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_top_right,rgba(255,180,0,0.12),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(0,100,200,0.25),transparent_60%)]"></div>
        
        <div className="pointer-events-none absolute inset-0 z-10 animate-sparkle bg-[url('/sparkles.svg')] opacity-20" />

        {/* Playful Header */}
        <div className="kids-landscape-header relative z-20 max-w-4xl mx-auto text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border-2 border-devotion-gold/30 bg-devotion-gold/10 text-devotion-gold text-[10px] font-black tracking-[0.4em] uppercase mb-8 shadow-2xl">
            <Sparkles className="w-5 h-5 animate-spin-slow" /> Little Krishna World
          </div>
          <h1 className="text-6xl md:text-9xl tv:text-[10rem] font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-white to-[#FFD700] drop-shadow-[0_10px_40px_rgba(255,215,0,0.4)] mb-6 uppercase tracking-tight leading-none">
             Divine <span className="italic font-light tracking-normal opacity-90">Kids</span>
          </h1>
          <p className="text-xl md:text-3xl text-gray-200 font-serif italic max-w-2xl mx-auto leading-relaxed">
            "Magical stories of courage and wisdom for young souls."
          </p>
        </div>

        {/* Header - Landscape Mini */}
        <div className="kids-landscape-mini items-center gap-3 mb-6 relative z-20 bg-black/50 backdrop-blur-xl p-4 rounded-3xl border border-white/10 sticky top-2 shadow-2xl">
          <Star className="w-5 h-5 text-devotion-gold fill-devotion-gold" />
          <span className="text-devotion-gold font-black text-xs uppercase tracking-widest">Little Krishna</span>
          <ChevronRight className="w-4 h-4 text-white/30" />
          <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">{videos.length} ADVENTURES</span>
        </div>

        {/* Video Grid */}
        <div className="kids-grid relative max-w-[1920px] mx-auto grid grid-cols-1 landscape:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12 pb-24">
          {videos.map((video, index) => (
            <TeaserCard
              key={video._id || video.id || index}
              video={video}
              index={index}
              isFavorite={isFavorite}
              toggleFavorite={toggleFavorite}
              onSelect={setSelectedVideo}
            />
          ))}
          {videos.length === 0 && (
            <div className="col-span-full bg-white/5 backdrop-blur-3xl p-32 rounded-[4rem] border border-devotion-gold/20 text-center shadow-2xl">
              <Sparkles className="w-20 h-20 text-devotion-gold mx-auto mb-8 opacity-20 animate-pulse" />
              <p className="text-3xl font-serif text-devotion-gold mb-4 italic">The divine flute is playing...</p>
              <p className="text-gray-400 text-lg font-light">Krishna is curating new adventures just for you.</p>
            </div>
          )}
        </div>

        {selectedVideo && (
          <VideoModal
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
          />
        )}
      </div>
    );
}

function VideoModal({ video, onClose, isFavorite, toggleFavorite }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const handleTakeQuiz = () => { onClose(); navigate(video.quizSetId ? `/quiz?setId=${video.quizSetId}` : '/quizzes'); };

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
    <div className="fixed inset-0 z-[100] bg-[#02060B] flex flex-col overflow-y-auto pl-safe pr-safe no-scrollbar">
      <div className="absolute top-0 w-full z-[130] flex items-center justify-between px-6 py-6 pointer-events-none">
         <div className="pointer-events-auto">
            <span className="bg-[#FF8C00] text-white px-5 py-2 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-2xl border border-white/20">LITTLE KRISHNA</span>
         </div>
         <button onClick={onClose} className="tv-focusable pointer-events-auto bg-black/40 backdrop-blur-xl text-white w-14 h-14 tv:w-20 tv:h-20 rounded-[2rem] flex items-center justify-center border border-white/20 hover:bg-red-500/40 transition-all active:scale-90 shadow-2xl">
            <X className="w-7 h-7 tv:w-10 tv:h-10" />
         </button>
      </div>

      <div ref={videoRef} className="relative w-full bg-black flex-shrink-0 z-10 shadow-[0_20px_100px_rgba(0,0,0,1)]">
        <div className="w-full aspect-video">
          <MediaPlayerHLS
            url={video.videoUrl || video.youtubeUrl || video.url}
            hlsUrl={video.hlsUrl}
            title={video.title}
            className="w-full h-full"
            autoPlay={true}
            controls={true}
          />
        </div>
        <button onClick={handleFullscreen} className="tv-focusable absolute bottom-6 right-6 tv:bottom-10 tv:right-10 bg-[#FF8C00] text-white p-5 tv:p-8 rounded-[2.2rem] border-2 border-white/30 hover:scale-110 transition-all z-20 active:scale-95 shadow-[0_15px_40px_rgba(255,140,0,0.4)]">
          <Maximize className="w-7 h-7 tv:w-10 tv:h-10" />
        </button>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none z-0" />
      </div>

      <div className="w-full min-h-screen bg-[#FFFDF5] px-6 py-12 md:p-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none bg-[url('/scene-krishna.svg')] bg-repeat bg-[length:400px_400px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-400/10 rounded-full blur-[120px] -mr-40 -mt-40" />
        
        <div className="max-w-4xl mx-auto relative z-10 space-y-12">
          <div className="border-b-2 border-orange-500/10 pb-12 text-center md:text-left">
            <h2 className="text-5xl md:text-8xl tv:text-[8rem] font-serif font-black text-[#5C2B11] mb-8 drop-shadow-sm tracking-tight leading-[0.9] uppercase">
              {video.title}
            </h2>
            <p className="text-[#6D4224] text-2xl md:text-4xl font-serif italic leading-relaxed opacity-90 max-w-3xl mx-auto md:mx-0 border-l-8 border-[#FF8C00] pl-8">
              {video.description || 'Step into a world of magic and ancient wisdom!'}
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            <button onClick={handleTakeQuiz} className="tv-focusable flex-1 min-w-[280px] bg-gradient-to-br from-[#FF8C00] to-[#FF4500] text-white px-10 py-6 tv:py-10 rounded-[2.5rem] font-black text-lg tv:text-2xl uppercase tracking-[0.2em] flex items-center justify-center gap-5 shadow-[0_25px_50px_rgba(255,140,0,0.4)] hover:scale-[1.03] transition-all active:scale-95">
              <BrainCircuit className="w-10 h-10 tv:w-14 tv:h-14" /> WIN REWARDS!
            </button>
            <button onClick={() => toggleFavorite(video)} className={`tv-focusable flex-1 min-w-[280px] flex items-center justify-center gap-5 px-10 py-6 tv:py-10 rounded-[2.5rem] border-4 font-black text-lg tv:text-2xl uppercase tracking-[0.2em] transition-all hover:scale-[1.03] active:scale-95 ${isFavorite(video) ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500] shadow-xl' : 'border-[#FF8C00]/30 bg-white/80 text-[#C65D00] shadow-lg'}`}>
              <Heart className={`w-10 h-10 tv:w-14 tv:h-14 ${isFavorite(video) ? 'fill-[#FF4500]' : 'fill-none'}`} />
              {isFavorite(video) ? 'SAVED' : 'SAVE STORY'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8">
            {video.moral && (
              <div className="bg-white rounded-[3.5rem] p-12 shadow-[0_30px_70px_rgba(0,0,0,0.08)] border-2 border-orange-500/5 flex flex-col items-center text-center">
                <Star className="w-16 h-16 text-[#FF8C00] fill-[#FF8C00] mb-8 animate-float-krishna" />
                <p className="text-[10px] font-black text-[#8B4513] uppercase tracking-[0.5em] mb-4">Wise Words</p>
                <p className="text-4xl md:text-5xl font-serif font-black italic text-[#5C2B11] leading-[1.1]">{video.moral}</p>
              </div>
            )}

            <div className="bg-white rounded-[3.5rem] p-12 shadow-[0_30px_70px_rgba(0,0,0,0.08)] border-2 border-orange-500/5">
              <div className="flex items-center gap-5 mb-10">
                <div className="w-14 h-14 bg-orange-100 rounded-3xl flex items-center justify-center">
                   <Sparkles className="w-8 h-8 text-[#FF8C00]" />
                </div>
                <span className="text-[11px] font-black text-[#8B4513] uppercase tracking-[0.4em]">Knowledge</span>
              </div>
              <ul className="space-y-6">
                {[
                  video.lesson1 || "Ancient Wisdom",
                  video.lesson2 || 'Life Lessons',
                  video.lesson3 || 'Spiritual Growth',
                ].map((lesson, i) => (
                  <li key={i} className="flex items-center gap-6 group">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
                      {i + 1}
                    </div>
                    <span className="text-xl text-[#6D4224] font-bold leading-tight">{lesson}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {video.script && (
            <div className="pt-24">
              <ReadAlong script={video.script} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadAlong({ script }) {
  const [highlighted, setHighlighted] = useState([]);
  const words = script.split(/(\s+)/);
  const handleWordClick = (idx) => setHighlighted(p => p.includes(idx) ? p.filter(i => i !== idx) : [...p, idx]);
  return (
    <div className="bg-white p-12 md:p-24 rounded-[4rem] border-4 border-orange-500/10 shadow-3xl relative mb-24">
      <div className="absolute -top-8 -left-8 bg-[#FF8C00] p-8 rounded-[2.5rem] rotate-12 shadow-2xl border-8 border-white">
        <BookOpen className="text-white w-12 h-12" />
      </div>
      <h4 className="text-2xl font-black text-[#5C2B11] uppercase mb-12 tracking-[0.4em] text-center">Read & Follow</h4>
      <p className="text-3xl md:text-6xl text-[#5C2B11] font-serif leading-[1.3] italic select-none text-center">
        {words.map((word, idx) => word.trim() ? (
          <span key={idx} className={`cursor-pointer transition-all px-3 py-1 rounded-2xl inline-block ${highlighted.includes(idx) ? 'bg-[#FF8C00] text-white font-black shadow-2xl scale-110 rotate-1' : 'hover:bg-orange-100'}`} onClick={() => handleWordClick(idx)}>{word}</span>
        ) : word)}
      </p>
    </div>
  );
}

function TeaserCard({ video, isFavorite, toggleFavorite, onSelect, index }) {
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

  const handleMouseEnter = () => { setIsHovered(true); if (isDesktop) hoverTimeoutRef.current = setTimeout(() => setShowVideo(true), 800); };
  const handleMouseLeave = () => { setIsHovered(false); setShowVideo(false); clearTimeout(hoverTimeoutRef.current); };

  const ytId = ((url) => { 
    if (!url) return null;
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/); 
    return match ? match[1] : null; 
  })(video.videoUrl || video.youtubeUrl || video.url || '');
  
  const thumbUrl = video.thumbnail || video.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '/krishna-line-art.svg');

  return (
    <div
      tabIndex={0}
      className="relative cursor-pointer group rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5
                 h-[480px] sm:h-[540px] md:h-[620px] tv:h-[750px]
                 transition-all duration-300 ease-out preserve-3d tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold"
      onClick={() => onSelect(video)}
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
    >
      <div className="absolute inset-0 bg-black">
        <img src={thumbUrl} alt={video.title} className={`w-full h-full object-cover opacity-80 transition-transform duration-[2s] ease-out ${isHovered ? 'scale-110' : 'scale-100'}`} />
        {showVideo && ytId && (
          <div className="absolute inset-0 z-10 bg-black animate-fade-in duration-1000">
            <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${ytId}`} className="w-full h-[140%] -translate-y-[15%] object-cover pointer-events-none opacity-80" frameBorder="0" title="Teaser" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020610] via-transparent to-transparent z-20 group-hover:from-[#020610]/90 transition-all duration-500"></div>
      </div>

      <div className="absolute top-8 left-8 right-8 z-30 flex justify-between items-center">
        {index < 2 && <span className="bg-[#FF8C00] text-white text-[10px] tv:text-sm font-black uppercase tracking-widest px-4 py-2 tv:px-6 tv:py-3 rounded-2xl shadow-2xl">New Adventure</span>}
        <button className={`tv-focusable w-12 h-12 tv:w-16 tv:h-16 rounded-[1.2rem] tv:rounded-3xl backdrop-blur-3xl transition-all active:scale-90 flex items-center justify-center ${isFavorite(video) ? 'bg-red-500 text-white shadow-2xl' : 'bg-black/40 text-white border border-white/20'}`} onClick={e => { e.stopPropagation(); toggleFavorite(video); }}>
          <Heart className={`w-6 h-6 tv:w-8 tv:h-8 ${isFavorite(video) ? 'fill-white' : 'fill-none'}`} />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-10 z-30 flex flex-col items-center text-center">
        <div className={`w-20 h-20 bg-white/10 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center border border-white/20 mb-8 transition-all duration-700 ${isHovered ? 'bg-[#FF8C00] text-white border-[#FF8C00] scale-110 rotate-[15deg] shadow-[0_0_60px_rgba(255,140,0,0.5)]' : 'text-[#FF8C00]'}`}>
           <Play className="w-10 h-10 ml-1.5 fill-current" />
        </div>
        
        <h3 className="text-3xl md:text-5xl font-serif font-black text-white mb-4 leading-none tracking-tighter uppercase drop-shadow-2xl" style={{ transform: 'translateZ(50px)' }}>
          {video.title}
        </h3>
        
        <p className="text-gray-300 font-serif italic text-lg mb-10 line-clamp-2 opacity-0 group-hover:opacity-90 transition-all duration-700 translate-y-8 group-hover:translate-y-0">
          {video.description || "A magical journey awaits!"}
        </p>

        <button className={`w-full py-5 tv:py-8 rounded-[2rem] font-black text-xs tv:text-lg uppercase tracking-[0.3em] transition-all duration-500 ${isHovered ? 'bg-white text-black shadow-3xl scale-105' : 'bg-[#FF8C00]/20 text-[#FF8C00] border-2 border-[#FF8C00]/40 backdrop-blur-md'}`}>
          LET'S GO!
        </button>
      </div>
    </div>
  );
}
