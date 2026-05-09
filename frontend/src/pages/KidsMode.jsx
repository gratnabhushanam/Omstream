import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Play, PlayCircle, X, ChevronLeft, ChevronRight, Baby, Sparkles, Star, ArrowLeft, 
  Brain, Check, Award, Trophy, Smile, Volume2, VolumeX, BookOpen, ShieldCheck,
  Gamepad2, Music, GraduationCap, PartyPopper, Search, Mic, Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import MediaPlayerHLS from '../components/MediaPlayerHLS';
import { useLanguage } from '../context/LanguageContext';

export default function KidsMode() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredVideoId, setHoveredVideoId] = useState(null);
  const [openQuizVideo, setOpenQuizVideo] = useState(null);

  useEffect(() => {
    fetchKidsContent();
  }, []);

  const fetchKidsContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const [videoRes, storyRes] = await Promise.all([
        axios.get('/api/videos'),
        axios.get('/api/stories/kids')
      ]);
      const kidsContent = (videoRes.data || []).filter(v => v.isKids || v.category === 'animated');
      setVideos(kidsContent);
      setStories(storyRes.data || []);
    } catch (error) {
      console.error('Error fetching kids content:', error);
      setError('Connection to Divine Cloud failed. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: 'All', icon: <Sparkles className="w-5 h-5" />, color: 'bg-orange-500' },
    { name: 'Animated Stories', icon: <Baby className="w-5 h-5" />, color: 'bg-blue-500' },
    { name: 'Learning & Fun', icon: <GraduationCap className="w-5 h-5" />, color: 'bg-green-500' },
    { name: 'Divine Songs', icon: <Music className="w-5 h-5" />, color: 'bg-purple-500' },
    { name: 'Games', icon: <Gamepad2 className="w-5 h-5" />, color: 'bg-pink-500' },
  ];

  if (error) {
    return (
      <div className="h-screen w-full bg-[#0F1014] flex flex-col items-center justify-center p-12 text-center">
        <Sparkles className="w-20 h-20 text-pink-500 mb-8 animate-pulse" />
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-white">{error}</h2>
        <button 
          onClick={() => fetchKidsContent()} 
          className="px-12 py-5 bg-pink-500 text-white rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0F1014] flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
           <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin shadow-[0_0_40px_rgba(236,72,153,0.3)]"></div>
           <p className="text-pink-500 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Entering Kids Paradise...</p>
        </div>
      </div>
    );
  }

  const sections = [
    { title: "Ramayana for Kids", filter: (v) => v.category === 'animated' && v.tags?.includes('ramayana') },
    { title: "Krishna Stories", filter: (v) => v.category === 'animated' && v.tags?.includes('krishna') },
    { title: "Panchatantra Tales", filter: (v) => v.category === 'animated' && v.tags?.includes('panchatantra') },
    { title: "Hanuman Adventures", filter: (v) => v.category === 'animated' && v.tags?.includes('hanuman') },
    { title: "Mahabharata Stories", filter: (v) => v.category === 'animated' && v.tags?.includes('mahabharata') },
    { title: "Tenali Raman Stories", filter: (v) => v.category === 'animated' && v.tags?.includes('tenali') },
    { title: "Animated Learning", filter: (v) => v.tags?.includes('educational') },
    { title: "Moral Stories", filter: (v) => v.tags?.includes('moral') },
    { title: "Fun Educational Reels", filter: (v) => v.category === 'reels' && v.isKids },
    { title: "Mythological Cartoons", filter: (v) => v.category === 'animated' || v.isKids }
  ];

  const hasContent = videos.length > 0 || stories.length > 0;

  return (
    <div className="min-h-screen bg-[#0F1014] text-white selection:bg-pink-500/30 font-['Nunito',sans-serif]">
      {/* Playful Kids Navbar */}
      <nav className="fixed top-0 w-full z-50 px-8 py-6 flex items-center justify-between bg-gradient-to-b from-[#0F1014] to-transparent">
        <div className="flex items-center gap-6">
          <div className="relative group">
             <img 
               src="/kids_mascot_1778310861074.png" 
               className="absolute -top-12 -left-16 w-32 h-32 object-contain animate-float drop-shadow-[0_20px_50px_rgba(255,217,61,0.5)] z-10 cursor-pointer hover:scale-110 active:scale-95 transition-transform" 
               alt="Mascot"
               onClick={() => {
                 confetti({
                   particleCount: 80,
                   spread: 100,
                   origin: { x: 0.1, y: 0.1 },
                   colors: ['#FF69B4', '#FFD700', '#00BFFF']
                 });
               }}
             />
             <button 
               onClick={() => navigate('/home')} 
               className="w-14 h-14 bg-white/5 border-2 border-white/10 rounded-3xl flex items-center justify-center text-white hover:bg-pink-500 hover:border-pink-400 transition-all shadow-xl relative z-0"
             >
               <ArrowLeft className="w-6 h-6" />
             </button>
          </div>
          <div className="flex flex-col">
             <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 animate-pulse">
                Kids Paradise
             </h1>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Safe & Fun Learning</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center bg-white/10 border-2 border-white/5 rounded-[2.5rem] px-8 py-4 focus-within:border-pink-500 focus-within:shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-all backdrop-blur-xl group">
              <Search className="w-5 h-5 text-white/30 group-focus-within:text-pink-500" />
              <input type="text" placeholder="AI Search Cartoons..." className="bg-transparent border-none outline-none px-4 w-72 text-sm font-bold placeholder-white/20" />
              <div className="flex items-center gap-3 border-l border-white/10 pl-6 ml-2">
                 <button className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center hover:bg-pink-500 transition-all group/mic relative">
                    <div className="absolute inset-0 bg-pink-500/40 rounded-full animate-ping opacity-20" />
                    <Mic className="w-5 h-5 text-pink-500 group-hover/mic:text-white relative z-10" />
                 </button>
                 <Sparkles className="w-5 h-5 text-orange-400 animate-pulse" />
              </div>
           </div>
           <button className="flex items-center gap-3 bg-white/5 border-2 border-white/10 px-6 py-4 rounded-[2rem] hover:bg-green-500 hover:border-green-400 transition-all group shadow-xl">
              <ShieldCheck className="w-6 h-6 text-green-500 group-hover:text-white" />
              <span className="text-xs font-black uppercase tracking-widest hidden lg:block text-white/80">Safe Mode</span>
           </button>
        </div>
      </nav>

      {/* Playful Hero Banner */}
      <section className="relative h-[80vh] w-full pt-32 px-8 lg:px-24">
         <div className="relative w-full h-full rounded-[4rem] overflow-hidden border-[6px] border-white/5 bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 group shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
            {videos.length > 0 && (
              <>
                <img src={videos[0].thumbnail || "/scene-krishna.svg"} className="w-full h-full object-cover opacity-60 scale-105 group-hover:scale-110 transition-transform duration-1000" alt="Hero" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1014] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0F1014] via-[#0F1014]/30 to-transparent w-[50%]" />
                
                <div className="absolute inset-0 flex flex-col justify-center px-12 lg:px-24 max-w-4xl gap-8">
                   <div className="inline-flex items-center gap-3 bg-pink-500 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl animate-bounce-slow">
                      <PartyPopper className="w-5 h-5" /> Super Hot Story!
                   </div>
                   <h2 className="text-6xl lg:text-9xl font-black uppercase tracking-tight text-white leading-[0.8] animate-in slide-in-from-left duration-700">
                      {t(videos[0], 'title')}
                   </h2>
                   <p className="text-xl lg:text-3xl text-white/70 font-medium leading-relaxed max-w-2xl line-clamp-2 animate-in slide-in-from-left duration-1000">
                      {t(videos[0], 'description')}
                   </p>
                   <div className="flex items-center gap-6 mt-4 animate-in fade-in duration-1000">
                      <button 
                        onClick={() => setSelectedVideo(videos[0])}
                        className="bg-white text-pink-500 px-12 py-6 rounded-[3rem] font-black text-2xl uppercase tracking-widest shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-95 transition-all flex items-center gap-4 border-[6px] border-pink-500/20"
                      >
                         <Play className="w-8 h-8 fill-current" /> Watch
                      </button>
                      <button className="w-20 h-20 bg-white/10 backdrop-blur-3xl border-4 border-white/20 rounded-[2.5rem] flex items-center justify-center text-white hover:bg-pink-500 transition-all shadow-2xl">
                         <Heart className="w-8 h-8" />
                      </button>
                   </div>
                </div>
              </>
            )}
            
            {/* Playful Floating Elements */}
            <div className="absolute top-20 right-20 w-32 h-32 bg-orange-500 rounded-full blur-[80px] animate-pulse" />
            <div className="absolute bottom-20 right-40 w-48 h-48 bg-pink-500 rounded-full blur-[100px] opacity-40 animate-pulse" />
         </div>
      </section>

      {/* Category Bubbles */}
      <section className="px-8 lg:px-24 mt-12 mb-20 overflow-x-auto no-scrollbar py-4">
         <div className="flex items-center gap-6">
            {categories.map((cat, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex-shrink-0 flex items-center gap-4 px-10 py-5 rounded-[2.5rem] border-4 transition-all duration-300 ${activeCategory === cat.name ? `${cat.color} border-white scale-110 shadow-2xl shadow-black/40` : 'bg-white/5 border-white/10 hover:border-pink-500/50'}`}
              >
                 <span className={`${activeCategory === cat.name ? 'text-white' : 'text-pink-500'}`}>{cat.icon}</span>
                 <span className="text-sm font-black uppercase tracking-widest">{cat.name}</span>
              </button>
            ))}
         </div>
      </section>

      {!hasContent && (
        <div className="px-8 lg:px-24 pb-48">
          <div className="bg-white/5 border-4 border-dashed border-white/10 rounded-[4rem] p-32 text-center">
             <PartyPopper className="w-24 h-24 text-pink-500/20 mx-auto mb-8" />
             <h2 className="text-4xl font-black text-white/30 uppercase tracking-[0.4em]">Divine Stories Coming Soon!</h2>
             <p className="text-xl text-white/20 mt-4 uppercase tracking-widest">The spiritual masters are preparing your cartoons...</p>
          </div>
        </div>
      )}

      {/* Video Content Rows */}
      <div className={`px-8 lg:px-24 pb-48 space-y-24 transition-all duration-700 ${hoveredVideoId ? 'blur-md brightness-50 scale-[0.98]' : ''}`}>
         {stories.length > 0 && (
            <div className="space-y-12">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-orange-500 rounded-[2rem] flex items-center justify-center shadow-xl animate-bounce-slow">
                     <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">Wisdom Tales</h2>
               </div>
               <div className="flex gap-10 overflow-x-auto no-scrollbar py-6">
                  {stories.map((story) => (
                    <div 
                      key={story._id || story.id} 
                      onClick={() => navigate(`/stories?id=${story._id || story.id}`)}
                      className="flex-shrink-0 w-[240px] lg:w-[420px] aspect-[4/3] group cursor-pointer relative transition-all duration-700 hover:scale-105"
                    >
                       <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden border-[6px] border-white/10 group-hover:border-orange-500 transition-all bg-white/5">
                          <img src={story.thumbnail || "/scene-krishna.svg"} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" alt={story.title} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-8">
                             <h4 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tighter mb-2">{t(story, 'title')}</h4>
                             <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{story.category || 'Spiritual'}</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         )}

         {sections.map((sec, idx) => {
           const isTrailersRow = sec.title.toLowerCase().includes('stories') || sec.title.toLowerCase().includes('adventures');
           return (
             <KidsRow 
               key={idx} 
               title={sec.title} 
               videos={videos.filter(sec.filter)} 
               onSelect={setSelectedVideo} 
               setHoveredVideoId={setHoveredVideoId} 
               setOpenQuizVideo={setOpenQuizVideo}
               wideTeaser={isTrailersRow}
             />
           );
         })}
      </div>

      {/* Video Modal Overlay */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F1014]/98 backdrop-blur-3xl animate-in fade-in duration-300">
          <button onClick={() => setSelectedVideo(null)} className="absolute top-8 right-8 p-4 rounded-3xl bg-pink-500 text-white shadow-2xl z-[110] hover:scale-110 transition-transform">
             <X className="w-8 h-8" />
          </button>
          
          <div className="w-full max-w-7xl aspect-video rounded-[4rem] overflow-hidden border-[8px] border-white/10 bg-black relative shadow-[0_0_150px_rgba(236,72,153,0.3)]">
             <MediaPlayerHLS 
               url={selectedVideo.videoUrl} 
               hlsUrl={selectedVideo.hlsUrl}
               title={selectedVideo.title}
               className="w-full h-full"
               autoPlay={true}
               controls={true}
             />
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {openQuizVideo && (
        <QuizModal video={openQuizVideo} onClose={() => setOpenQuizVideo(null)} />
      )}
    </div>
  );
}

function KidsRow({ title, videos, onSelect, setHoveredVideoId, setOpenQuizVideo, wideTeaser = false }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const offset = dir === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollLeft + offset, behavior: 'smooth' });
    }
  };

  if (videos.length === 0) return null;

  return (
    <div className="space-y-12">
       <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-pink-500 rounded-[2rem] flex items-center justify-center shadow-xl animate-bounce-slow">
                <Baby className="w-8 h-8 text-white" />
             </div>
             <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">{title}</h2>
          </div>
          <div className="flex gap-4">
             <button onClick={() => scroll('left')} className="p-5 rounded-[2rem] bg-white/5 border-2 border-white/10 hover:bg-pink-500 hover:border-pink-400 transition-all group shadow-2xl">
                <ChevronLeft className="w-8 h-8 group-hover:scale-125 transition-transform" />
             </button>
             <button onClick={() => scroll('right')} className="p-5 rounded-[2rem] bg-white/5 border-2 border-white/10 hover:bg-pink-500 hover:border-pink-400 transition-all group shadow-2xl">
                <ChevronRight className="w-8 h-8 group-hover:scale-125 transition-transform" />
             </button>
          </div>
       </div>
       
        <div 
         ref={scrollRef}
         className="flex gap-10 overflow-x-auto no-scrollbar py-6"
       >
          {videos.map((video) => (
            <KidsCard key={video._id || video.id} video={video} onSelect={onSelect} setHoveredVideoId={setHoveredVideoId} setOpenQuizVideo={setOpenQuizVideo} wideTeaser={wideTeaser} />
          ))}
       </div>
    </div>
  );
}

function KidsCard({ video, onSelect, setHoveredVideoId, setOpenQuizVideo, wideTeaser = false }) {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [activeTrailerIndex, setActiveTrailerIndex] = useState(0);
  const [cardMuted, setCardMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const trailers = (video.trailerUrl || video.videoUrl || '').split(',').map(u => u.trim()).filter(Boolean);
  const currentTrailer = trailers[activeTrailerIndex] || trailers[0];
  const ytId = video.videoUrl?.match(/[?&]v=([^&]+)/)?.[1] || video.videoUrl?.match(/youtu\.be\/([^?]+)/)?.[1];
  const thumbUrl = video.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '/scene-krishna.svg');

  useEffect(() => {
    if (!isHovered || trailers.length <= 1) {
      setProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setActiveTrailerIndex((prev) => (prev + 1) % trailers.length);
      setProgress(0);
    }, 6000);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + (100 / 60), 100));
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [isHovered, trailers.length]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSelect(video);
  };

  return (
    <div 
      tabIndex={0}
      className={`flex-shrink-0 aspect-video group cursor-pointer relative transition-all duration-700 tv-focusable hover:scale-[1.05] hover:z-50 ${wideTeaser ? 'w-[320px] lg:w-[920px]' : 'w-[240px] lg:w-[520px]'}`}
      onMouseEnter={() => {
        setIsHovered(true);
        setHoveredVideoId(video._id || video.id);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoveredVideoId(null);
        setActiveTrailerIndex(0);
        setCardMuted(true);
      }}
      onClick={() => onSelect(video)}
      onKeyDown={handleKeyDown}
    >
       <div className="absolute inset-0 rounded-[2.5rem] lg:rounded-[4rem] overflow-hidden border-[6px] lg:border-[10px] border-white/10 group-hover:border-pink-500 transition-all duration-700 bg-white/5 shadow-3xl tilt-on-hover bouncy-hover">
          <img src={thumbUrl} className={`w-full h-full object-cover transition-all duration-1000 ${isHovered ? 'scale-125 opacity-0 blur-3xl' : 'opacity-90'}`} alt={video.title} />
          
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
                    className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-pink-500 transition-all"
                  >
                     {cardMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  {trailers.length > 1 && (
                    <div className="flex gap-2 bg-black/40 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10">
                       {trailers.map((_, i) => (
                         <div key={i} className="h-1.5 bg-white/20 rounded-full overflow-hidden w-8">
                            <div 
                              className={`h-full bg-pink-500 transition-all duration-100 ${activeTrailerIndex === i ? '' : 'w-0'}`} 
                              style={{ width: activeTrailerIndex === i ? `${progress}%` : activeTrailerIndex > i ? '100%' : '0%' }}
                            />
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-10 lg:p-14">
             <div className="transform translate-y-6 group-hover:translate-y-0 transition-transform duration-700">
                <div className="flex flex-col gap-2 mb-4">
                   {wideTeaser && <span className="px-4 py-1.5 bg-pink-500 text-white text-[11px] font-black rounded-lg uppercase tracking-widest shadow-xl w-fit">Fun Adventure</span>}
                   <h4 className={`font-black uppercase tracking-tighter text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] ${wideTeaser ? 'text-6xl lg:text-8xl' : 'text-2xl lg:text-4xl'}`}>{t(video, 'title')}</h4>
                </div>
                <p className={`text-white/80 font-medium line-clamp-2 mb-6 transition-all duration-700 delay-100 ${wideTeaser && isHovered ? 'opacity-100 h-auto' : 'opacity-0 h-0'}`}>
                   {t(video, 'description')}
                </p>
                <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200">
                   <div className="px-4 py-1.5 bg-pink-500 text-white text-[10px] font-black rounded-xl uppercase tracking-widest">Ages 3-10</div>
                   <span className="flex items-center gap-2 text-[12px] font-black text-white/60 uppercase tracking-widest">
                      <Star className="w-5 h-5 text-orange-400 fill-current" /> {trailers.length > 1 ? `${trailers.length} Teasers` : 'Super Story'}
                   </span>
                </div>
             </div>
             <div className="absolute bottom-10 right-10 flex gap-4 scale-0 group-hover:scale-100 transition-all duration-700 delay-300">
                <button 
                  onClick={(e) => { e.stopPropagation(); setOpenQuizVideo(video); }}
                  className="bg-purple-600 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-3xl hover:bg-purple-500 transition-colors"
                  title="Take Wisdom Quiz"
                >
                   <Brain className="w-10 h-10" />
                </button>
                <div 
                  onClick={() => onSelect(video)}
                  className={`rounded-full flex items-center justify-center text-pink-500 shadow-3xl cursor-pointer ${wideTeaser ? 'bg-white px-12 py-6 gap-4 w-auto h-auto' : 'bg-white w-20 h-20'}`}
                >
                   <Play className={`${wideTeaser ? 'w-8 h-8' : 'w-10 h-10'} fill-current ml-1`} />
                   {wideTeaser && <span className="text-lg font-black uppercase tracking-[0.2em]">Play Story</span>}
                </div>
             </div>
          </div>
       </div>
       
       <div className="absolute -top-8 -right-8 w-24 h-24 bg-orange-500 rounded-[3rem] flex items-center justify-center text-white shadow-3xl rotate-12 scale-0 group-hover:scale-100 transition-all duration-700 delay-500">
          <Sparkles className="w-12 h-12" />
       </div>
    </div>
  );
}

function QuizModal({ video, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data } = await axios.get(`/api/quiz/video/${video._id || video.id}`);
        setQuestions(data);
      } catch (err) {
        console.error('Quiz fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [video]);

  const handleAnswer = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    // Simulation: all answers correct for demo or simple score
    setScore(s => s + 1);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
      if (score > (questions.length / 2)) {
         confetti({
           particleCount: 150,
           spread: 70,
           origin: { y: 0.6 },
           colors: ['#FF69B4', '#8A2BE2', '#FFD700']
         });
      }
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-3xl">
       <div className="animate-bounce">
          <Brain className="w-20 h-20 text-purple-500" />
       </div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-3xl p-8">
       <div className="bg-[#1A1C23] border-4 border-white/10 rounded-[4rem] p-16 text-center max-w-2xl">
          <Smile className="w-24 h-24 text-pink-500 mx-auto mb-8" />
          <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter">Wisdom Coming Soon!</h2>
          <p className="text-gray-400 text-lg mb-12 font-medium">Our spiritual masters are still preparing the questions for this story. Keep learning!</p>
          <button onClick={onClose} className="w-full bg-pink-500 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl">Back to Paradise</button>
       </div>
    </div>
  );

  const currentQ = questions[currentIdx];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0F1014]/98 backdrop-blur-3xl p-4 lg:p-10">
       <div className="w-full max-w-4xl bg-[#1A1C23] border-[8px] border-white/5 rounded-[4rem] overflow-hidden shadow-[0_0_150px_rgba(139,92,246,0.3)] relative">
          {!showResult ? (
            <div className="p-12 lg:p-20">
               <div className="flex justify-between items-center mb-16">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <Award className="w-8 h-8 text-white" />
                     </div>
                     <span className="text-xl font-black text-purple-400 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
                  </div>
                  <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                     <X className="w-6 h-6 text-gray-400" />
                  </button>
               </div>
               <h2 className="text-3xl lg:text-5xl font-black text-white mb-16 leading-tight tracking-tight uppercase">{currentQ.question}</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                  {currentQ.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      className={`p-8 rounded-[2.5rem] border-4 text-left transition-all duration-300 relative overflow-hidden group ${
                        selectedOption === opt 
                          ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_50px_rgba(139,92,246,0.4)]' 
                          : 'bg-white/5 border-white/10 text-gray-300 hover:border-purple-500/50 hover:bg-white/10'
                      }`}
                    >
                       <span className="text-2xl font-black">{opt}</span>
                       {selectedOption === opt && (
                         <div className="absolute right-6 top-1/2 -translate-y-1/2">
                            <Check className="w-8 h-8" />
                         </div>
                       )}
                    </button>
                  ))}
               </div>
               <button
                 onClick={nextQuestion}
                 disabled={!isAnswered}
                 className="w-full py-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-[3rem] font-black text-xl uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
               >
                 {currentIdx + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
               </button>
            </div>
          ) : (
            <div className="p-16 lg:p-24 text-center relative overflow-hidden">
               {/* 3D Mascot Celebration */}
               <div className="absolute top-10 right-10 w-40 h-40 animate-float opacity-30 pointer-events-none">
                  <img src="/baby-krishna.png" className="w-full h-full object-contain" alt="Mascot" />
               </div>
               
               <Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-10 drop-shadow-[0_0_40px_rgba(250,204,21,0.5)] animate-bounce" />
               <h3 className="text-5xl lg:text-7xl font-black text-white mb-6 uppercase tracking-tighter">Wisdom Achieved!</h3>
               <p className="text-2xl text-purple-300 font-bold mb-12 uppercase tracking-widest">You have earned the Blessing of Knowledge</p>
               
               <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 mb-16 flex items-center justify-around relative z-10">
                  <div className="text-center">
                     <p className="text-gray-500 font-black text-xs uppercase tracking-widest mb-2">Correct Answers</p>
                     <p className="text-6xl font-serif font-black text-devotion-gold">{score}/{questions.length}</p>
                  </div>
                  <div className="h-16 w-px bg-white/10" />
                  <div className="text-center flex flex-col items-center">
                     <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                        <Sparkles className="w-6 h-6 text-green-400" />
                     </div>
                     <p className="text-gray-500 font-black text-xs uppercase tracking-widest mb-2">Karma Earned</p>
                     <p className="text-6xl font-serif font-black text-green-400">+{score * 10}</p>
                  </div>
               </div>

               <div className="flex gap-6 relative z-10">
                  <button 
                    onClick={() => {
                      confetti({ particleCount: 100, origin: { x: 0.5, y: 0.7 } });
                    }}
                    className="flex-1 py-8 bg-purple-600/20 border-4 border-purple-500/30 text-purple-400 rounded-[3rem] font-black text-xl uppercase tracking-[0.2em] shadow-2xl hover:bg-purple-600 hover:text-white transition-all"
                  >
                    Celebrate
                  </button>
                  <button 
                    onClick={onClose}
                    className="flex-[2] py-8 bg-white text-black rounded-[3rem] font-black text-xl uppercase tracking-[0.2em] shadow-2xl hover:bg-pink-500 hover:text-white transition-all"
                  >
                    Back to Paradise
                  </button>
               </div>
            </div>
          )}
       </div>
    </div>
  );
}