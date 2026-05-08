import React, { useEffect, useRef, useState } from 'react';
import { getYoutubeEmbedUrl, getYoutubeVideoId, isYoutubeUrl } from '../utils/media';
import Hls from 'hls.js';

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
  const [hlsFallbackActive, setHlsFallbackActive] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const up = () => { setProgress(video.currentTime || 0); if (playLimitSeconds && video.currentTime >= playLimitSeconds) video.pause(); };
    const ud = () => setDuration(video.duration || 0);
    video.addEventListener('timeupdate', up);
    video.addEventListener('durationchange', ud);
    video.addEventListener('loadedmetadata', ud);
    return () => {
      video.removeEventListener('timeupdate', up);
      video.removeEventListener('durationchange', ud);
      video.removeEventListener('loadedmetadata', ud);
    };
  }, [playLimitSeconds]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || loadingToken) return;
    if (effectiveShouldPlay) {
      v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
    } else { v.pause(); }
  }, [effectiveShouldPlay, loadingToken]);

  const toggleFullscreen = async () => {
    const t = containerRef.current || videoRef.current;
    if (!t) return;
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        if (t.requestFullscreen) await t.requestFullscreen();
        else if (t.webkitRequestFullscreen) t.webkitRequestFullscreen();
        else if (videoRef.current?.webkitEnterFullscreen) videoRef.current.webkitEnterFullscreen();
      }
    } catch {}
  };

  if (isYoutubeUrl(secureVideoUrl || cdnVideoUrl)) {
    const embedUrl = getYoutubeEmbedUrl(secureVideoUrl || cdnVideoUrl);
    const videoId = getYoutubeVideoId(cdnVideoUrl);
    const params = new URLSearchParams(youtubeParams);
    if (loop && videoId && !params.has('playlist')) params.set('playlist', videoId);
    
    // Auto-inject playback controls based on props
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

  return (
    <div ref={containerRef} className={`relative bg-black overflow-hidden ${className} flex items-center justify-center`}>
      {loadingToken && (
        <div className="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center gap-2">
           <div className="w-8 h-8 border-2 border-devotion-gold/30 border-t-devotion-gold rounded-full animate-spin"></div>
        </div>
      )}
      <video
        ref={videoRef}
        className={`w-full h-full ${instagramMode ? 'object-cover' : 'object-contain'} transition-opacity duration-700 ${loadingToken ? 'opacity-0' : 'opacity-100'}`}
        crossOrigin="anonymous"
        muted={muted}
        loop={loop}
        poster={thumbnail}
        controls={instagramMode ? false : controls}
        playsInline={playsInline}
        preload={preload}
        onEnded={onEnded}
      />
      {instagramMode && duration > 0 && (
         <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20 group-hover:h-3 transition-all">
           <div className="h-full bg-devotion-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]" style={{ width: `${(progress / duration) * 100}%` }} />
           <input type="range" min={0} max={duration} step="0.01" value={progress} onChange={e => { if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
         </div>
      )}
      {!instagramMode && (
         <button onClick={toggleFullscreen} className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-white/20">⤢</button>
      )}
    </div>
  );
}
