import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Music, PlusCircle, Bookmark, Volume2, VolumeX, Play, Pause, AlertCircle, RefreshCw, Bell, User, Heart, MessageCircle, Share2, Grid, Layers, Tv, Smartphone, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';
import MediaPlayerHLS from '../components/MediaPlayerHLS';
import { useReels } from '../hooks/useReels';
import { MobileNotificationSheet } from '../components/Notifications';

export default function Reels() {
  const {
    user, reels, pendingReels, loading, error, commentInputs, setCommentInputs,
    submittingCommentId, bgIndex, expandedCommentReel, setExpandedCommentReel,
    savedReelMap, activeReelId, viewMode, setViewMode,
    soundEnabled, setSoundEnabled, likePopReelId, pausedReelId, reelsFeedRef,
    handleToggleLike, handleShare, setActiveReelId, 
    setPausedReelId, handleVideoSurfaceTap, fetchReels, handleCommentSubmit, handleDeleteComment, handleToggleSave,
    showNotifications, setShowNotifications, unreadCount, handleMarkAsRead, notifications
  } = useReels();

  const [platform, setPlatform] = useState('mobile'); // 'mobile', 'web', 'tv'
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const ua = navigator.userAgent;
    if (window.innerWidth > 1400) setPlatform('web');
    if (ua.includes('TV') || ua.includes('SmartTV') || ua.includes('AndroidTV')) setPlatform('tv');
  }, []);

  // Optimized IntersectionObserver for Snap Scroll
  useEffect(() => {
    const container = reelsFeedRef.current;
    if (!container || !reels.length || platform === 'web') return;

    if (!activeReelId && reels.length > 0) {
      setActiveReelId(String(reels[0]._id || reels[0].id));
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          const reel = reels[index];
          if (reel) {
            setActiveReelId(String(reel._id || reel.id));
            setPausedReelId('');
          }
        }
      });
    }, { threshold: 0.6 });

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [reels, activeReelId, platform]);

  if (loading) return (
    <div className="h-[100dvh] w-full bg-cinematic-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
          <div className="absolute inset-0 border-t-4 border-devotion-gold rounded-full animate-spin shadow-[0_0_40px_rgba(211,154,74,0.6)]" />
        </div>
        <p className="text-devotion-gold text-xs font-black uppercase tracking-[0.5em] animate-pulse">Initializing Cinematic Feed</p>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] w-full bg-black text-white overflow-hidden font-['Inter',sans-serif]">
      <style>{`
        .reel-snap-container { scroll-snap-type: y mandatory; }
        .reel-snap-item { scroll-snap-align: start; }
        .glass-panel { background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(40px); border: 1px border rgba(255,255,255,0.05); }
        .social-button { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .social-button:active { transform: scale(0.85); }
        .double-tap-heart { animation: heartPop 0.8s ease-out forwards; }
        @keyframes heartPop {
          0% { transform: scale(0) rotate(-15deg); opacity: 0; }
          50% { transform: scale(1.5) rotate(0deg); opacity: 1; }
          100% { transform: scale(1.2) rotate(0deg); opacity: 0; }
        }
        .shimmer-bg { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); animation: shimmer 2s infinite; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>

      {/* Platform Toggle (Dev/Debug) */}
      <div className="fixed top-24 left-6 z-[1000] hidden md:flex flex-col gap-2 opacity-20 hover:opacity-100 transition-opacity">
        <button onClick={() => setPlatform('mobile')} className={`p-3 rounded-full ${platform === 'mobile' ? 'bg-devotion-gold text-black' : 'bg-white/10 text-white'}`}><Smartphone className="w-4 h-4"/></button>
        <button onClick={() => setPlatform('web')} className={`p-3 rounded-full ${platform === 'web' ? 'bg-devotion-gold text-black' : 'bg-white/10 text-white'}`}><Monitor className="w-4 h-4"/></button>
        <button onClick={() => setPlatform('tv')} className={`p-3 rounded-full ${platform === 'tv' ? 'bg-devotion-gold text-black' : 'bg-white/10 text-white'}`}><Tv className="w-4 h-4"/></button>
      </div>

      {/* VERSION 1: MOBILE APP EXPERIENCE */}
      {platform === 'mobile' && (
        <div className="h-full w-full relative">
          <div ref={reelsFeedRef} className="h-full w-full overflow-y-scroll reel-snap-container no-scrollbar gpu-accelerated overscroll-none">
            {reels.map((reel, index) => {
              const reelId = String(reel._id || reel.id);
              const isActive = reelId === activeReelId;
              const isPaused = pausedReelId === reelId;
              const shouldPlay = isActive && !isPaused;

              return (
                <div key={reelId} data-index={index} className="h-full w-full reel-snap-item relative bg-black flex flex-col justify-end pb-safe">
                  {/* Vertical Video */}
                  <div className="absolute inset-0 z-0 bg-[#0A121E]">
                    <MediaPlayerHLS
                      url={reel.videoUrl || reel.youtubeUrl || reel.url}
                      title={reel.title}
                      className="w-full h-full object-cover"
                      autoPlay={shouldPlay}
                      shouldPlay={shouldPlay}
                      muted={!shouldPlay || !soundEnabled}
                      loop={true}
                      controls={false}
                      instagramMode={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                  </div>

                  {/* Surface for Taps */}
                  <button onClick={() => handleVideoSurfaceTap(reel, reelId)} className="absolute inset-0 z-[15]" />

                  {/* Double Tap Heart Animation */}
                  {likePopReelId === reelId && (
                    <div className="absolute inset-0 z-[30] pointer-events-none flex items-center justify-center">
                      <Heart className="w-32 h-32 text-red-500 fill-current double-tap-heart drop-shadow-[0_0_40px_rgba(239,68,68,0.8)]" />
                    </div>
                  )}

                  {/* Sound Toggle Overlay */}
                  <button 
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="absolute top-28 right-6 z-[25] w-12 h-12 rounded-full glass-panel flex items-center justify-center border border-white/10"
                  >
                    {soundEnabled ? <Volume2 className="w-5 h-5"/> : <VolumeX className="w-5 h-5"/>}
                  </button>

                  {/* Content Overlay */}
                  <div className="relative z-20 w-full px-6 flex justify-between items-end gap-6 mb-24 pointer-events-none">
                    <div className="flex-1 space-y-4 pointer-events-auto">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-devotion-gold to-[#B66A2A] p-0.5 shadow-lg">
                           <div className="w-full h-full rounded-[0.9rem] bg-black flex items-center justify-center overflow-hidden">
                              <img src="/krishna-symbol.svg" className="w-8 h-8 opacity-80" alt="Avatar"/>
                           </div>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-black tracking-wider uppercase text-white shadow-sm">Gita Mentor AI</span>
                           <button className="text-[10px] font-black text-devotion-gold bg-devotion-gold/10 px-2 py-0.5 rounded border border-devotion-gold/20 uppercase w-fit mt-1">Follow</button>
                        </div>
                      </div>
                      <h2 className="text-xl font-black leading-tight drop-shadow-md">{reel.title}</h2>
                      <p className="text-sm text-white/70 line-clamp-2 italic font-serif leading-relaxed">{reel.description || 'Embark on a spiritual journey of self-discovery.'}</p>
                      <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-full px-4 py-2 w-fit backdrop-blur-md">
                        <Music className="w-3 h-3 text-devotion-gold animate-pulse" />
                        <div className="w-32 overflow-hidden"><marquee className="text-[10px] font-bold text-devotion-gold uppercase tracking-widest">Divine Wisdom • Chapter 2 • Verse 47</marquee></div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-8 items-center pointer-events-auto">
                      <button onClick={() => handleToggleLike(reel)} className="social-button flex flex-col items-center group">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center glass-panel border transition-all ${likePopReelId === reelId ? 'border-red-500 bg-red-500/20' : 'border-white/10'}`}>
                          <Heart className={`w-7 h-7 ${likePopReelId === reelId ? 'text-red-500 fill-current' : 'text-white'}`} />
                        </div>
                        <span className="text-[10px] font-black mt-2 uppercase tracking-widest">{reel.likesCount || 0}</span>
                      </button>

                      <button onClick={() => setExpandedCommentReel(reelId)} className="social-button flex flex-col items-center group">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center glass-panel border border-white/10">
                          <MessageCircle className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-[10px] font-black mt-2 uppercase tracking-widest">{reel.comments?.length || 0}</span>
                      </button>

                      <button onClick={() => handleToggleSave(reelId)} className="social-button flex flex-col items-center group">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center glass-panel border transition-all ${savedReelMap[reelId] ? 'border-devotion-gold bg-devotion-gold/20' : 'border-white/10'}`}>
                          <Bookmark className={`w-7 h-7 ${savedReelMap[reelId] ? 'text-devotion-gold fill-current' : 'text-white'}`} />
                        </div>
                        <span className="text-[10px] font-black mt-2 uppercase tracking-widest">Save</span>
                      </button>

                      <button onClick={() => handleShare(reel)} className="social-button flex flex-col items-center group">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center glass-panel border border-white/10">
                          <Share2 className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-[10px] font-black mt-2 uppercase tracking-widest">Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Mobile Header */}
          <div className="fixed top-0 left-0 w-full z-50 pt-safe px-6 flex justify-between items-center pointer-events-none">
             <div className="flex items-center gap-4 pointer-events-auto">
                <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-white italic">Divine</h1>
                <div className="bg-devotion-gold text-black text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">Live</div>
             </div>
             <div className="flex items-center gap-4 pointer-events-auto">
                <button onClick={() => setShowNotifications(true)} className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center relative border border-white/10 shadow-2xl">
                   <Bell className="w-5 h-5" />
                   {unreadCount > 0 && <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-red-600 rounded-full border-2 border-black" />}
                </button>
             </div>
          </div>

          {/* Mobile Bottom Navigation */}
          <div className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-t from-black via-black/80 to-transparent pb-safe px-8 pt-8">
             <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-[2.5rem] px-8 py-4 backdrop-blur-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                <Link to="/home" className="text-white/40 hover:text-white transition-colors"><Smartphone className="w-6 h-6"/></Link>
                <button className="text-devotion-gold"><Layers className="w-7 h-7"/></button>
                <Link to="/upload-reel" className="w-14 h-14 bg-gradient-to-r from-devotion-gold to-[#B66A2A] rounded-2xl flex items-center justify-center text-black shadow-[0_0_30px_rgba(211,154,74,0.4)] transform -translate-y-6 border-4 border-black active:scale-90 transition-all"><PlusCircle className="w-8 h-8"/></Link>
                <button onClick={() => setViewMode('grid')} className="text-white/40 hover:text-white transition-colors"><Grid className="w-6 h-6"/></button>
                <Link to="/profile" className="text-white/40 hover:text-white transition-colors"><User className="w-6 h-6"/></Link>
             </div>
          </div>
        </div>
      )}

      {/* VERSION 2: WEBSITE / DESKTOP EXPERIENCE */}
      {platform === 'web' && (
        <div className="flex h-full w-full bg-cinematic-dark">
          {/* Sidebar */}
          <div className="w-[300px] h-full border-r border-white/5 flex flex-col p-8 glass-panel z-50">
             <div className="flex items-center gap-4 mb-16">
                <div className="w-10 h-10 bg-devotion-gold rounded-xl flex items-center justify-center"><Layers className="w-6 h-6 text-black"/></div>
                <h1 className="text-xl font-black uppercase tracking-[0.2em] italic">Gita Cinema</h1>
             </div>
             <nav className="flex-1 space-y-4">
                {['Home', 'Explore', 'Shorts', 'Movies', 'Library'].map((m) => (
                   <button key={m} className={`w-full text-left px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-between ${m === 'Shorts' ? 'bg-devotion-gold text-black shadow-lg shadow-devotion-gold/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                      {m}
                      {m === 'Shorts' && <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"/>}
                   </button>
                ))}
             </nav>
             <div className="mt-auto space-y-6">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                   <p className="text-[10px] font-black text-devotion-gold uppercase tracking-widest mb-3">AI Recommendation</p>
                   <p className="text-sm text-white/60 italic leading-relaxed">"Based on your spirit, we suggest Chapter 2: The Yoga of Knowledge."</p>
                </div>
                <Link to="/profile" className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                   <div className="w-12 h-12 rounded-2xl bg-devotion-gold/20 flex items-center justify-center text-devotion-gold font-black italic">V</div>
                   <div className="flex flex-col"><span className="text-xs font-black text-white uppercase tracking-wider">{user?.name || 'Vullan'}</span><span className="text-[10px] text-white/30 uppercase tracking-widest">Premium Member</span></div>
                </Link>
             </div>
          </div>

          {/* Main Feed Content */}
          <div className="flex-1 h-full overflow-y-auto no-scrollbar pb-32">
             {/* Large Hero */}
             <div className="px-12 pt-12">
                <div className="relative w-full h-[500px] rounded-[3rem] overflow-hidden group shadow-2xl border border-white/5">
                   <img src="/scene-krishna.svg" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-60" alt="Hero"/>
                   <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
                   <div className="absolute inset-0 flex flex-col justify-center px-16 max-w-2xl gap-6">
                      <div className="flex items-center gap-3 bg-devotion-gold/20 w-fit px-4 py-2 rounded-full border border-devotion-gold/40">
                         <Star className="w-4 h-4 text-devotion-gold fill-current"/>
                         <span className="text-[10px] font-black text-devotion-gold uppercase tracking-widest">Trending Now</span>
                      </div>
                      <h1 className="text-6xl font-black leading-none uppercase italic tracking-tighter">Wisdom of the Ages</h1>
                      <p className="text-xl text-white/60 leading-relaxed font-serif italic">"Beyond the realms of time and space, the divine knowledge flows for your eternal peace."</p>
                      <div className="flex gap-6 mt-4">
                         <button className="px-10 py-5 rounded-3xl bg-devotion-gold text-black font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-devotion-gold/20">Watch Feature</button>
                         <button className="px-10 py-5 rounded-3xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all backdrop-blur-xl">+ My List</button>
                      </div>
                   </div>
                </div>
             </div>

             {/* Reels Row */}
             <div className="px-12 mt-16">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-black uppercase tracking-[0.2em] italic">Spiritual Reels</h2>
                   <div className="flex gap-3">
                      <button onClick={() => setPlatform('mobile')} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"><Smartphone className="w-4 h-4"/></button>
                      <button className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"><Monitor className="w-4 h-4"/></button>
                   </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
                   {reels.map((reel) => (
                      <div 
                        key={reel._id || reel.id} 
                        onClick={() => { setPlatform('mobile'); setActiveReelId(String(reel._id || reel.id)); }}
                        className="group relative aspect-reel rounded-[2rem] overflow-hidden cursor-pointer shadow-2xl border border-white/5 hover:border-devotion-gold/50 transition-all duration-500 hover:-translate-y-2"
                      >
                         <img src={reel.thumbnail || '/krishna-line-art.svg'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={reel.title}/>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute bottom-6 left-6 right-6">
                            <h3 className="text-sm font-black uppercase tracking-wider mb-2 drop-shadow-md">{reel.title}</h3>
                            <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                               <div className="flex items-center gap-2">
                                  <Heart className="w-3.5 h-3.5 text-red-500 fill-current"/>
                                  <span className="text-[10px] font-black text-white/60 tracking-widest">{reel.likesCount || 0}</span>
                               </div>
                               <button className="p-2 rounded-full bg-devotion-gold text-black shadow-lg"><Play className="w-3 h-3 fill-current"/></button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* VERSION 3: SMART TV / ANDROID TV EXPERIENCE */}
      {platform === 'tv' && (
        <div className="h-full w-full bg-cinematic-dark p-24 overflow-hidden relative">
          <div className="absolute top-24 left-24 flex items-center gap-8 mb-16">
             <div className="w-16 h-16 bg-devotion-gold rounded-3xl flex items-center justify-center shadow-2xl"><Layers className="w-10 h-10 text-black"/></div>
             <h1 className="text-5xl font-black uppercase tracking-[0.3em] italic text-gold-gradient">Divine TV</h1>
          </div>

          <div className="mt-32 space-y-24">
             {/* TV Hero Row */}
             <div className="w-full h-[600px] rounded-[4rem] overflow-hidden relative shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-8 border-white/5 animate-in zoom-in duration-700">
                <img src="/scene-hanuman.svg" className="w-full h-full object-cover opacity-60 scale-110 animate-cinematic-pulse" alt="TV Hero"/>
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center px-32 max-w-5xl gap-12">
                   <div className="bg-devotion-gold/20 w-fit px-8 py-4 rounded-full border-4 border-devotion-gold/40">
                      <Star className="w-8 h-8 text-devotion-gold fill-current"/>
                   </div>
                   <h2 className="text-9xl font-black leading-none uppercase italic tracking-tighter">Sacred Journey</h2>
                   <p className="text-4xl text-white/60 leading-relaxed font-serif italic max-w-4xl">"Experience the ultimate spiritual awakening through 4K cinematic storytelling."</p>
                   <div className="flex gap-12 mt-8">
                      <button className="tv-focusable px-20 py-10 rounded-[3rem] bg-devotion-gold text-black font-black uppercase tracking-[0.2em] text-2xl shadow-[0_0_50px_rgba(211,154,74,0.4)]">Play Now</button>
                      <button className="tv-focusable px-20 py-10 rounded-[3rem] bg-white/10 backdrop-blur-3xl text-white font-black uppercase tracking-[0.2em] text-2xl border-4 border-white/10">More Info</button>
                   </div>
                </div>
             </div>

             {/* TV Category Rail */}
             <div>
                <h3 className="text-4xl font-black uppercase tracking-[0.3em] text-white/40 mb-12 ml-4">Featured Reels</h3>
                <div className="flex gap-12 overflow-x-hidden p-4">
                   {reels.map((reel, i) => (
                      <button 
                        key={reel._id || reel.id} 
                        className="tv-focusable relative w-[400px] aspect-reel rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white/5 text-left flex-shrink-0 group"
                      >
                         <img src={reel.thumbnail || '/krishna-line-art.svg'} className="w-full h-full object-cover opacity-80" alt="Rail Card"/>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-80 group-focus:opacity-100 transition-opacity" />
                         <div className="absolute bottom-12 left-12 right-12 opacity-0 group-focus:opacity-100 transition-all translate-y-8 group-focus:translate-y-0">
                            <h4 className="text-4xl font-black uppercase tracking-wider mb-4 leading-tight">{reel.title}</h4>
                            <div className="flex items-center gap-4 text-devotion-gold">
                               <Play className="w-8 h-8 fill-current" />
                               <span className="text-2xl font-black uppercase tracking-widest">Watch Trailer</span>
                            </div>
                         </div>
                      </button>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Global Comment Drawer (Shared between Mobile/Web) */}
      {expandedCommentReel && (
        <>
          <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setExpandedCommentReel(null)} />
          <div className="fixed bottom-0 left-0 w-full md:max-w-[500px] md:left-1/2 md:-translate-x-1/2 bg-[#0A121E] rounded-t-[4rem] z-[2010] flex flex-col h-[85vh] animate-in slide-in-from-bottom duration-500 shadow-[0_-30px_150px_rgba(0,0,0,1)] border-t border-white/10">
            <div className="flex justify-center pt-6 pb-2"><div className="w-16 h-2 bg-white/10 rounded-full" /></div>
            
            <div className="px-10 py-10 border-b border-white/5 flex items-center justify-between">
               <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-black text-devotion-gold uppercase tracking-[0.4em]">Spiritual Discourse</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Global Community Reflections</p>
               </div>
               <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60">
                 {reels.find(r => String(r._id || r.id) === expandedCommentReel)?.comments?.length || 0} Comments
               </div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10 no-scrollbar">
               {reels.find(r => String(r._id || r.id) === expandedCommentReel)?.comments?.map((comment, i) => (
                  <div key={i} className="flex gap-6 animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                     <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-devotion-gold/20 to-transparent flex items-center justify-center border border-devotion-gold/20 flex-shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 shimmer-bg opacity-30"/>
                        <span className="text-devotion-gold font-black text-lg relative z-10">{(comment.userName || 'D').charAt(0)}</span>
                     </div>
                     <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <p className="text-xs font-black text-white uppercase tracking-[0.2em]">{comment.userName || 'Seeker'}</p>
                              <div className="w-1.5 h-1.5 bg-devotion-gold rounded-full animate-pulse"/>
                           </div>
                           {user && (user.role === 'admin' || String(comment.userId) === String(user.id || user._id)) && (
                              <button onClick={() => handleDeleteComment(expandedCommentReel, comment._id)} className="text-[9px] font-black text-red-500/60 uppercase hover:text-red-500 transition-colors">Delete</button>
                           )}
                        </div>
                        <p className="text-base text-white/70 leading-relaxed font-serif italic">{comment.text}</p>
                     </div>
                  </div>
               ))}
               {(!reels.find(r => String(r._id || r.id) === expandedCommentReel)?.comments?.length) && (
                  <div className="text-center py-32 opacity-20 flex flex-col items-center gap-6">
                     <div className="w-24 h-24 rounded-full border-4 border-dashed border-white/20 flex items-center justify-center"><MessageCircle className="w-10 h-10"/></div>
                     <p className="text-xs font-black uppercase tracking-[0.3em]">No reflections yet. Be the first to awaken.</p>
                  </div>
               )}
            </div>

            {/* Comment Input */}
            <div className="p-10 bg-[#06101E]/80 backdrop-blur-3xl border-t border-white/5 pb-safe">
               <div className="relative flex items-center gap-6">
                  <div className="flex-1 relative group">
                    <input
                      type="text"
                      value={commentInputs[expandedCommentReel] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [expandedCommentReel]: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(expandedCommentReel)}
                      placeholder="Share your spiritual reflection..."
                      className="w-full bg-white/5 border-2 border-white/5 rounded-3xl px-8 py-6 text-base text-white placeholder-white/20 focus:border-devotion-gold/50 outline-none transition-all group-hover:bg-white/10 shadow-2xl"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-4 text-white/20">
                       <Smartphone className="w-5 h-5"/>
                       <Monitor className="w-5 h-5"/>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCommentSubmit(expandedCommentReel)}
                    disabled={submittingCommentId === expandedCommentReel}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-devotion-gold to-[#B66A2A] text-black flex items-center justify-center shadow-[0_10px_30px_rgba(211,154,74,0.4)] hover:scale-105 active:scale-90 transition-all disabled:opacity-50 border-4 border-black"
                  >
                    {submittingCommentId === expandedCommentReel ? <RefreshCw className="w-8 h-8 animate-spin"/> : <PlusCircle className="w-10 h-10" />}
                  </button>
               </div>
            </div>
          </div>
        </>
      )}

      {/* Notifications Layer */}
      {showNotifications && (
        <MobileNotificationSheet 
          notifications={notifications} 
          unreadCount={unreadCount} 
          handleMarkAsRead={handleMarkAsRead} 
          onClose={() => setShowNotifications(false)} 
        />
      )}
    </div>
  );
}

