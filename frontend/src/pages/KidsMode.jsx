import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Star, Sparkles, BrainCircuit, Heart, Search, Mic, Settings, Lock, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import MediaPlayerHLS from '../components/MediaPlayerHLS';

export default function KidsMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get('/api/videos/kids'),
      axios.get('/api/movies')
    ])
      .then(([videosRes, moviesRes]) => {
        const kidsVideos = Array.isArray(videosRes.data) ? videosRes.data : [];
        const kidsMovies = Array.isArray(moviesRes.data) ? moviesRes.data.filter(m => m.isKids) : [];
        setVideos([...kidsVideos, ...kidsMovies]);
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  const heroVideos = videos.slice(0, 4);

  useEffect(() => {
    if (heroVideos.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroVideos.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroVideos.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FF9A9E] to-[#FECFEF]">
        <div className="animate-spin rounded-full h-20 w-20 border-t-8 border-white border-dashed"></div>
      </div>
    );
  }

  const categories = [
    { title: 'Magical Tales', color: 'from-[#FF6B6B] to-[#FF8E8B]' },
    { title: 'Learn & Grow', color: 'from-[#4FACFE] to-[#00F2FE]', icon: <BrainCircuit className="w-6 h-6 text-white" /> },
    { title: 'Sing Along', color: 'from-[#FA709A] to-[#FEE140]' },
    { title: 'Bedtime Stories', color: 'from-[#667EEA] to-[#764BA2]', icon: <Star className="w-6 h-6 text-white" /> },
  ];

  const featuredVideo = heroVideos[heroIndex];
  const extractYoutubeId = (url) => { if (!url) return null; const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/); return match ? match[1] : null; };
  const featuredYtId = featuredVideo ? extractYoutubeId(featuredVideo.videoUrl || featuredVideo.youtubeUrl || featuredVideo.url || '') : null;
  const featuredThumbUrl = featuredVideo ? (featuredVideo.thumbnail || featuredVideo.thumbnailUrl || (featuredYtId ? `https://img.youtube.com/vi/${featuredYtId}/maxresdefault.jpg` : '/scene-krishna.svg')) : '';

  return (
    <div className="min-h-[100dvh] bg-[#F2F7FF] text-[#2D3748] overflow-x-hidden font-['Nunito',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .kids-nav { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .bubbly-button { transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .bubbly-button:hover { transform: scale(1.1) rotate(-3deg); }
        .bubbly-button:active { transform: scale(0.9); }
        .cloud-bg { background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="%23ffffff" opacity="0.4"/></svg>'); }
        .card-3d { transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s ease; transform-style: preserve-3d; }
        .card-3d:hover { transform: perspective(1200px) rotateX(8deg) rotateY(-8deg) scale(1.05); box-shadow: -20px 30px 50px rgba(0,0,0,0.25); z-index: 50; }
        .card-3d-inner { transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1); }
        .card-3d:hover .card-3d-inner { transform: translateZ(40px); }
      `}</style>

      {/* Playful Kids Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'kids-nav py-3' : 'bg-transparent py-6'} px-6 md:px-12 flex items-center justify-between`}>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/home')} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center bubbly-button text-[#FF6B6B]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] via-[#FA709A] to-[#667EEA] drop-shadow-sm flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-[#FEE140]" /> KidsZone
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-white rounded-full px-5 py-3 shadow-[0_5px_15px_rgba(0,0,0,0.08)] border-4 border-[#F2F7FF] focus-within:border-[#4FACFE] transition-all">
            <Search className="w-5 h-5 text-[#A0AEC0]" />
            <input type="text" placeholder="Find cartoons..." className="bg-transparent border-none outline-none font-bold px-3 w-48 text-[#2D3748] placeholder-[#A0AEC0]" />
            <button className="w-8 h-8 bg-[#4FACFE] rounded-full flex items-center justify-center bubbly-button">
              <Mic className="w-4 h-4 text-white" />
            </button>
          </div>
          
          <button className="w-14 h-14 bg-gradient-to-r from-[#667EEA] to-[#764BA2] rounded-full shadow-[0_8px_20px_rgba(102,126,234,0.4)] flex items-center justify-center bubbly-button text-white border-4 border-white">
            <Lock className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Cartoon Cinematic Hero */}
      {featuredVideo && (
        <div className="relative w-full h-[75vh] md:h-[85vh] flex items-end pb-24 md:pb-32 px-6 md:px-16 pt-32">
          <div className="absolute inset-4 md:inset-8 z-0 rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-8 border-white bg-[#0F1014]">
            {featuredVideo.trailerUrl ? (
              <div className="w-full h-full relative">
                <MediaPlayerHLS
                  url={featuredVideo.trailerUrl}
                  className="w-full h-full object-cover scale-105"
                  autoPlay={true}
                  muted={isMuted}
                  loop={true}
                  controls={false}
                  instagramMode={true}
                />
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute bottom-8 right-8 z-20 w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white transition-all text-white hover:text-black border-2 border-white"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
              </div>
            ) : (
              <img src={featuredThumbUrl} alt={featuredVideo.title} className="w-full h-full object-cover opacity-90" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2D3748] via-transparent to-transparent opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2D3748] via-[#2D3748]/60 to-transparent w-[70%] opacity-90" />
          </div>

          <div className="relative z-10 w-full max-w-4xl space-y-6 md:ml-12 mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white text-[#FF6B6B] font-black text-sm uppercase tracking-widest shadow-[0_10px_20px_rgba(255,107,107,0.3)] animate-bounce border-2 border-[#FF6B6B]/20">
              <Star className="w-5 h-5 fill-[#FEE140] text-[#FEE140]" /> 
              Featured Adventure
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-black leading-[0.9] text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
              {featuredVideo.title}
            </h1>
            
            <p className="text-lg md:text-2xl text-white line-clamp-2 max-w-2xl font-bold drop-shadow-md">
              {featuredVideo.description || 'Join the magical journey and learn amazing new things today!'}
            </p>

            <div className="flex items-center gap-5 pt-4">
              <button 
                onClick={() => setSelectedVideo(featuredVideo)}
                className="flex items-center gap-4 bg-gradient-to-r from-[#FEE140] to-[#FA709A] text-white px-10 py-5 rounded-full font-black text-xl tv:text-2xl bubbly-button shadow-[0_15px_30px_rgba(250,112,154,0.4)] border-4 border-white"
              >
                <Play className="w-8 h-8 fill-current" /> WATCH NOW!
              </button>
              <button 
                className="flex items-center gap-3 bg-white text-[#4FACFE] px-8 py-5 rounded-full font-black text-xl tv:text-2xl bubbly-button shadow-xl border-4 border-[#4FACFE]/20"
              >
                <Heart className="w-8 h-8 fill-current" /> Save
              </button>
            </div>
          </div>

          <div className="absolute bottom-16 right-20 flex gap-3 z-20">
            {heroVideos.map((_, i) => (
              <div key={i} className={`h-3 rounded-full transition-all duration-500 ${i === heroIndex ? 'w-10 bg-[#FEE140] shadow-[0_0_15px_rgba(254,225,64,0.8)]' : 'w-3 bg-white/50'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Colorful Category Rows */}
      <div className="relative z-10 pb-32">
        {categories.map((cat, index) => (
          <KidsRow 
            key={cat.title} 
            category={cat} 
            videos={videos} 
            onSelect={setSelectedVideo} 
            index={index}
          />
        ))}

        {videos.length === 0 && (
          <div className="text-center py-20 bg-white/50 rounded-[3rem] mx-6 border-4 border-dashed border-[#FF9A9E]">
            <Sparkles className="w-20 h-20 text-[#FF9A9E] mx-auto mb-6 animate-pulse" />
            <p className="text-3xl font-black text-[#FF6B6B]">Loading magical stories...</p>
          </div>
        )}
      </div>

      {/* Disney-style Video Modal */}
      {selectedVideo && (
        <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} navigate={navigate} />
      )}
    </div>
  );
}

function KidsRow({ category, videos, onSelect }) {
  const scrollRef = useRef(null);
  const rowVideos = [...videos].sort(() => 0.5 - Math.random());

  return (
    <div className="mb-16">
      <div className="px-6 md:px-16 mb-6 flex items-center justify-between">
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r ${category.color} text-white shadow-lg`}>
          {category.icon || <Sparkles className="w-6 h-6" />}
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider">
            {category.title}
          </h2>
        </div>
      </div>
      
      <div className="relative group/row">
        <div ref={scrollRef} className="flex overflow-x-auto hide-scrollbar px-6 md:px-16 gap-6 py-6 snap-x snap-mandatory">
          {rowVideos.map((video) => (
            <div key={video._id || video.id} className="snap-start shrink-0">
              <KidsCard video={video} onSelect={onSelect} colorClass={category.color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KidsCard({ video, onSelect, colorClass }) {
  const [isHovered, setIsHovered] = useState(false);
  const extractYoutubeId = (url) => { if (!url) return null; const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/); return match ? match[1] : null; };
  const ytId = extractYoutubeId(video.videoUrl || video.youtubeUrl || video.url || '');
  const thumbUrl = video.thumbnail || video.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '/krishna-line-art.svg');

  return (
    <div
      className={`relative w-[340px] h-[400px] md:w-[420px] md:h-[480px] rounded-[2.5rem] overflow-hidden cursor-pointer bg-white shadow-[0_15px_35px_rgba(0,0,0,0.08)] border-4 border-transparent hover:border-white card-3d group`}
      onClick={() => onSelect(video)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-0 inset-x-0 h-[60%] rounded-b-[2rem] overflow-hidden bg-black card-3d-inner">
        {isHovered && (video.trailerUrl || video.videoUrl || video.youtubeUrl || video.url) ? (
          <div className="w-full h-full scale-110">
            <MediaPlayerHLS
              url={video.trailerUrl || video.videoUrl || video.youtubeUrl || video.url}
              className="w-full h-full object-cover pointer-events-none"
              autoPlay={true}
              muted={true}
              controls={false}
              loop={true}
              instagramMode={true}
            />
          </div>
        ) : (
          <img src={thumbUrl} alt={video.title} className="w-full h-full object-cover" />
        )}
        <div className={`absolute top-4 left-4 z-20 px-4 py-1.5 bg-gradient-to-r ${colorClass} text-white font-black text-[11px] rounded-full uppercase tracking-widest shadow-md border-2 border-white`}>
          {video.duration ? `${video.duration} MINS` : 'SHORT'}
        </div>
        {video.isComingSoon && (
          <div className="absolute top-4 right-4 z-20 px-4 py-1.5 bg-devotion-gold text-black font-black text-[11px] rounded-full uppercase tracking-widest shadow-lg border-2 border-white">
            COMING SOON
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
            <Play className="w-10 h-10 text-[#FF6B6B] ml-1 fill-current" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-[40%] p-6 md:p-8 flex flex-col justify-center items-center text-center bg-white z-30">
        <h3 className="font-black text-2xl md:text-3xl text-[#2D3748] line-clamp-2 leading-tight mb-3 group-hover:text-[#FF6B6B] transition-colors">{video.title}</h3>
        <p className="text-sm md:text-base font-bold text-[#A0AEC0] uppercase tracking-widest bg-[#F2F7FF] px-5 py-1.5 rounded-full mb-3">
          {video.category || 'Cartoon'}
        </p>
        <span className="text-[#FF6B6B] font-black text-xs uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {video.isComingSoon ? 'TRAILER / TEASER' : 'PLAY PREVIEW'}
        </span>
      </div>
    </div>
  );
}

function VideoModal({ video, onClose, navigate }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#0F1014]/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-white rounded-[3rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] z-10 flex flex-col max-h-[95vh] border-8 border-white">
        
        <button onClick={onClose} className="absolute top-6 right-6 z-50 w-12 h-12 bg-[#FF6B6B] rounded-full flex items-center justify-center bubbly-button text-white shadow-xl border-4 border-white">
          <X className="w-6 h-6" />
        </button>

        <div className="w-full aspect-video bg-black rounded-b-[2rem] overflow-hidden shadow-xl relative z-20">
          <MediaPlayerHLS
            url={video.videoUrl || video.youtubeUrl || video.url}
            title={video.title}
            className="w-full h-full"
            autoPlay={true}
            controls={true}
          />
        </div>

        <div className="p-8 md:p-10 overflow-y-auto hide-scrollbar bg-gradient-to-br from-[#F2F7FF] to-[#E2E8F0]">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#4FACFE] text-white px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest shadow-md">
                <Star className="w-4 h-4 fill-current" /> Universal Kids
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#2D3748] leading-tight">{video.title}</h2>
              <p className="text-lg text-[#718096] font-bold leading-relaxed">
                {video.description || 'Enjoy this fantastic educational and magical journey prepared just for you!'}
              </p>
            </div>
            
            <div className="w-full md:w-auto flex flex-col gap-4">
              <button 
                onClick={() => { onClose(); navigate(video.quizSetId ? `/quiz?setId=${video.quizSetId}` : '/quizzes'); }} 
                className="bg-gradient-to-r from-[#FEE140] to-[#FA709A] text-white px-8 py-5 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-[0_10px_20px_rgba(250,112,154,0.4)] bubbly-button flex items-center justify-center gap-3 border-4 border-white"
              >
                <BrainCircuit className="w-6 h-6" /> Play Quiz!
              </button>
              <button className="bg-white text-[#667EEA] px-8 py-5 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-lg bubbly-button flex items-center justify-center gap-3 border-4 border-[#667EEA]/20">
                <Heart className="w-6 h-6 fill-current" /> Save for later
              </button>
            </div>
          </div>
          
          {video.moral && (
            <div className="mt-10 bg-white rounded-[2rem] p-8 shadow-md border-2 border-[#FEE140]/30 text-center">
              <h3 className="text-xl font-black text-[#FA709A] uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6" /> Lesson of the day
              </h3>
              <p className="text-2xl font-bold text-[#2D3748]">{video.moral}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}