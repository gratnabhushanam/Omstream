import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Star, BookOpen, X, Sparkles, Heart, BrainCircuit, ChevronRight, ChevronLeft, Info } from 'lucide-react';
import MediaPlayerHLS from '../components/MediaPlayerHLS';

export default function KidsMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [featuredVideo, setFeaturedVideo] = useState(null);

  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kidsFavorites') || '[]'); }
    catch { return []; }
  });

  const isFavorite = (video) => favorites.includes(video._id || video.id);
  const toggleFavorite = (video) => {
    const id = video._id || video.id;
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem('kidsFavorites', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    setLoading(true);
    axios.get('/api/videos/kids')
      .then((res) => {
        const fetched = Array.isArray(res.data) ? res.data : [];
        setVideos(fetched);
        if (fetched.length > 0) setFeaturedVideo(fetched[0]);
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020610]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#FF8C00]"></div>
      </div>
    );
  }

  const rows = {};
  videos.forEach((video) => {
    const categories = video.tags && video.tags.length > 0 ? video.tags : ['Magical Tales'];
    categories.forEach((cat) => {
      const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
      if (!rows[catName]) rows[catName] = [];
      if (!rows[catName].find((item) => item._id === video._id)) rows[catName].push(video);
    });
  });

  if (Object.keys(rows).length === 0 && videos.length > 0) {
    rows['All Adventures'] = [...videos];
  }

  const extractYoutubeId = (url) => {
    if (!url) return null;
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return match ? match[1] : null;
  };

  const featuredYtId = featuredVideo ? extractYoutubeId(featuredVideo.videoUrl || featuredVideo.youtubeUrl || featuredVideo.url || '') : null;
  const featuredThumbUrl = featuredVideo ? (featuredVideo.thumbnail || featuredVideo.thumbnailUrl || (featuredYtId ? `https://img.youtube.com/vi/${featuredYtId}/maxresdefault.jpg` : '/scene-krishna.svg')) : '';

  return (
    <div className="min-h-[100dvh] bg-[#020610] text-white overflow-y-auto overflow-x-hidden relative pl-safe pr-safe">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes float-krishna { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        .animate-float-krishna { animation: float-krishna 6s ease-in-out infinite; }
        @keyframes sparkle { 0%,100%{opacity:.2} 50%{opacity:.4} }
        .animate-sparkle { animation: sparkle 3s ease-in-out infinite; }
        @keyframes subtle-zoom { 0% { transform: scale(1); } 100% { transform: scale(1.05); } }
        .animate-subtle-zoom { animation: subtle-zoom 20s infinite alternate ease-in-out; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_top_right,rgba(255,180,0,0.12),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(0,100,200,0.25),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 z-10 animate-sparkle bg-[url('/sparkles.svg')] opacity-20" />

      {featuredVideo && (
        <div className="relative w-full h-[70vh] md:h-[85vh] tv:h-[90vh] flex items-end pb-24 md:pb-32 px-4 sm:px-6 lg:px-12 tv:px-20 pt-20">
          <div className="absolute inset-0 z-0 bg-[#020610] overflow-hidden">
            {featuredVideo.trailerUrl ? (
              <MediaPlayerHLS
                url={featuredVideo.trailerUrl}
                title={featuredVideo.title}
                className="w-full h-full object-cover opacity-70 transform-gpu"
                autoPlay={true}
                muted={true}
                loop={true}
                controls={false}
                instagramMode={true}
              />
            ) : (
              <img
                src={featuredThumbUrl}
                alt={featuredVideo.title}
                className="w-full h-full object-cover opacity-70 animate-subtle-zoom"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020610] via-[#020610]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020610] via-[#020610]/40 to-transparent w-[70%]" />
          </div>

          <div className="relative z-10 max-w-3xl tv:max-w-5xl space-y-4 md:space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-devotion-gold/30 bg-devotion-gold/20 text-devotion-gold text-[10px] font-black tracking-[0.4em] uppercase shadow-2xl">
              <Sparkles className="w-4 h-4 animate-spin-slow" /> Little Krishna
            </div>

            <h1 className="text-5xl md:text-7xl tv:text-[8rem] font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-white to-[#FFD700] leading-[0.9] drop-shadow-[0_10px_40px_rgba(255,215,0,0.4)] uppercase tracking-tighter">
              {featuredVideo.title}
            </h1>

            <p className="text-sm md:text-lg tv:text-2xl text-gray-200 line-clamp-3 md:line-clamp-4 font-serif italic max-w-2xl drop-shadow-lg leading-relaxed">
              {featuredVideo.description || 'Step into a world of magic and ancient wisdom!'}
            </p>

            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={() => setSelectedVideo(featuredVideo)}
                tabIndex={0}
                className="tv-focusable focus:outline-none focus:ring-4 focus:ring-[#FF8C00] flex items-center justify-center gap-3 bg-gradient-to-r from-[#FF8C00] to-[#FF4500] text-white px-6 py-3 md:px-8 md:py-4 tv:px-12 tv:py-5 rounded-xl font-black text-sm md:text-base tv:text-xl uppercase tracking-widest hover:scale-105 transition-all shadow-[0_15px_30px_rgba(255,140,0,0.4)] active:scale-95"
              >
                <Play className="w-5 h-5 tv:w-7 tv:h-7 fill-current" /> Play Now
              </button>
              <button
                onClick={() => setSelectedVideo(featuredVideo)}
                tabIndex={0}
                className="tv-focusable focus:outline-none focus:ring-4 focus:ring-[#FF8C00] flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md border-2 border-[#FF8C00]/50 text-white px-6 py-3 md:px-8 md:py-4 tv:px-12 tv:py-5 rounded-xl font-black text-sm md:text-base tv:text-xl uppercase tracking-widest hover:bg-white/20 transition-all shadow-2xl active:scale-95"
              >
                <Info className="w-5 h-5 tv:w-7 tv:h-7" /> More Info
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 pb-32 -mt-10 md:-mt-20 tv:-mt-32">
        {Object.entries(rows).map(([category, categoryVideos], index) => (
          <VideoRow
            key={category}
            title={category}
            videos={categoryVideos}
            onSelect={setSelectedVideo}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
            index={index}
          />
        ))}

        {videos.length === 0 && (
          <div className="bg-white/5 backdrop-blur-3xl p-20 rounded-[4rem] border border-devotion-gold/20 text-center shadow-2xl mx-4 md:mx-12 mt-12">
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
          navigate={navigate}
        />
      )}
    </div>
  );
}

function VideoRow({ title, videos, onSelect, isFavorite, toggleFavorite, index }) {
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
        <h2 className="text-xl md:text-2xl tv:text-4xl font-bold text-white capitalize flex items-center gap-2 transition-colors group-hover:text-[#FF8C00]">
          {title} <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0" />
        </h2>
      </div>

      <div className="relative group/row">
        <button onClick={() => scroll('left')} className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 w-16 bg-gradient-to-r from-[#020610] to-transparent items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:from-[#020610]/90">
          <ChevronLeft className="w-10 h-10 text-white hover:scale-125 transition-transform" />
        </button>
        <button onClick={() => scroll('right')} className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 w-16 bg-gradient-to-l from-[#020610] to-transparent items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:from-[#020610]/90">
          <ChevronRight className="w-10 h-10 text-white hover:scale-125 transition-transform" />
        </button>

        <div ref={scrollRef} className="flex overflow-x-auto overflow-y-visible hide-scrollbar px-4 md:px-12 tv:px-20 gap-4 tv:gap-6 py-6 snap-x snap-mandatory">
          {videos.map((video) => (
            <div key={video._id || video.id} className="snap-start shrink-0">
              <RowTeaserCard video={video} onSelect={onSelect} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RowTeaserCard({ video, onSelect, isFavorite, toggleFavorite }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => { setIsHovered(true); };
  const handleMouseLeave = () => { setIsHovered(false); };

  const ytId = ((url) => { if (!url) return null; const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/); return match ? match[1] : null; })(video.videoUrl || video.youtubeUrl || video.url || '');
  const thumbUrl = video.thumbnail || video.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '/krishna-line-art.svg');

  return (
    <div
      tabIndex={0}
      className={`relative cursor-pointer group rounded-2xl md:rounded-3xl tv:rounded-[2.5rem] overflow-hidden shadow-xl border border-white/5 bg-[#0A1220]
                 w-[280px] h-[160px] md:w-[320px] md:h-[180px] tv:w-[480px] tv:h-[270px]
                 transition-all duration-700 ease-out tv-focusable focus:outline-none focus:ring-4 focus:ring-[#FF8C00] z-10 hover:z-30 hover:scale-[1.09] hover:shadow-[0_28px_70px_rgba(255,140,0,0.35)] origin-center transform-gpu perspective-[1400px] hover:[transform:translateY(-2px)_rotateX(6deg)_rotateY(-8deg)_scale(1.09)]`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(video)}
    >
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 scale-110 translate-y-4 opacity-45 blur-xl bg-black">
          <img src={thumbUrl} alt="" aria-hidden="true" className="w-full h-full object-cover" />
        </div>
        <img src={thumbUrl} alt={video.title} loading="lazy" className="relative z-10 w-full h-full object-cover opacity-88 transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020610] via-[#020610]/35 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020610]/70 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#020610] to-transparent z-10" />
      </div>

      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-[0.25em] text-white">
          {video.trailerUrl ? 'Teaser' : 'Episode'}
        </span>
        <span className="px-3 py-1 rounded-full bg-[#FF8C00]/18 backdrop-blur-md border border-[#FF8C00]/25 text-[9px] font-black uppercase tracking-[0.25em] text-[#FFD700]">
          Kids
        </span>
      </div>

      <button
        className={`absolute top-3 right-3 tv:top-5 tv:right-5 z-40 w-8 h-8 tv:w-12 tv:h-12 rounded-full backdrop-blur-md transition-all flex items-center justify-center ${isFavorite(video) ? 'bg-red-500 text-white shadow-xl' : 'bg-black/40 text-white border border-white/20 hover:bg-white/20'}`}
        onClick={(e) => { e.stopPropagation(); toggleFavorite(video); }}
      >
        <Heart className={`w-4 h-4 tv:w-6 tv:h-6 ${isFavorite(video) ? 'fill-white' : 'fill-none'}`} />
      </button>

      <div className={`absolute inset-0 p-4 md:p-6 z-20 flex flex-col justify-end transition-all duration-700 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        <div className="absolute inset-x-4 bottom-4 h-[42%] rounded-[1.5rem] bg-black/35 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.45)]" />
        <div className="relative z-10 flex items-center gap-3 mb-3">
          <button className="w-9 h-9 md:w-11 md:h-11 bg-[#FF8C00] rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(255,140,0,0.35)] transition-all duration-500 group-hover:scale-110 group-hover:brightness-110" onClick={(e) => { e.stopPropagation(); onSelect(video); }}>
            <Play className="w-4 h-4 md:w-5 md:h-5 ml-1 text-white fill-current" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-black text-white line-clamp-1 tracking-tight">{video.title}</h3>
            <p className="text-[10px] md:text-xs text-gray-200 mt-1 line-clamp-1">{video.trailerUrl ? 'Watch teaser clip' : 'Fun family short'}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onSelect(video); }} className="ml-2 px-3 py-2 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md transition-all duration-500 hover:bg-white/20 hover:scale-105">
            More Info
          </button>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2 text-[10px] md:text-xs text-gray-300 font-bold uppercase tracking-wider">
          <span className="text-[#FFD700] font-black">Magical!</span>
          <span className="bg-white/10 px-2 py-1 rounded-full border border-white/10 text-white">{video.category || 'Kids'}</span>
          <span className="bg-white/10 px-2 py-1 rounded-full border border-white/10 text-white">{video.duration ? `${video.duration}m` : 'Short'}</span>
          <span className="bg-[#FF8C00]/18 px-2 py-1 rounded-full border border-[#FF8C00]/25 text-[#FFD700]">{video.ageRating || 'U'}</span>
        </div>
      </div>
    </div>
  );
}

function VideoModal({ video, onClose, isFavorite, toggleFavorite, navigate }) {
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
    <div className="fixed inset-0 z-[100] bg-[#02060B] flex flex-col overflow-y-auto pl-safe pr-safe no-scrollbar animate-in fade-in zoom-in duration-300">
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
                  video.lesson1 || 'Ancient Wisdom',
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

  const handleWordClick = (idx) => {
    setHighlighted((prev) => (prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]));
  };

  return (
    <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-orange-500/10">
      <div className="flex items-center gap-4 mb-6">
        <BookOpen className="w-8 h-8 text-[#FF8C00]" />
        <h3 className="text-2xl font-black text-[#5C2B11] uppercase tracking-widest">Read Along</h3>
      </div>
      <p className="text-[#6D4224] text-lg md:text-2xl leading-relaxed font-serif">
        {words.map((word, idx) => (
          <span
            key={idx}
            onClick={() => handleWordClick(idx)}
            className={`cursor-pointer transition-colors ${highlighted.includes(idx) ? 'bg-yellow-200 text-[#5C2B11]' : ''}`}
          >
            {word}
          </span>
        ))}
      </p>
    </div>
  );
}