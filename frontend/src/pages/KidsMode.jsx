import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Play, X, ChevronLeft, ChevronRight, Baby, Sparkles, ArrowLeft, 
  Brain, Check, Award, Trophy, Smile, BookOpen, ShieldCheck,
  Gamepad2, Music, GraduationCap, Search, Mic, Heart, Plus, Star, Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import MediaPlayerHLS from '../components/MediaPlayerHLS';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/MoviesPremium.css'; // Shared cinematic styles

export default function KidsMode() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, setUser } = useAuth();
  const [videos, setVideos] = useState([]);
  const [stories, setStories] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredVideoId, setHoveredVideoId] = useState(null);
  const [openQuizVideo, setOpenQuizVideo] = useState(null);
  const [featuredVideo, setFeaturedVideo] = useState(null);

  const fetchKidsContent = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch separately to be resilient
      let vRes = [];
      let sRes = [];
      
      try {
        const videoRes = await axios.get('/api/videos');
        vRes = (videoRes.data || []).filter(v => v.isKids || v.category === 'animated');
      } catch (e) { console.error('Video fetch failed', e); }
      
      try {
        const storyRes = await axios.get('/api/stories/kids');
        sRes = storyRes.data || [];
      } catch (e) { console.error('Story fetch failed', e); }
      
      setVideos(vRes);
      setStories(sRes);
      
      if (vRes.length > 0) {
        setFeaturedVideo(vRes[0]);
      }

      // Fetch watchlist
      if (user) {
        try {
          const watchlistRes = await axios.get('/api/movies/watchlist');
          setWatchlist(Array.isArray(watchlistRes.data) ? watchlistRes.data : []);
        } catch (watchErr) {
          console.error("Watchlist fetch failed", watchErr);
          setWatchlist([]);
        }
      }
      
      if (vRes.length === 0 && sRes.length === 0) {
        throw new Error('No content available');
      }
    } catch (error) {
      console.error('Error fetching kids content:', error);
      setError('Connection to Divine Cloud failed. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKidsContent();
  }, []);

  const toggleWatchlist = async (videoId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      // Re-using the same movies watchlist for now
      const { data } = await axios.post(`/api/movies/${videoId}/toggle-watchlist`);
      setWatchlist(data.watchlist);
      if (user) {
        const updatedUser = { ...user, watchlist: data.watchlist };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
    }
  };



  if (error) {
    return (
      <div className="h-[100dvh] w-full bg-[#0F172A] flex flex-col items-center justify-center p-12 text-center">
        <Sparkles className="w-24 h-24 text-[#FF7A00] mb-10 animate-pulse" />
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 premium-text-gradient">{error}</h2>
        <button 
          onClick={() => fetchKidsContent()} 
          className="px-12 py-5 bg-gradient-to-br from-[#FF7A00] to-[#B66A2A] text-navy-deep rounded-[2rem] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-2xl"
        >
          Restore Paradise
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-[#0F172A] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,122,0,0.1),transparent_70%)]" />
        <div className="flex flex-col items-center gap-10">
           <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
              <div className="absolute inset-0 border-t-4 border-[#FF7A00] rounded-full animate-spin shadow-[0_0_40px_rgba(255,122,0,0.4)]" />
           </div>
           <p className="text-[#FF7A00] text-[11px] font-black uppercase tracking-[0.6em] animate-pulse">Entering Kids Paradise</p>
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

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-[#FF7A00]/30 font-sans overflow-x-hidden pb-32">
      <nav className="fixed top-0 w-full z-50 px-8 py-8 flex items-center justify-between bg-gradient-to-b from-[#0F172A] to-transparent pointer-events-none">
        <div className="flex items-center gap-8 pointer-events-auto">
          <div className="relative group">
             <img 
               src="/kids_mascot_1778310861074.png" 
               loading="lazy"
               className="absolute -top-16 -left-20 w-40 h-40 object-contain animate-float drop-shadow-[0_20px_60px_rgba(255,122,0,0.5)] z-10 cursor-pointer hover:scale-125 transition-transform" 
               alt="Mascot"
               onClick={() => {
                 confetti({
                   particleCount: 100,
                   spread: 120,
                   origin: { x: 0.1, y: 0.1 },
                   colors: ['#FF7A00', '#F5C542', '#FFD700']
                 });
               }}
             />
             <button 
               onClick={() => navigate('/home')} 
               className="w-16 h-16 bg-[#0F172A]/60 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] flex items-center justify-center text-white hover:bg-[#FF7A00] hover:text-navy-deep transition-all shadow-2xl relative z-0"
             >
               <ArrowLeft className="w-8 h-8" />
             </button>
          </div>
          <div className="flex flex-col gap-1">
             <h1 className="text-4xl font-black tracking-tighter uppercase italic premium-text-gradient">Kids Mode</h1>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-1">Safe Divine Space</span>
          </div>
        </div>

        <div className="flex items-center gap-8 pointer-events-auto">
           <div className="hidden lg:flex items-center bg-[#0F172A]/40 border border-white/5 rounded-[2rem] px-8 py-5 focus-within:border-[#FF7A00]/40 transition-all backdrop-blur-3xl group shadow-2xl">
              <Search className="w-5 h-5 text-white/20 group-focus-within:text-[#FF7A00]" />
              <input type="text" placeholder="AI Search Cartoons..." className="bg-transparent border-none outline-none px-6 w-80 text-sm font-black uppercase tracking-widest placeholder:text-white/10" />
              <button className="w-10 h-10 rounded-xl bg-[#FF7A00]/20 flex items-center justify-center hover:bg-[#FF7A00] transition-all group/mic">
                 <Mic className="w-5 h-5 text-[#FF7A00] group-hover/mic:text-navy-deep" />
              </button>
           </div>
           <button className="flex items-center gap-4 bg-white/5 border border-white/10 px-8 py-5 rounded-[2rem] hover:bg-green-500/20 transition-all group shadow-2xl">
              <ShieldCheck className="w-7 h-7 text-green-500" />
              <span className="text-xs font-black uppercase tracking-[0.3em] hidden xl:block text-white/50">Safe Mode Active</span>
           </button>
        </div>
      </nav>

       <section className="relative h-[80vh] lg:h-[85vh] w-full px-6 lg:px-24 pt-24 mb-16 flex items-center">
          <div className="relative w-full h-full rounded-[2.5rem] lg:rounded-[4rem] border-2 border-white/10 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] group">
             <AnimatePresence mode="wait">
                {featuredVideo && (
                   <motion.div 
                     key={featuredVideo._id || featuredVideo.id}
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
                        {featuredVideo.trailerUrl ? (
                          <div className="w-full h-full pointer-events-none">
                             <MediaPlayerHLS 
                                url={featuredVideo.trailerUrl} 
                                className="w-full h-full object-cover scale-110 premium-video-refinement" 
                                autoPlay={true} 
                                muted={true} 
                                loop={true} 
                                controls={false}
                             />
                          </div>
                        ) : (
                          <img 
                            src={featuredVideo.thumbnail || "/scene-krishna.svg"} 
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
                            {featuredVideo.category || 'Divine Series'}
                         </span>
                         <div className="flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-5 py-2 rounded-xl border border-white/10 glass-morphism">
                            <Star className="w-4 h-4 text-devotion-gold fill-current" />
                            <span className="text-devotion-gold font-black text-xs">9.8</span>
                         </div>
                         <span className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            U/A ALL AGES
                         </span>
                         <span className="hidden md:inline-flex text-white/40 font-black text-[10px] uppercase tracking-widest">
                            {featuredVideo.views || '425K'} WATCHED
                         </span>
                      </motion.div>

                      <motion.h1 
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 1 }}
                        className="text-5xl lg:text-[8rem] font-black uppercase tracking-tighter leading-[0.8] mb-10 italic premium-text-gradient drop-shadow-3xl"
                      >
                         {t(featuredVideo, 'title')}
                      </motion.h1>

                      <motion.p 
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-lg lg:text-2xl text-white/60 font-serif italic leading-relaxed max-w-3xl line-clamp-2 mb-12 lg:mb-16 cinematic-text-shadow"
                      >
                         {t(featuredVideo, 'description') || "Embark on a divine journey through the sacred stories of Indian mythology, reimagined for the young souls of today."}
                      </motion.p>

                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="flex flex-wrap items-center gap-6"
                      >
                         <button 
                           onClick={() => setSelectedVideo(featuredVideo)}
                           className="premium-btn-primary px-8 lg:px-12 py-5 lg:py-6 rounded-[1.5rem] lg:rounded-[2rem] font-black text-lg lg:text-xl uppercase tracking-[0.2em] flex items-center justify-center gap-5 group shadow-2xl relative z-30"
                         >
                            <Play className="w-6 h-6 lg:w-8 lg:h-8 fill-current" /> 
                            <span className="whitespace-nowrap">Watch Now</span>
                         </button>
                         <button 
                           onClick={() => toggleWatchlist(featuredVideo._id)}
                           className={`premium-btn-secondary w-16 h-16 lg:w-20 lg:h-20 rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center transition-all group border-2 relative z-30 ${watchlist.some(w => (w._id || w) === featuredVideo._id) ? 'bg-devotion-saffron border-devotion-saffron text-navy-deep' : 'border-white/10 text-white hover:border-devotion-saffron/50'}`}
                         >
                            {watchlist.some(w => (w._id || w) === featuredVideo._id) ? <Check className="w-9 h-9" /> : <Plus className="w-9 h-9 group-hover:rotate-90 transition-transform" />}
                         </button>
                      </motion.div>
                   </div>

                   {/* Mascot Overlay */}
                   <motion.div 
                     initial={{ x: 100, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     transition={{ delay: 1.2, duration: 1 }}
                     className="absolute bottom-10 right-10 w-[300px] h-[300px] z-30 pointer-events-none hidden lg:block"
                   >
                     <img src="/kids_mascot_1778310861074.png" alt="Mascot" className="w-full h-full object-contain drop-shadow-[0_20px_60px_rgba(255,122,0,0.4)] animate-float" />
                   </motion.div>
                </motion.div>
             )}
          </AnimatePresence>
          </div>
       </section>

       <div className="px-6 lg:px-24 mb-16 overflow-x-auto no-scrollbar flex items-center gap-4 py-4">
          {['All', 'Ramayana', 'Krishna', 'Hanuman', 'Panchatantra', 'Moral Stories', 'Educational'].map(cat => (
             <button
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat ? 'bg-[#FF7A00] border-[#FF7A00] text-navy-deep shadow-[0_10px_25px_rgba(255,122,0,0.3)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
             >
               {cat}
             </button>
          ))}
       </div>
       <div className={`px-6 lg:px-24 mt-12 lg:mt-24 tv:mt-32 space-y-24 lg:space-y-40 tv:space-y-48 pb-40 transition-all duration-1000 ${hoveredVideoId ? 'brightness-[0.85]' : ''}`}>
          {/* Sacred Stories Row */}
          {stories.length > 0 && (
            <KidsRow 
              title="Sacred Stories" 
              videos={stories} 
              onSelect={setSelectedVideo} 
              setFeaturedVideo={setFeaturedVideo} 
              setOpenQuizVideo={setOpenQuizVideo}
              setHoveredVideoId={setHoveredVideoId}
              wideTeaser={true}
            />
          )}

          {/* Video Sections */}
          {sections.map((sec, idx) => {
            const secVideos = videos.filter(sec.filter);
            if (secVideos.length === 0) return null;
            return (
              <KidsRow 
                key={idx}
                title={sec.title} 
                videos={secVideos} 
                onSelect={setSelectedVideo} 
                setFeaturedVideo={setFeaturedVideo} 
                setOpenQuizVideo={setOpenQuizVideo}
                setHoveredVideoId={setHoveredVideoId}
              />
            );
          })}
       </div>

      {selectedVideo && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#0F172A]/98 backdrop-blur-3xl animate-in fade-in duration-500 overflow-hidden">
          <div className="w-full h-full relative flex flex-col items-center justify-center p-4 md:p-10 lg:p-20">
            <div className="w-full max-w-7xl flex justify-between items-center mb-8 px-4 relative z-[1010]">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#FF7A00] rounded-2xl flex items-center justify-center shadow-2xl"><Play className="w-8 h-8 text-navy-deep fill-current"/></div>
                  <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-white line-clamp-1">{t(selectedVideo, 'title')}</h3>
               </div>
               <button 
                 onClick={() => setSelectedVideo(null)} 
                 className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-red-500 transition-all shadow-2xl"
               >
                  <X className="w-10 h-10" />
               </button>
            </div>
            
            <div className="w-full max-w-7xl aspect-video rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border-[8px] border-white/5 bg-black relative shadow-[0_60px_150px_rgba(0,0,0,0.8)] mx-auto group">
               <MediaPlayerHLS 
                 url={selectedVideo.videoUrl} 
                 hlsUrl={selectedVideo.hlsUrl}
                 title={selectedVideo.title}
                 className="w-full h-full object-contain"
                 autoPlay={true}
                 controls={true}
               />
               <div className="absolute inset-0 pointer-events-none border-[12px] border-[#FF7A00]/10 rounded-[2.5rem] md:rounded-[4rem]" />
            </div>

            <div className="absolute bottom-[-10%] w-full h-[30%] bg-[#FF7A00]/5 blur-[120px] rounded-full pointer-events-none" />
          </div>
        </div>
      )}

      {openQuizVideo && (
        <QuizModal video={openQuizVideo} onClose={() => setOpenQuizVideo(null)} />
      )}
    </div>
  );
}

function KidsRow({ title, videos, onSelect, setFeaturedVideo, setOpenQuizVideo, setHoveredVideoId, wideTeaser = false }) {
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
    <div className="space-y-10">
       <div className="flex justify-between items-center px-4">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 bg-gradient-to-br from-[#FF7A00] to-[#F5C542] rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-navy-deep" />
             </div>
             <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tight text-white italic">{title}</h2>
          </div>
          <div className="flex gap-4">
             <button onClick={() => scroll('left')} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:bg-[#FF7A00] hover:text-navy-deep transition-all flex items-center justify-center">
                <ChevronLeft className="w-8 h-8" />
             </button>
             <button onClick={() => scroll('right')} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:bg-[#FF7A00] hover:text-navy-deep transition-all flex items-center justify-center">
                <ChevronRight className="w-8 h-8" />
             </button>
          </div>
       </div>
       
        <div ref={scrollRef} className="flex gap-8 overflow-x-auto no-scrollbar py-10 px-4 snap-x snap-mandatory">
          {videos.map((video) => (
            <KidsCard 
              key={video._id || video.id} 
              video={video} 
              onSelect={onSelect} 
              setFeaturedVideo={setFeaturedVideo}
              setOpenQuizVideo={setOpenQuizVideo} 
              setHoveredVideoId={setHoveredVideoId}
              wideTeaser={wideTeaser} 
            />
          ))}
       </div>
    </div>
  );
}

function KidsCard({ video, onSelect, setFeaturedVideo, setOpenQuizVideo, setHoveredVideoId, wideTeaser = false }) {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  const trailers = (video.trailerUrl || video.videoUrl || '').split(',').map(u => u.trim()).filter(Boolean);
  const currentTrailer = trailers[0];
  const ytId = video.videoUrl?.match(/[?&]v=([^&]+)/)?.[1] || video.videoUrl?.match(/youtu\.be\/([^?]+)/)?.[1];
  const thumbUrl = video.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '/scene-krishna.svg');

  useEffect(() => {
    if (!isHovered) {
      setProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1.5, 100));
    }, 50);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <motion.div
      layout
      tabIndex="0"
      whileHover={{ scale: 1.1, rotateY: 3, rotateX: 2, z: 50 }}
      whileFocus={{ scale: 1.1, rotateY: 3, rotateX: 2, z: 50, outline: 'none' }}
      onFocus={() => {
        setIsHovered(true);
        setFeaturedVideo(video);
        setHoveredVideoId(video._id);
      }}
      onBlur={() => {
        setIsHovered(false);
        setHoveredVideoId(null);
      }}
      onHoverStart={() => {
        setIsHovered(true);
        setHoveredVideoId(video._id);
        setTimeout(() => setFeaturedVideo(video), 150);
      }}
      onHoverEnd={() => {
        setIsHovered(false);
        setHoveredVideoId(null);
      }}
      onClick={() => {
        setFeaturedVideo(video);
        onSelect(video);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setFeaturedVideo(video);
          onSelect(video);
        }
      }}
      className={`flex-shrink-0 aspect-video group cursor-pointer relative snap-start outline-none premium-focus-ring ${wideTeaser ? 'w-[320px] lg:w-[680px]' : 'w-[240px] lg:w-[420px]'}`}
    >
       <div className="absolute inset-0 rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden border-4 border-white/5 group-hover:border-[#FF7A00]/60 transition-all duration-500 bg-[#0F172A] shadow-2xl">
          <img 
            src={thumbUrl} 
            loading="lazy" 
            className={`w-full h-full object-cover transition-opacity duration-700 ${isHovered ? 'opacity-0' : 'opacity-100'}`} 
            alt={video.title} 
          />
          
          {/* Teaser Autoplay */}
          {isHovered && currentTrailer && (
            <div className="absolute inset-0 z-0 bg-black">
               <MediaPlayerHLS
                 url={currentTrailer}
                 className="w-full h-full object-cover"
                 autoPlay={true}
                 muted={true}
                 controls={false}
                 loop={true}
               />
               
               {/* Teaser UI Overlay */}
               <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-80" />
               
               {/* Progress Bar */}
               <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/10 z-20">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-[#FF7A00] shadow-[0_0_10px_#FF7A00]"
                  />
               </div>
            </div>
          )}

          {/* Static UI Elements */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-10 z-10">
             <div className={`transition-all duration-500 ${isHovered ? 'translate-y-0' : 'translate-y-4'}`}>
                <div className="flex items-center gap-3 mb-3">
                   <span className="px-3 py-1 bg-[#FF7A00] text-navy-deep text-[8px] font-black rounded-full uppercase tracking-widest shadow-lg">
                      {video.category || 'Kids'}
                   </span>
                   <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                      {video.duration || '5:00'} MIN
                   </span>
                </div>
                <h4 className="text-xl lg:text-3xl font-black text-white uppercase tracking-tighter italic leading-none drop-shadow-2xl">
                   {t(video, 'title')}
                </h4>
             </div>

             {/* Hover Actions */}
             <div className={`absolute top-6 right-6 flex gap-3 transition-all duration-500 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                <button 
                   onClick={(e) => { e.stopPropagation(); setOpenQuizVideo(video); }}
                   className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xl hover:rotate-12 transition-all"
                >
                   <Brain className="w-6 h-6" />
                </button>
                <button 
                   onClick={(e) => { e.stopPropagation(); onSelect(video); }}
                   className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-navy-deep shadow-xl hover:scale-110 transition-all"
                >
                   <Play className="w-6 h-6 fill-current ml-0.5" />
                </button>
             </div>
          </div>
       </div>
       
       {/* Background Glow */}
       <div className={`absolute -inset-4 bg-[#FF7A00]/20 blur-[30px] rounded-full transition-opacity duration-500 -z-10 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
    </motion.div>
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
         confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#FF7A00', '#F5C542', '#8A2BE2'] });
      }
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-navy-deep/90 backdrop-blur-3xl">
       <div className="animate-float"><Brain className="w-32 h-32 text-purple-400" /></div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-navy-deep/90 backdrop-blur-3xl p-10">
       <div className="bg-[#0F172A] border-[10px] border-white/5 rounded-[4rem] p-24 text-center max-w-4xl shadow-2xl">
          <Smile className="w-32 h-32 text-[#FF7A00] mx-auto mb-10 animate-bounce" />
          <h2 className="text-5xl font-black text-white mb-8 uppercase tracking-tighter italic">Wisdom Coming Soon!</h2>
          <p className="text-white/40 text-2xl mb-16 font-serif italic">Our spiritual masters are still preparing the enlightenment questions for this journey.</p>
          <button onClick={onClose} className="w-full bg-[#FF7A00] text-navy-deep py-8 rounded-[3rem] font-black uppercase tracking-[0.3em] text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all">Back to Paradise</button>
       </div>
    </div>
  );

  const currentQ = questions[currentIdx];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#0F172A]/98 backdrop-blur-3xl p-4 lg:p-20 overflow-y-auto">
       <div className="w-full max-w-5xl bg-[#0F172A] border-[12px] border-white/5 rounded-[5rem] overflow-hidden shadow-[0_100px_200px_rgba(0,0,0,0.9)] relative">
          {!showResult ? (
            <div className="p-8 lg:p-16">
               <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 bg-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float"><Award className="w-12 h-12 text-white" /></div>
                     <div className="flex flex-col"><span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-1">Knowledge Trial</span><span className="text-2xl font-black text-purple-400 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span></div>
                  </div>
                  <button onClick={onClose} className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"><X className="w-8 h-8 text-white/30" /></button>
               </div>
               <h2 className="text-3xl lg:text-6xl font-black text-white mb-12 leading-[1.1] tracking-tighter uppercase italic premium-text-gradient">{currentQ.question}</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {currentQ.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      className={`p-6 lg:p-8 rounded-[2rem] border-4 text-left transition-all duration-500 relative overflow-hidden group ${selectedOption === opt ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_80px_rgba(139,92,246,0.5)] scale-105' : 'bg-white/5 border-white/10 text-white/50 hover:border-[#FF7A00]/40'}`}
                    >
                       <span className="text-3xl font-black italic">{opt}</span>
                       {selectedOption === opt && <div className="absolute right-10 top-1/2 -translate-y-1/2"><Check className="w-12 h-12 text-white" /></div>}
                    </button>
                  ))}
               </div>
               <button onClick={nextQuestion} disabled={!isAnswered} className="w-full py-6 lg:py-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-[3rem] font-black text-xl lg:text-2xl uppercase tracking-[0.4em] shadow-2xl disabled:opacity-20 transition-all">
                 {currentIdx + 1 === questions.length ? 'Conclude Trial' : 'Next Question'}
               </button>
            </div>
          ) : (
            <div className="p-12 lg:p-24 text-center relative overflow-hidden">
               <Trophy className="w-48 h-48 text-[#F5C542] mx-auto mb-16 drop-shadow-[0_0_80px_rgba(245,197,66,0.5)] animate-bounce" />
               <h3 className="text-7xl lg:text-9xl font-black text-white mb-8 uppercase tracking-tighter italic premium-text-gradient">Wisdom Achieved</h3>
               <p className="text-3xl text-purple-400 font-black mb-20 uppercase tracking-[0.4em]">Knowledge Blessing Earned</p>
               <div className="bg-white/5 border border-white/10 rounded-[4rem] p-16 mb-20 flex items-center justify-around">
                  <div className="text-center"><p className="text-white/20 font-black text-xs uppercase tracking-[0.5em] mb-4">Final Score</p><p className="text-[8rem] font-serif font-black text-[#FF7A00] leading-none">{score}/{questions.length}</p></div>
                  <div className="h-40 w-px bg-white/10" />
                  <div className="text-center flex flex-col items-center"><Sparkles className="w-16 h-16 text-green-400 mb-6 animate-pulse" /><p className="text-white/20 font-black text-xs uppercase tracking-[0.5em] mb-4">Karma Pulse</p><p className="text-[8rem] font-serif font-black text-green-400 leading-none">+{score * 10}</p></div>
               </div>
               <div className="flex gap-10"><button onClick={onClose} className="flex-1 py-10 bg-white text-navy-deep rounded-[4rem] font-black text-2xl uppercase tracking-[0.4em] shadow-2xl hover:bg-[#FF7A00] hover:text-navy-deep transition-all">Back to Paradise</button></div>
            </div>
          )}
       </div>
    </div>
  );
}
