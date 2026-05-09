import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Music, PlusCircle, Bookmark, Volume2, VolumeX, Play, Pause, AlertCircle, RefreshCw, Bell, User, Heart, MessageCircle, Share2, Grid, Layers, Tv, Smartphone, Monitor, Star, Search, Mic, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import MediaPlayerHLS from '../components/MediaPlayerHLS';
import { useReels } from '../hooks/useReels';
import { MobileNotificationSheet } from '../components/Notifications';
import { useLanguage } from '../context/LanguageContext';
import '../styles/MoviesPremium.css'; // Leverage existing premium styles

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
  const { t } = useLanguage();

  const [platform, setPlatform] = useState('mobile'); 
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const ua = navigator.userAgent;
    if (window.innerWidth > 1400) setPlatform('web');
    if (ua.includes('TV') || ua.includes('SmartTV') || ua.includes('AndroidTV')) setPlatform('tv');
  }, []);

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
    <div className="h-[100dvh] w-full bg-[#0F172A] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,122,0,0.1),transparent_70%)]" />
      <div className="flex flex-col items-center gap-10 relative z-10">
        <div className="relative w-28 h-28">
          <div className="absolute inset-0 border-4 border-white/5 rounded-[2rem] rotate-45" />
          <div className="absolute inset-0 border-t-4 border-[#FF7A00] rounded-[2rem] rotate-45 animate-spin shadow-[0_0_50px_rgba(255,122,0,0.4)]" />
          <div className="absolute inset-0 flex items-center justify-center">
             <Sparkles className="w-10 h-10 text-[#FF7A00] animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-[#FF7A00] text-[11px] font-black uppercase tracking-[0.6em] animate-pulse">Entering Divine Frequency</p>
          <div className="h-1 w-48 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-[#FF7A00] to-[#F5C542] w-1/2 animate-shimmer-progress" />
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-[100dvh] w-full bg-[#0F172A] flex flex-col items-center justify-center p-12 text-center">
      <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-10 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
         <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 premium-text-gradient">{error}</h2>
      <button 
        onClick={() => window.location.reload()} 
        className="group px-12 py-5 bg-gradient-to-br from-[#FF7A00] to-[#B66A2A] text-navy-deep rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:scale-105 transition-all shadow-2xl active:scale-95"
      >
        Restore Connection
      </button>
    </div>
  );

  return (
    <div className="h-[100dvh] w-full bg-[#0F172A] text-white overflow-hidden font-sans selection:bg-[#FF7A00]/30">
      <style>{`
        .reel-snap-container { scroll-snap-type: y mandatory; -webkit-overflow-scrolling: touch; }
        .reel-snap-item { scroll-snap-align: start; scroll-snap-stop: always; }
        .glass-panel { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); }
        .social-button { transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); }
        .social-button:hover { transform: translateY(-5px); }
        .social-button:active { transform: scale(0.85); }
        .animate-shimmer-progress { animation: shimmerProgress 2s infinite ease-in-out; }
        @keyframes shimmerProgress { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .saffron-shadow { shadow-[0_0_30px_rgba(255,122,0,0.3)]; }
      `}</style>

      {/* Version Toggle */}
      <div className="fixed top-28 left-8 z-[1000] hidden lg:flex flex-col gap-4 opacity-30 hover:opacity-100 transition-all duration-500">
        <button onClick={() => setPlatform('mobile')} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${platform === 'mobile' ? 'bg-[#FF7A00] text-navy-deep shadow-[0_0_20px_#FF7A00]' : 'bg-white/5 text-white/40'}`}><Smartphone className="w-5 h-5"/></button>
        <button onClick={() => setPlatform('web')} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${platform === 'web' ? 'bg-[#FF7A00] text-navy-deep shadow-[0_0_20px_#FF7A00]' : 'bg-white/5 text-white/40'}`}><Monitor className="w-5 h-5"/></button>
        <button onClick={() => setPlatform('tv')} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${platform === 'tv' ? 'bg-[#FF7A00] text-navy-deep shadow-[0_0_20px_#FF7A00]' : 'bg-white/5 text-white/40'}`}><Tv className="w-5 h-5"/></button>
      </div>

      {/* MOBILE EXPERIENCE (Saffron Refresh) */}
      {platform === 'mobile' && (
        <div className="h-full w-full relative">
          <div ref={reelsFeedRef} className="h-full w-full overflow-y-scroll reel-snap-container no-scrollbar gpu-accelerated overscroll-none">
            {reels.map((reel, idx) => {
              const reelId = String(reel._id || reel.id);
              const isActive = reelId === activeReelId;
              const index = idx;
              const activeIdx = reels.findIndex(r => String(r._id || r.id) === activeReelId);
              const shouldRenderVideo = isActive || (activeIdx !== -1 && Math.abs(activeIdx - index) <= 1);
              const isPaused = pausedReelId === reelId;
              const shouldPlay = isActive && !isPaused;

              return (
                <div key={reelId} data-index={index} className="h-[100dvh] w-full reel-snap-item relative bg-[#0F172A] flex flex-col justify-end pb-safe overflow-hidden">
                  {/* Cinematic Background */}
                  <div className="absolute inset-0 z-0">
                    {shouldRenderVideo ? (
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
                    ) : (
                      <div className="w-full h-full relative bg-navy-deep">
                        <img 
                          src={reel.thumbnail || "/scene-krishna.svg"} 
                          loading="lazy"
                          className="w-full h-full object-cover blur-2xl opacity-40" 
                          alt="Thumbnail"
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-[#0F172A]/40 pointer-events-none" />
                  </div>

                  <div onClick={() => handleVideoSurfaceTap(reel, reelId)} className="absolute inset-0 z-[15] cursor-pointer" />

                  {/* Spiritual Progress Bar */}
                  <div className="absolute right-0 top-0 bottom-0 w-1.5 z-[25] bg-white/5 pointer-events-none overflow-hidden">
                     <div 
                       className="bg-gradient-to-b from-[#FF7A00] to-[#F5C542] h-full origin-top transition-transform duration-[15s] linear shadow-[0_0_20px_#FF7A00]"
                       style={{ transform: isActive && !isPaused ? 'scaleY(1)' : 'scaleY(0)', transitionProperty: isActive && !isPaused ? 'transform' : 'none' }}
                     />
                  </div>

                  {likePopReelId === reelId && (
                    <div className="absolute inset-0 z-[30] pointer-events-none flex items-center justify-center">
                      <Heart className="w-36 h-36 text-[#FF7A00] fill-current double-tap-heart drop-shadow-[0_0_60px_rgba(255,122,0,0.7)]" />
                    </div>
                  )}

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSoundEnabled(!soundEnabled);
                      document.querySelectorAll('video').forEach((v) => v.muted = soundEnabled);
                    }}
                    className="absolute top-28 right-8 z-[25] w-14 h-14 rounded-2xl glass-panel flex items-center justify-center border border-white/10 active:scale-90 transition-all shadow-2xl"
                  >
                    {soundEnabled ? <Volume2 className="w-6 h-6 text-white"/> : <VolumeX className="w-6 h-6 text-white/40"/>}
                  </button>

                  <div className="relative z-20 w-full px-8 flex justify-between items-end gap-6 mb-28 pointer-events-none">
                    <div className="flex-1 space-y-6 pointer-events-auto">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF7A00] to-[#F5C542] p-[2px] shadow-[0_0_30px_rgba(255,122,0,0.3)]">
                           <div className="w-full h-full rounded-[0.9rem] bg-[#0F172A] flex items-center justify-center overflow-hidden">
                              <img src="/logo-om-v2.png" loading="lazy" className="w-10 h-10 scale-90" alt="OM"/>
                           </div>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-sm font-black tracking-widest uppercase text-white flex items-center gap-2">Gita Wisdom <Sparkles className="w-3 h-3 text-[#FF7A00] animate-pulse"/></span>
                           <span className="text-[10px] font-black text-[#FF7A00] bg-[#FF7A00]/10 px-3 py-1 rounded-full border border-[#FF7A00]/20 uppercase w-fit">Divine Mentor</span>
                        </div>
                      </div>
                      <h2 className="text-2xl font-black leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] uppercase tracking-tighter">{t(reel, 'title')}</h2>
                      <p className="text-base text-white/70 line-clamp-2 italic font-serif leading-relaxed drop-shadow-md">{t(reel, 'description')}</p>
                      <div className="flex items-center gap-4 glass-panel rounded-2xl px-5 py-3 w-fit">
                        <Music className="w-4 h-4 text-[#FF7A00] animate-pulse" />
                        <div className="w-36 overflow-hidden"><marquee className="text-[11px] font-black text-[#FF7A00] uppercase tracking-widest">Ancient Wisdom • {reel.genre || 'Spirituality'}</marquee></div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-8 items-center pointer-events-auto">
                      <button onClick={() => handleToggleLike(reel)} className="social-button flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center glass-panel border transition-all ${likePopReelId === reelId ? 'border-[#FF7A00] bg-[#FF7A00]/20' : 'border-white/10'}`}>
                          <Heart className={`w-8 h-8 ${likePopReelId === reelId ? 'text-[#FF7A00] fill-current' : 'text-white'}`} />
                        </div>
                        <span className="text-[11px] font-black mt-3 uppercase tracking-widest">{reel.likesCount || 0}</span>
                      </button>

                      <button onClick={() => setExpandedCommentReel(reelId)} className="social-button flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center glass-panel border border-white/10">
                          <MessageCircle className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-[11px] font-black mt-3 uppercase tracking-widest">{reel.comments?.length || 0}</span>
                      </button>

                      <button onClick={() => handleToggleSave(reelId)} className="social-button flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center glass-panel border transition-all ${savedReelMap[reelId] ? 'border-[#F5C542] bg-[#F5C542]/20 shadow-[0_0_20px_rgba(245,197,66,0.2)]' : 'border-white/10'}`}>
                          <Bookmark className={`w-8 h-8 ${savedReelMap[reelId] ? 'text-[#F5C542] fill-current' : 'text-white'}`} />
                        </div>
                        <span className="text-[11px] font-black mt-3 uppercase tracking-widest">Saved</span>
                      </button>

                      <button onClick={() => handleShare(reel)} className="social-button flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center glass-panel border border-white/10">
                          <Share2 className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-[11px] font-black mt-3 uppercase tracking-widest">Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="fixed top-0 left-0 w-full z-50 pt-safe px-8 py-6 flex justify-between items-center pointer-events-none">
             <div className="flex items-center gap-4 pointer-events-auto">
                <h1 className="text-3xl font-black uppercase tracking-[0.4em] premium-text-gradient italic">Divine</h1>
                <div className="bg-[#FF7A00] text-navy-deep text-[9px] font-black px-3 py-1 rounded shadow-xl uppercase tracking-[0.2em] animate-pulse">Eternal</div>
             </div>
             <button onClick={() => setShowNotifications(true)} className="w-14 h-14 glass-panel rounded-2xl flex items-center justify-center relative border border-white/10 shadow-2xl pointer-events-auto">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-[#FF7A00] rounded-full border-2 border-navy-deep shadow-[0_0_10px_#FF7A00]" />}
             </button>
          </div>

          <div className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/90 to-transparent pb-safe px-10 pt-10">
             <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-[3rem] px-10 py-5 backdrop-blur-3xl shadow-[0_-30px_60px_rgba(0,0,0,0.6)]">
                <Link to="/home" className="text-white/30 hover:text-[#FF7A00] transition-colors"><Smartphone className="w-7 h-7"/></Link>
                <button className="text-[#FF7A00]"><Layers className="w-8 h-8"/></button>
                <Link to="/upload-reel" className="w-16 h-16 bg-gradient-to-br from-[#FF7A00] to-[#F5C542] rounded-3xl flex items-center justify-center text-navy-deep shadow-[0_0_40px_rgba(255,122,0,0.5)] transform -translate-y-8 border-4 border-[#0F172A] active:scale-90 transition-all"><PlusCircle className="w-9 h-9"/></Link>
                <button onClick={() => setViewMode('grid')} className="text-white/30 hover:text-[#FF7A00] transition-colors"><Grid className="w-7 h-7"/></button>
                <Link to="/profile" className="text-white/30 hover:text-[#FF7A00] transition-colors"><User className="w-7 h-7"/></Link>
             </div>
          </div>
        </div>
      )}

      {/* WEB EXPERIENCE (Gita Cinema Polish) */}
      {platform === 'web' && (
        <div className="flex h-full w-full bg-navy-deep">
          <aside className="w-[340px] h-full border-r border-white/5 flex flex-col p-10 glass-panel z-50">
             <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-5 mb-20 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF7A00] to-[#F5C542] flex items-center justify-center shadow-2xl group-hover:rotate-[360deg] transition-transform duration-1000">
                   <Play className="w-8 h-8 text-navy-deep fill-current" />
                </div>
                <span className="text-2xl font-black tracking-tighter uppercase premium-text-gradient italic">Gita Wisdom</span>
             </div>
             <nav className="flex-1 space-y-5">
                {[
                  { name: 'Divine Home', path: '/home', icon: Monitor },
                  { name: 'Wisdom Search', path: '/search', icon: Search },
                  { name: 'Spiritual Reels', path: '/reels', icon: Sparkles },
                  { name: 'Sacred Movies', path: '/movies', icon: Tv },
                  { name: 'Gita Kids', path: '/kids', icon: Star }
                ].map((m) => (
                   <Link 
                     key={m.name} 
                     to={m.path}
                     className={`group w-full px-8 py-5 rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] transition-all flex items-center gap-6 ${m.name === 'Spiritual Reels' ? 'bg-[#FF7A00] text-navy-deep shadow-[0_0_30px_rgba(255,122,0,0.4)]' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                   >
                      <m.icon className={`w-5 h-5 ${m.name === 'Spiritual Reels' ? 'text-navy-deep' : 'text-white/40 group-hover:text-[#FF7A00]'} transition-colors`} />
                      {m.name}
                   </Link>
                ))}
             </nav>
             <div className="mt-auto space-y-8">
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#FF7A00]/10 to-transparent border border-[#FF7A00]/20 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-20 h-20 bg-[#FF7A00]/10 blur-2xl group-hover:bg-[#FF7A00]/20 transition-all" />
                   <p className="text-[11px] font-black text-[#FF7A00] uppercase tracking-[0.4em] mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Path Finder</p>
                   <p className="text-sm text-white/70 italic leading-relaxed font-serif">"Thy right is to work only, but never to its fruits."</p>
                </div>
                <Link to="/profile" className="flex items-center gap-5 p-5 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF7A00] to-[#F5C542] p-[1.5px] group-hover:scale-110 transition-transform">
                      <div className="w-full h-full rounded-[0.9rem] bg-navy-deep flex items-center justify-center text-[#FF7A00] font-black text-xl italic">V</div>
                   </div>
                   <div className="flex flex-col"><span className="text-xs font-black text-white uppercase tracking-[0.2em]">{user?.name || 'Vullan'}</span><span className="text-[10px] text-[#FF7A00] uppercase tracking-[0.4em] font-black">Divine Soul</span></div>
                </Link>
             </div>
          </aside>

          <main className="flex-1 h-full overflow-y-auto no-scrollbar pb-40">
             <div className="px-16 pt-16">
                <div className="relative w-full h-[550px] rounded-[4rem] overflow-hidden group shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/5">
                   <img src="/scene-krishna.svg" loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s] opacity-50" alt="Hero"/>
                   <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/60 to-transparent" />
                   <div className="absolute inset-0 flex flex-col justify-center px-24 max-w-3xl gap-8 animate-slide-up">
                      <div className="flex items-center gap-4 bg-[#FF7A00]/20 w-fit px-6 py-3 rounded-full border border-[#FF7A00]/40 shadow-xl">
                         <TrendingUp className="w-5 h-5 text-[#FF7A00]"/>
                         <span className="text-[11px] font-black text-[#FF7A00] uppercase tracking-[0.4em]">Most Enlightened Today</span>
                      </div>
                      <h1 className="text-7xl font-black leading-[0.85] uppercase italic tracking-tighter drop-shadow-2xl">Visions of<br/><span className="premium-text-gradient">Eternal Truth</span></h1>
                      <p className="text-2xl text-white/60 leading-relaxed font-serif italic max-w-xl">Experience the essence of life's deepest mysteries in 4K resolution.</p>
                      <div className="flex gap-8 mt-6">
                         <button className="px-16 py-6 rounded-[2rem] bg-[#FF7A00] text-navy-deep font-black uppercase tracking-[0.3em] text-xs hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,122,0,0.5)] flex items-center gap-4"><Play className="w-5 h-5 fill-current"/> Enter Cinema</button>
                         <button className="px-16 py-6 rounded-[2rem] bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.3em] text-xs hover:bg-white/10 transition-all backdrop-blur-3xl">+ My Wisdom</button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="px-16 mt-24">
                <div className="flex items-center justify-between mb-12">
                   <div className="flex items-center gap-6">
                      <div className="h-1.5 w-12 bg-[#FF7A00] rounded-full shadow-[0_0_15px_#FF7A00]" />
                      <h2 className="text-3xl font-black uppercase tracking-[0.3em] italic">Spiritual Reels</h2>
                   </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-10">
                   {reels.map((reel) => (
                      <div 
                        key={reel._id || reel.id} 
                        onClick={() => { setPlatform('mobile'); setActiveReelId(String(reel._id || reel.id)); }}
                        className="group relative aspect-reel rounded-[2.5rem] overflow-hidden cursor-pointer shadow-2xl border-4 border-transparent hover:border-[#FF7A00]/50 transition-all duration-700 hover:-translate-y-4"
                      >
                         <img src={reel.thumbnail || '/krishna-line-art.svg'} loading="lazy" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" alt={t(reel, 'title')}/>
                         <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                            <div className="w-16 h-16 rounded-full bg-[#FF7A00] text-navy-deep flex items-center justify-center scale-75 group-hover:scale-100 transition-transform shadow-[0_0_40px_rgba(255,122,0,0.6)]">
                               <Play className="w-8 h-8 fill-current translate-x-1" />
                            </div>
                         </div>
                         <div className="absolute bottom-10 left-10 right-10">
                            <span className="text-[10px] font-black text-[#FF7A00] uppercase tracking-[0.4em] mb-3 block">{reel.genre || 'Wisdom'}</span>
                            <h3 className="text-lg font-black uppercase tracking-tight mb-4 drop-shadow-xl line-clamp-1">{t(reel, 'title')}</h3>
                            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all translate-y-6 group-hover:translate-y-0">
                               <Heart className="w-4 h-4 text-red-500 fill-current"/>
                               <span className="text-[11px] font-black text-white/50 tracking-widest">{reel.likesCount || 0}</span>
                               <span className="ml-auto text-[10px] font-black text-[#F5C542] tracking-widest uppercase">Watch</span>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </main>
        </div>
      )}

      {/* TV EXPERIENCE (Sacred 4K Polish) */}
      {platform === 'tv' && (
        <div className="h-full w-full bg-navy-deep p-20 lg:p-32 overflow-y-auto no-scrollbar">
          <header className="flex items-center justify-between mb-24 animate-fade-in">
             <div className="flex items-center gap-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF7A00] to-[#F5C542] rounded-3xl flex items-center justify-center shadow-[0_0_60px_rgba(255,122,0,0.4)]"><Play className="w-12 h-12 text-navy-deep fill-current"/></div>
                <div className="flex flex-col gap-2">
                   <h1 className="text-7xl font-black uppercase tracking-[0.4em] italic text-white leading-none premium-text-gradient">Divine Cinema</h1>
                   <span className="text-2xl font-black text-[#FF7A00] uppercase tracking-[0.5em] opacity-80 flex items-center gap-4">Enlightenment in 4K <Sparkles className="w-6 h-6 animate-pulse"/></span>
                </div>
             </div>
             <div className="flex items-center gap-12">
                <div className="flex items-center bg-white/5 border-4 border-white/10 rounded-[2.5rem] px-12 py-8 focus-within:border-[#FF7A00] transition-all shadow-2xl">
                   <Search className="w-10 h-10 text-white/20" />
                   <span className="px-10 text-4xl font-black text-white/10 uppercase tracking-[0.3em]">AI Voice Assistant</span>
                   <Mic className="w-10 h-10 text-[#FF7A00] animate-pulse" />
                </div>
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#FF7A00] to-[#7B2FF7] flex items-center justify-center shadow-2xl border-4 border-white/10"><User className="w-12 h-12 text-white"/></div>
             </div>
          </header>

          <section className="space-y-32">
             <div className="w-full h-[65vh] rounded-[5rem] overflow-hidden relative shadow-[0_60px_150px_rgba(0,0,0,0.9)] border-8 border-white/5 group animate-slide-up">
                <img src="/scene-hanuman.svg" className="w-full h-full object-cover opacity-50 scale-105 group-hover:scale-110 transition-transform duration-[10s]" alt="TV Hero"/>
                <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center px-40 max-w-6xl gap-12">
                   <div className="bg-[#FF7A00]/20 w-fit px-10 py-5 rounded-full border-4 border-[#FF7A00]/40 shadow-2xl">
                      <Star className="w-10 h-10 text-[#FF7A00] fill-current"/>
                   </div>
                   <h2 className="text-[12rem] font-black leading-[0.8] uppercase italic tracking-tighter premium-text-gradient drop-shadow-2xl">The Eternal Chariot</h2>
                   <p className="text-5xl text-white/60 leading-relaxed font-serif italic max-w-5xl">"Guidance for the soul, courage for the heart."</p>
                   <div className="flex gap-16 mt-10">
                      <button className="tv-focusable px-24 py-12 rounded-[4rem] bg-[#FF7A00] text-navy-deep font-black uppercase tracking-[0.3em] text-3xl shadow-[0_0_60px_rgba(255,122,0,0.5)] active:scale-95 transition-all">Watch Now</button>
                      <button className="tv-focusable px-24 py-12 rounded-[4rem] bg-white/5 backdrop-blur-3xl text-white font-black uppercase tracking-[0.3em] text-3xl border-4 border-white/10 hover:bg-white/10 transition-all">+ My Path</button>
                   </div>
                </div>
             </div>

             <div>
                <div className="flex items-center gap-10 mb-16 ml-4">
                   <TrendingUp className="w-12 h-12 text-[#FF7A00]"/>
                   <h3 className="text-5xl font-black uppercase tracking-[0.4em] text-white/50">Sacred Reels</h3>
                </div>
                <div className="flex gap-16 overflow-x-auto p-10 pb-24 no-scrollbar snap-x">
                  {reels.map((reel) => (
                      <button 
                        key={reel._id || reel.id} 
                        onFocus={() => setActiveReelId(String(reel._id || reel.id))}
                        className={`tv-focusable relative w-[600px] aspect-[9/16] rounded-[5rem] overflow-hidden shadow-2xl border-8 transition-all duration-700 flex-shrink-0 group snap-center ${activeReelId === String(reel._id || reel.id) ? 'border-[#FF7A00] scale-110 shadow-[0_0_100px_rgba(255,122,0,0.3)]' : 'border-white/5 opacity-40 hover:opacity-100'}`}
                      >
                        <div className="absolute inset-0 bg-navy-deep">
                            <MediaPlayerHLS
                              url={reel.videoUrl || reel.youtubeUrl || reel.url}
                              className="w-full h-full object-cover"
                              autoPlay={activeReelId === String(reel._id || reel.id)}
                              muted={activeReelId !== String(reel._id || reel.id)}
                              controls={false}
                              loop={true}
                              instagramMode={true}
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-transparent to-transparent opacity-90 group-focus:opacity-100 transition-opacity" />
                        <div className="absolute bottom-20 left-20 right-20 opacity-0 group-focus:opacity-100 transition-all translate-y-12 group-focus:translate-y-0 duration-500">
                            <span className="text-2xl font-black text-[#FF7A00] uppercase tracking-[0.5em] mb-6 block">{reel.genre || 'Enlightenment'}</span>
                            <h4 className="text-6xl font-black uppercase tracking-tight mb-8 leading-none drop-shadow-2xl">{t(reel, 'title')}</h4>
                            <div className="flex items-center gap-8 text-[#F5C542]">
                              <Play className="w-12 h-12 fill-current" />
                              <span className="text-3xl font-black uppercase tracking-[0.3em]">Full Insight</span>
                            </div>
                        </div>
                      </button>
                  ))}
                </div>
             </div>
          </section>
        </div>
      )}

      {/* REFINED COMMENT DRAWER (Saffron/Glassmorphism) */}
      {expandedCommentReel && (
        <>
          <div className="fixed inset-0 z-[2000] bg-navy-deep/80 backdrop-blur-3xl animate-fade-in" onClick={() => setExpandedCommentReel(null)} />
          <div className="fixed bottom-0 left-0 w-full md:max-w-[600px] md:left-1/2 md:-translate-x-1/2 bg-[#0F172A] rounded-t-[5rem] z-[2010] flex flex-col h-[90vh] animate-slide-up shadow-[0_-40px_150px_rgba(0,0,0,1)] border-t border-[#FF7A00]/20">
            <div className="flex justify-center pt-8 pb-4"><div className="w-20 h-2 bg-white/10 rounded-full" /></div>
            
            <div className="px-12 py-12 border-b border-white/5 flex items-center justify-between">
               <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-black text-[#FF7A00] uppercase tracking-[0.5em] flex items-center gap-4">Divine Discourse <MessageCircle className="w-6 h-6"/></h3>
                  <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em]">Spiritual Reflection Circle</p>
               </div>
               <div className="bg-[#FF7A00]/10 px-6 py-3 rounded-full border border-[#FF7A00]/20 text-[11px] font-black uppercase tracking-[0.3em] text-[#FF7A00]">
                 {reels.find(r => String(r._id || r.id) === expandedCommentReel)?.comments?.length || 0} Insights
               </div>
            </div>

            <div className="flex-1 overflow-y-auto px-12 py-12 space-y-12 no-scrollbar">
               {reels.find(r => String(r._id || r.id) === expandedCommentReel)?.comments?.map((comment, i) => (
                  <div key={i} className="flex gap-8 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                     <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-[#FF7A00]/20 to-transparent flex items-center justify-center border border-[#FF7A00]/30 flex-shrink-0 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[#FF7A00]/5 group-hover:bg-[#FF7A00]/10 transition-colors" />
                        <span className="text-[#FF7A00] font-black text-2xl relative z-10 italic">{(comment.userName || 'S').charAt(0)}</span>
                     </div>
                     <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <p className="text-sm font-black text-white uppercase tracking-[0.3em]">{comment.userName || 'Seeker'}</p>
                              <div className="w-2 h-2 bg-[#FF7A00] rounded-full animate-pulse shadow-[0_0_10px_#FF7A00]"/>
                           </div>
                           {user && (user.role === 'admin' || String(comment.userId) === String(user.id || user._id)) && (
                              <button onClick={() => handleDeleteComment(expandedCommentReel, comment._id)} className="text-[10px] font-black text-red-500/40 uppercase hover:text-red-500 transition-colors tracking-widest">Release</button>
                           )}
                        </div>
                        <p className="text-lg text-white/60 leading-relaxed font-serif italic">{comment.text}</p>
                     </div>
                  </div>
               ))}
               {(!reels.find(r => String(r._id || r.id) === expandedCommentReel)?.comments?.length) && (
                  <div className="text-center py-40 opacity-20 flex flex-col items-center gap-10">
                     <div className="w-32 h-32 rounded-full border-4 border-dashed border-[#FF7A00]/30 flex items-center justify-center"><Sparkles className="w-14 h-14 text-[#FF7A00]"/></div>
                     <p className="text-sm font-black uppercase tracking-[0.5em] text-[#FF7A00]">Be the first to share wisdom.</p>
                  </div>
               )}
            </div>

            <div className="p-12 bg-navy-deep/80 backdrop-blur-[40px] border-t border-white/5 pb-safe">
               <div className="relative flex items-center gap-8">
                  <div className="flex-1 relative group">
                    <input
                      type="text"
                      value={commentInputs[expandedCommentReel] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [expandedCommentReel]: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(expandedCommentReel)}
                      placeholder="Share your spiritual reflection..."
                      className="w-full bg-white/5 border-2 border-white/5 rounded-[2.5rem] px-10 py-8 text-lg text-white placeholder-white/10 focus:border-[#FF7A00]/50 outline-none transition-all group-hover:bg-white/10 shadow-2xl"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-5 text-white/10 group-focus-within:text-[#FF7A00]/30 transition-colors">
                       <Mic className="w-6 h-6"/>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCommentSubmit(expandedCommentReel)}
                    disabled={submittingCommentId === expandedCommentReel}
                    className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-[#FF7A00] to-[#F5C542] text-navy-deep flex items-center justify-center shadow-[0_20px_50px_rgba(255,122,0,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 border-4 border-navy-deep"
                  >
                    {submittingCommentId === expandedCommentReel ? <RefreshCw className="w-10 h-10 animate-spin"/> : <PlusCircle className="w-12 h-12" />}
                  </button>
               </div>
            </div>
          </div>
        </>
      )}

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

