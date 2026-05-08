import React, { useEffect, useCallback, useMemo } from 'react';
import { Music, PlusCircle, Bookmark, Volume2, VolumeX, Play, Pause, AlertCircle, RefreshCw, Bell, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import MediaPlayerHLS from '../components/MediaPlayerHLS';
import { useReels } from '../hooks/useReels';
import { MobileNotificationSheet } from '../components/Notifications';

const REELS_BACKGROUND_SCENES = [
  '/scene-krishna.svg',
  '/scene-ram.svg',
  '/scene-hanuman.svg',
];

export default function Reels() {
  const {
    user, reels, pendingReels, loading, error, commentInputs, setCommentInputs,
    submittingCommentId, moderatingId, bgIndex, expandedCommentReel, setExpandedCommentReel,
    savedReelMap, selectedCommentProfile, setSelectedCommentProfile, activeReelId,
    viewMode, setViewMode,
    soundEnabled, setSoundEnabled, likePopReelId, pausedReelId, reelsFeedRef,
    canViewCommenterProfile, handleToggleLike, handleShare, setActiveReelId, 
    setPausedReelId, handleVideoSurfaceTap, fetchReels, handleCommentSubmit, handleDeleteComment, handleToggleSave,
    showNotifications, setShowNotifications, unreadCount, handleMarkAsRead, notifications
  } = useReels();

  // Optimized IntersectionObserver for Mobile Viewports
  useEffect(() => {
    const container = reelsFeedRef.current;
    if (!container || !reels.length) return;

    // Force first reel active if none selected
    if (!activeReelId && reels.length > 0) {
      setActiveReelId(String(reels[0]._id || reels[0].id));
    }

    const observerOptions = {
      root: null,
      threshold: 0.3, // More lenient for mobile headers/navs
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          const reel = reels[index];
          if (reel) {
            const nextActiveId = String(reel._id || reel.id);
            setActiveReelId(nextActiveId);
            setPausedReelId('');
          }
        }
      });
    }, observerOptions);

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [reels, setActiveReelId, setPausedReelId, reelsFeedRef]);

  // Smooth Scroll Management (Wheel + Keys)
  const scrollToReel = useCallback((index) => {
    if (!reelsFeedRef.current || !reels || index < 0 || index >= reels.length) return;
    const target = reelsFeedRef.current.children[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [reels, reelsFeedRef]);

  useEffect(() => {
    const container = reelsFeedRef.current;
    if (!container || !reels.length) return;

    let wheelTimeout;
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > 30) {
        e.preventDefault();
        if (wheelTimeout) return;
        const activeIndex = reels.findIndex(r => String(r._id || r.id) === activeReelId);
        if (e.deltaY > 0) scrollToReel(activeIndex + 1);
        else scrollToReel(activeIndex - 1);
        wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 600);
      }
    };

    const handleKeyDown = (e) => {
      const activeIndex = reels.findIndex(r => String(r._id || r.id) === activeReelId);
      if (e.key === 'ArrowDown') { e.preventDefault(); scrollToReel(activeIndex + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); scrollToReel(activeIndex - 1); }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reels, activeReelId, scrollToReel, reelsFeedRef]);

  if (loading) return (
    <div className="h-[100dvh] w-full bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-14 h-14 border-t-4 border-[#D39A4A] rounded-full animate-spin shadow-[0_0_30px_rgba(211,154,74,0.4)]"></div>
        <p className="text-[#D39A4A] text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing Divine Feed</p>
      </div>
    </div>
  );

  if (error || (reels.length === 0 && !loading)) {
    return (
      <div className="h-[100dvh] w-full bg-[#050B14] flex flex-col items-center justify-center text-center px-10">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-8 animate-bounce-slow">
          <AlertCircle className="w-12 h-12 text-red-500/60" />
        </div>
        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">{error || 'No Reels Found'}</h2>
        <p className="text-gray-400 text-sm mb-12 max-w-xs leading-relaxed italic opacity-80">"The divine flow may be paused. Let us attempt to reconnect your spirit."</p>
        <button 
          onClick={fetchReels} 
          className="flex items-center gap-3 px-10 py-5 rounded-3xl bg-devotion-gold text-[#050B14] font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-90"
        >
          <RefreshCw className="w-4 h-4" /> RETRY SYNC
        </button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-black relative overflow-hidden overscroll-none touch-pan-y">
      
      {/* Dynamic Backgrounds */}{REELS_BACKGROUND_SCENES.map((image, index) => (
        <div
          key={image}
          className={`fixed inset-0 bg-cover bg-center transition-opacity duration-1000 pointer-events-none ${index === bgIndex ? 'opacity-30' : 'opacity-0'}`}
          style={{ backgroundImage: `url('${image}')` }}
          aria-hidden="true"
        />
      ))}
      <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      {/* Main Feed Container */}
      {viewMode === 'scroll' ? (
        <div 
          ref={reelsFeedRef} 
          className="w-full h-full md:max-w-[420px] mx-auto relative z-10 bg-black md:border-x md:border-white/10 snap-y snap-mandatory overflow-y-scroll no-scrollbar scroll-smooth overscroll-none"
        >
          {reels.map((reel, index) => {
            const reelId = String(reel._id || reel.id);
            const isActive = reelId === activeReelId;
            const isPausedByTap = pausedReelId === reelId;
            const shouldPlay = isActive && !isPausedByTap;
            
            const activeIndex = reels.findIndex(r => String(r._id || r.id) === activeReelId);
            const distance = Math.abs(index - activeIndex);
            const isNear = distance <= 2;

            return (
              <div 
                key={reelId} 
                data-index={index} 
                className="h-full min-h-[100dvh] w-full relative snap-center flex flex-col justify-end bg-black overflow-hidden"
              >
                {/* Video Surface */}
                <div className="absolute inset-0 z-0">
                  {isNear ? (
                    <MediaPlayerHLS
                      url={reel.videoUrl || reel.youtubeUrl || reel.url}
                      hlsUrl={reel.hlsUrl}
                      title={reel.title}
                      className="w-full h-full object-cover"
                      autoPlay={shouldPlay}
                      shouldPlay={shouldPlay}
                      muted={!shouldPlay || !soundEnabled}
                      loop={true}
                      controls={false}
                      instagramMode={true}
                      preload={distance === 0 ? "auto" : "metadata"}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#050B14] flex items-center justify-center">
                       <img src={reel.thumbnail || '/krishna-line-art.svg'} className="w-full h-full object-cover opacity-20 blur-sm" alt="Preview" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={() => handleVideoSurfaceTap(reel, reelId)}
                  className="absolute inset-0 z-[15] cursor-pointer"
                  aria-label="Toggle Playback"
                />

                <button
                  onClick={() => setSoundEnabled(p => !p)}
                  className={`absolute top-24 right-6 z-[25] w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-xl border transition-all active:scale-90 ${soundEnabled ? 'bg-[#D39A4A]/40 border-[#E6C38A]/50 text-white' : 'bg-black/50 border-white/20 text-white/60'}`}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                {isPausedByTap && isActive && (
                  <div className="absolute inset-0 z-[22] flex items-center justify-center pointer-events-none animate-in zoom-in-50 duration-200">
                    <div className="w-20 h-20 rounded-full bg-black/40 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-10 h-10 text-white ml-1.5" />
                    </div>
                  </div>
                )}

                {likePopReelId === reelId && (
                  <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                    <img src="/ram-symbol.svg" className="w-32 h-32 object-contain animate-fade-in-up drop-shadow-[0_0_40px_rgba(255,215,0,0.8)]" alt="Blessing" />
                  </div>
                )}

                <div className="relative z-20 w-full px-6 pb-28 md:pb-10 flex justify-between items-end gap-6 pointer-events-none">
                   <div className="flex-1 drop-shadow-2xl pointer-events-auto">
                      <h2 className="text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-tighter leading-none">{reel.title}</h2>
                      <p className="text-sm font-medium text-gray-200 line-clamp-2 italic font-serif leading-relaxed opacity-90">{reel.description || 'Spiritual wisdom in motion.'}</p>
                      <div className="flex items-center gap-3 mt-5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-fit backdrop-blur-md">
                         <Music className="w-4 h-4 text-devotion-gold animate-pulse" />
                         <div className="w-32 overflow-hidden">
                            <marquee className="text-[10px] font-black text-[#E6C38A] uppercase tracking-widest">Lord Krishna Wisdom • Gita Mentor</marquee>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col gap-6 items-center pointer-events-auto">
                      <button className="tv-focusable flex flex-col items-center group" onClick={() => handleToggleLike(reel)}>
                         <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 border border-white/15 flex items-center justify-center backdrop-blur-3xl transition-all group-active:scale-90 group-hover:bg-red-500/20 group-hover:border-red-500/40">
                            <img src="/ram-symbol.svg" className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(255,215,0,0.6)]" alt="Like" />
                         </div>
                         <span className="text-[11px] font-black text-white/90 mt-1 uppercase tracking-widest drop-shadow-md">{reel.likesCount || 0}</span>
                      </button>

                      <button className="tv-focusable flex flex-col items-center group" onClick={() => setExpandedCommentReel(reelId)}>
                         <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 border border-white/15 flex items-center justify-center backdrop-blur-3xl transition-all group-active:scale-90">
                            <img src="/krishna-symbol.svg" className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(0,191,255,0.6)]" alt="Comment" />
                         </div>
                         <span className="text-[11px] font-black text-white/90 mt-1 uppercase tracking-widest drop-shadow-md">{reel.commentsCount || 0}</span>
                      </button>

                      <button className="tv-focusable flex flex-col items-center group" onClick={() => handleToggleSave(reelId)}>
                         <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center backdrop-blur-3xl border transition-all active:scale-90 ${savedReelMap[reelId] ? 'bg-devotion-gold/20 border-devotion-gold/50' : 'bg-white/5 border-white/15'}`}>
                            <Bookmark className={`w-7 h-7 ${savedReelMap[reelId] ? 'text-devotion-gold fill-current' : 'text-white'}`} strokeWidth={2.5} />
                         </div>
                         <span className="text-[11px] font-black text-white/90 mt-1 uppercase tracking-widest drop-shadow-md">{savedReelMap[reelId] ? 'Saved' : 'Save'}</span>
                      </button>

                      <button className="tv-focusable flex flex-col items-center group" onClick={() => handleShare(reel)}>
                         <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 border border-white/15 flex items-center justify-center backdrop-blur-3xl transition-all group-active:scale-90">
                            <img src="/hanuman-symbol.svg" className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(255,165,0,0.6)]" alt="Share" />
                         </div>
                         <span className="text-[11px] font-black text-white/90 mt-1 uppercase tracking-widest drop-shadow-md">Share</span>
                      </button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* GRID VIEW (Type B) */
        <div className="w-full h-full pt-32 pb-24 px-6 overflow-y-auto no-scrollbar relative z-10 animate-in fade-in duration-500">
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-6">
              {reels.map((reel, index) => (
                <div 
                  key={reel._id || reel.id} 
                  tabIndex={0}
                  onClick={() => { setViewMode('scroll'); setTimeout(() => scrollToReel(index), 100); }}
                  className="tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold aspect-[9/16] relative rounded-2xl overflow-hidden border border-white/10 cursor-pointer group transition-all duration-300 shadow-2xl preserve-3d"
                  onMouseMove={(e) => {
                    const card = e.currentTarget;
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = ((y - centerY) / centerY) * -10;
                    const rotateY = ((x - centerX) / centerX) * 10;
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                  }}
                >
                  <img src={reel.thumbnail || '/krishna-line-art.svg'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[8px] font-bold text-white uppercase tracking-tighter">
                     <span className="flex items-center gap-1"><Play className="w-2.5 h-2.5 fill-current" /> {reel.likesCount || 0}</span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Floating Header */}
      <div className="fixed top-0 left-0 w-full z-[100] md:max-w-[420px] md:left-1/2 md:-translate-x-1/2">
        <div className="flex items-center justify-between px-6 py-6 bg-gradient-to-b from-black/80 via-black/20 to-transparent">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-white uppercase tracking-[0.4em] drop-shadow-2xl">Reels</h1>
            <button 
              onClick={() => setViewMode(v => v === 'scroll' ? 'grid' : 'scroll')}
              className="tv-focusable bg-devotion-gold/20 border border-devotion-gold/40 text-devotion-gold px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md active:scale-95 transition-all"
            >
              {viewMode === 'scroll' ? 'Grid' : 'Full'}
            </button>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setShowNotifications(true)} className="tv-focusable relative w-11 h-11 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl active:scale-90 transition-all">
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-black animate-pulse" />}
             </button>
             <Link to="/upload-reel" className="tv-focusable w-11 h-11 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl transition-all active:scale-90">
                <PlusCircle className="w-6 h-6 text-white" />
             </Link>
             <Link to="/profile" className="tv-focusable w-11 h-11 bg-devotion-gold/10 backdrop-blur-xl rounded-2xl border border-devotion-gold/30 flex items-center justify-center shadow-2xl active:scale-90 transition-all">
                <User className="w-5 h-5 text-devotion-gold" />
             </Link>
          </div>
        </div>
      </div>

      {/* Comment Drawer Sheet */}
      {expandedCommentReel && (
        <>
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={() => setExpandedCommentReel(null)} />
          <div className="fixed bottom-0 left-0 w-full md:max-w-[420px] md:left-1/2 md:-translate-x-1/2 bg-[#0A121E] rounded-t-[3rem] z-[210] flex flex-col h-[80vh] animate-in slide-in-from-bottom duration-500 shadow-[0_-30px_100px_rgba(0,0,0,1)] border-t border-white/5">
            <div className="flex justify-center pt-4 pb-2"><div className="w-12 h-1.5 bg-white/10 rounded-full" /></div>
            
            <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
               <h3 className="text-xs font-black text-devotion-gold uppercase tracking-[0.4em]">Spiritual Reflections</h3>
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{reels.find(r => String(r._id || r.id) === expandedCommentReel)?.comments?.length || 0} Thoughts</span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
               {reels.find(r => String(r._id || r.id) === expandedCommentReel)?.comments?.map((comment, i) => (
                  <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                     <div className="w-10 h-10 rounded-xl bg-devotion-gold/10 flex items-center justify-center border border-devotion-gold/20 flex-shrink-0">
                        <span className="text-devotion-gold font-black text-xs">{(comment.userName || 'D').charAt(0)}</span>
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                           <p className="text-[10px] font-black text-white uppercase tracking-wider">{comment.userName || 'Devotee'}</p>
                           {user && (user.role === 'admin' || String(comment.userId) === String(user.id || user._id)) && (
                              <button onClick={() => handleDeleteComment(expandedCommentReel, comment._id)} className="text-[8px] font-black text-red-500/60 uppercase hover:text-red-500">Remove</button>
                           )}
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed font-serif italic">{comment.text}</p>
                     </div>
                  </div>
               ))}
               {(!reels.find(r => String(r._id || r.id) === expandedCommentReel)?.comments?.length) && (
                  <div className="text-center py-20 opacity-30">
                     <Music className="w-12 h-12 mx-auto mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-widest">No reflections yet. Be the first to share.</p>
                  </div>
               )}
            </div>

            {/* Comment Input */}
            <div className="p-6 bg-[#06101E] border-t border-white/5 pb-safe">
               <div className="relative flex items-center gap-3">
                  <input
                    type="text"
                    value={commentInputs[expandedCommentReel] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [expandedCommentReel]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(expandedCommentReel)}
                    placeholder="Share your divine thought..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/20 focus:border-devotion-gold outline-none transition-all"
                  />
                  <button 
                    onClick={() => handleCommentSubmit(expandedCommentReel)}
                    disabled={submittingCommentId === expandedCommentReel}
                    className="w-12 h-12 rounded-2xl bg-devotion-gold text-[#0A121E] flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50"
                  >
                    <PlusCircle className={`w-6 h-6 ${submittingCommentId === expandedCommentReel ? 'animate-spin' : ''}`} />
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
