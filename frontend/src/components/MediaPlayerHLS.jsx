import React, { useEffect, useRef, useState } from 'react';
import { getYoutubeEmbedUrl, getYoutubeVideoId, isYoutubeUrl } from '../utils/media';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react';

function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/videos\/(\w+)/);
  if (match) return match[1];
  try {
    const params = new URL(url, window.location.origin).searchParams;
    return params.get('videoId');
  } catch { return null; }
}

export default function MediaPlayer({
  url, hlsUrl, title, thumbnail, className = '', youtubeParams = '',
  autoPlay = false, shouldPlay, muted = false, loop = false,
  controls = true, playsInline = true, onEnded, instagramMode = false,
  playLimitSeconds = null, preload = "metadata",
}) {
  const [secureHlsUrl, setSecureHlsUrl] = useState('');
  const [secureVideoUrl, setSecureVideoUrl] = useState('');
  const [loadingToken, setLoadingToken] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [hlsFallbackActive, setHlsFallbackActive] = useState(false);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const getAbsoluteUrl = (inputUrl) => {
    if (!inputUrl) return inputUrl;
    if (inputUrl.startsWith('/uploads/') || inputUrl.startsWith('/api/')) {
      const isProd = import.meta.env.MODE === 'production';
      const baseUrl = isProd ? 'https://gitawisdom.onrender.com' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888');
      return `${baseUrl}${inputUrl}`;
    }
    return inputUrl;
  };

  const cdnHlsUrl = getAbsoluteUrl(hlsUrl || '');
  const cdnVideoUrl = getAbsoluteUrl(url || '');
  const effectiveShouldPlay = typeof shouldPlay === 'boolean' ? shouldPlay : autoPlay;

  // Token Fetching Logic...
  useEffect(() => {
    let cancelled = false;
    async function fetchToken() {
      if (!cdnHlsUrl && !cdnVideoUrl) return;
      const isLocalUrl = (u) => u && (u.includes('/uploads/') || u.includes('/api/'));
      const needsToken = isLocalUrl(cdnHlsUrl) || isLocalUrl(cdnVideoUrl);
      
      if (!needsToken) {
        if (!cancelled) { setSecureHlsUrl(cdnHlsUrl); setSecureVideoUrl(cdnVideoUrl); }
        return;
      }
      
      setLoadingToken(true);
      try {
        const videoId = extractVideoId(cdnHlsUrl) || extractVideoId(cdnVideoUrl) || 'anonymous';
        const absoluteTokenUrl = getAbsoluteUrl(`/api/videos/hls-token?videoId=${videoId}`);
        const res = await fetch(absoluteTokenUrl);
        const data = await res.json();
        if (data?.token) {
          if (cdnHlsUrl && isLocalUrl(cdnHlsUrl)) {
            const hlsUrlObj = new URL(cdnHlsUrl, window.location.origin);
            hlsUrlObj.searchParams.set('token', data.token);
            if (!cancelled) setSecureHlsUrl(hlsUrlObj.toString());
          } else { if (!cancelled) setSecureHlsUrl(cdnHlsUrl); }
          
          if (cdnVideoUrl && !isYoutubeUrl(cdnVideoUrl) && isLocalUrl(cdnVideoUrl)) {
            const videoUrlObj = new URL(cdnVideoUrl, window.location.origin);
            videoUrlObj.searchParams.set('token', data.token);
            if (!cancelled) setSecureVideoUrl(videoUrlObj.toString());
          } else { if (!cancelled) setSecureVideoUrl(cdnVideoUrl); }
        }
      } catch {
        if (!cancelled) { setSecureHlsUrl(cdnHlsUrl); setSecureVideoUrl(cdnVideoUrl); }
      } finally { if (!cancelled) setLoadingToken(false); }
    }
    fetchToken();
    return () => { cancelled = true; };
  }, [cdnHlsUrl, cdnVideoUrl]);

  // HLS Setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || loadingToken) return;
    const sourceToUse = hlsFallbackActive ? (secureVideoUrl || cdnVideoUrl) : (secureHlsUrl || secureVideoUrl || cdnVideoUrl);
    if (!sourceToUse) return;
    let hlsInstance = null;
    if (sourceToUse.includes('.m3u8')) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = sourceToUse; }
      else if (Hls && Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsInstance.loadSource(sourceToUse);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) setHlsFallbackActive(true); });
      } else { video.src = sourceToUse; }
    } else { video.src = sourceToUse; }
    return () => { if (hlsInstance) hlsInstance.destroy(); };
  }, [secureHlsUrl, secureVideoUrl, loadingToken, hlsFallbackActive, cdnVideoUrl]);

  // Video Events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const up = () => { setProgress(video.currentTime || 0); if (playLimitSeconds && video.currentTime >= playLimitSeconds) video.pause(); };
    const ud = () => setDuration(video.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    
    video.addEventListener('timeupdate', up);
    video.addEventListener('durationchange', ud);
    video.addEventListener('loadedmetadata', ud);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    
    return () => {
      video.removeEventListener('timeupdate', up);
      video.removeEventListener('durationchange', ud);
      video.removeEventListener('loadedmetadata', ud);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [playLimitSeconds]);

  // Auto-play logic
  useEffect(() => {
    const v = videoRef.current;
    if (!v || loadingToken) return;
    if (effectiveShouldPlay) {
      v.play().catch(() => { v.muted = true; setIsMuted(true); v.play().catch(() => {}); });
    } else { v.pause(); }
  }, [effectiveShouldPlay, loadingToken]);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isYoutubeUrl(secureVideoUrl || cdnVideoUrl) && controls) {
        if (e.key === ' ') {
          e.preventDefault();
          togglePlay();
        } else if (e.key === 'ArrowRight') {
          skip(10);
        } else if (e.key === 'ArrowLeft') {
          skip(-10);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [secureVideoUrl, cdnVideoUrl, controls]);

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) setShowControls(false);
  };

  // Custom Player Actions
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play();
    else videoRef.current.pause();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleVolumeChange = (e) => {
    if (!videoRef.current) return;
    const vol = parseFloat(e.target.value);
    videoRef.current.volume = vol;
    setVolume(vol);
    if (vol === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const skip = (amount) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += amount;
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = parseFloat(e.target.value);
  };

  const toggleFullscreen = async () => {
    const t = containerRef.current;
    if (!t) return;
    try {
      if (isFullscreen) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        if (t.requestFullscreen) await t.requestFullscreen();
        else if (t.webkitRequestFullscreen) t.webkitRequestFullscreen();
      }
    } catch {}
  };

  const formatTime = (seconds) => {
    const d = Number(seconds);
    const h = Math.floor(d / 3600);
    const m = Math.floor(d % 3600 / 60);
    const s = Math.floor(d % 3600 % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isYoutubeUrl(secureVideoUrl || cdnVideoUrl)) {
    const embedUrl = getYoutubeEmbedUrl(secureVideoUrl || cdnVideoUrl);
    const videoId = getYoutubeVideoId(cdnVideoUrl);
    const params = new URLSearchParams(youtubeParams);
    if (loop && videoId && !params.has('playlist')) params.set('playlist', videoId);
    
    if (effectiveShouldPlay) params.set('autoplay', '1');
    if (muted || (effectiveShouldPlay && instagramMode)) params.set('mute', '1');
    params.set('playsinline', '1');
    params.set('controls', controls ? '1' : '0');

    return (
      <div ref={containerRef} className={`relative bg-black overflow-hidden ${className}`}>
        <iframe className="w-full h-full absolute inset-0" src={`${embedUrl}?${params.toString()}`} title={title} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div 
      ref={containerRef} 
      className={`relative bg-black overflow-hidden group flex items-center justify-center ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => { if (instagramMode) togglePlay(); }}
    >
      {loadingToken && (
        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
           <div className="w-12 h-12 border-4 border-devotion-gold/30 border-t-devotion-gold rounded-full animate-spin"></div>
        </div>
      )}

      {/* HTML5 Video */}
      <video
        ref={videoRef}
        className={`w-full h-full ${instagramMode ? 'object-cover' : 'object-contain'} transition-opacity duration-700 cursor-pointer ${loadingToken ? 'opacity-0' : 'opacity-100'}`}
        crossOrigin="anonymous"
        muted={isMuted}
        loop={loop}
        poster={thumbnail}
        playsInline={playsInline}
        preload={preload}
        onEnded={onEnded}
        onClick={!instagramMode ? togglePlay : undefined}
        // Force native controls only on iOS because custom full-screen APIs are restricted by Apple
        controls={isIOS && controls} 
      />

      {/* Custom Netflix/JioHotstar UI Overlay */}
      {!instagramMode && controls && !isIOS && (
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
          
          {/* Top Title Overlay */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent flex items-center px-6">
             <h2 className="text-white font-bold text-lg md:text-xl drop-shadow-md truncate">{title}</h2>
          </div>

          {/* Large Center Play Button when Paused */}
          {!isPlaying && !loadingToken && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-auto" onClick={togglePlay}>
               <div className="w-20 h-20 rounded-full bg-devotion-gold/20 backdrop-blur-md border border-devotion-gold/50 flex items-center justify-center text-devotion-gold hover:scale-110 transition-transform cursor-pointer shadow-[0_0_50px_rgba(255,215,0,0.2)]">
                  <Play className="w-10 h-10 ml-2 fill-current" />
               </div>
            </div>
          )}

          {/* Bottom Control Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-4 px-6 pointer-events-auto">
            
            {/* Scrubber */}
            <div className="flex items-center gap-4 mb-2 group/scrubber cursor-pointer">
              <span className="text-white font-mono text-xs md:text-sm">{formatTime(progress)}</span>
              <div className="relative flex-1 h-1 md:h-1.5 bg-white/30 rounded-full group-hover/scrubber:h-2 md:group-hover/scrubber:h-2.5 transition-all">
                {/* Buffered could be added here */}
                <div 
                  className="absolute top-0 left-0 h-full bg-devotion-gold rounded-full relative" 
                  style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
                >
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full scale-0 group-hover/scrubber:scale-100 transition-transform shadow-lg"></div>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={duration || 100} 
                  step="0.1" 
                  value={progress} 
                  onChange={handleSeek} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
              </div>
              <span className="text-white/70 font-mono text-xs md:text-sm">{formatTime(duration)}</span>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4 md:gap-6">
                 <button onClick={togglePlay} className="hover:text-devotion-gold transition-colors p-1">
                   {isPlaying ? <Pause className="w-6 h-6 md:w-8 md:h-8 fill-current" /> : <Play className="w-6 h-6 md:w-8 md:h-8 fill-current" />}
                 </button>
                 <button onClick={() => skip(-10)} className="hover:text-devotion-gold transition-colors p-1">
                   <SkipBack className="w-5 h-5 md:w-6 md:h-6" />
                 </button>
                 <button onClick={() => skip(10)} className="hover:text-devotion-gold transition-colors p-1">
                   <SkipForward className="w-5 h-5 md:w-6 md:h-6" />
                 </button>
                 
                 <div className="group/volume flex items-center gap-2 relative ml-4">
                   <button onClick={toggleMute} className="hover:text-devotion-gold transition-colors p-1 z-10">
                     {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6" />}
                   </button>
                   <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 flex items-center">
                     <input 
                       type="range" 
                       min="0" max="1" step="0.05" 
                       value={isMuted ? 0 : volume} 
                       onChange={handleVolumeChange} 
                       className="w-full accent-devotion-gold cursor-pointer"
                     />
                   </div>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="border border-white/30 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70">HD</div>
                 <button onClick={toggleFullscreen} className="hover:text-devotion-gold transition-colors p-1">
                   {isFullscreen ? <Minimize className="w-5 h-5 md:w-6 md:h-6" /> : <Maximize className="w-5 h-5 md:w-6 md:h-6" />}
                 </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Instagram/Reels Mode Minimal Scrubber */}
      {instagramMode && duration > 0 && (
         <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20 group-hover:h-3 transition-all">
           <div className="h-full bg-devotion-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]" style={{ width: `${(progress / duration) * 100}%` }} />
           <input type="range" min={0} max={duration} step="0.01" value={progress} onChange={e => { if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
         </div>
      )}
    </div>
  );
}
