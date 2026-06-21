import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Heart, Search, Download, Shuffle, Repeat, Repeat1, AlertCircle } from 'lucide-react';
import axios from 'axios';

import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ENV } from '../config/env';
import { socket } from '../services/socket';

// Resolve audio URL: prefix backend origin for relative /uploads/ paths
const BACKEND_ORIGIN = ENV.API_BASE_URL || window.location.origin;
const resolveAudioUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/uploads/') || url.startsWith('/api/')) {
    return `${BACKEND_ORIGIN}${url}`;
  }
  return url;
};

const SongItem = React.memo(({ song, isSelected, actualIndex, onPlay, onLike, isLiked }) => {
  return (
    <div 
      tabIndex="0"
      onClick={() => onPlay(actualIndex)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(actualIndex);
        }
      }}
      className={`group tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold flex items-center gap-4 p-3 sm:p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
        isSelected 
          ? 'bg-gradient-to-r from-devotion-gold/20 to-transparent border-devotion-gold/40 shadow-[0_0_15px_rgba(255,215,0,0.1)]' 
          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden relative flex-shrink-0">
        <img src={song.cover} alt={song.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        {isSelected && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="flex items-end gap-1 h-4">
              <div className="w-1 bg-devotion-gold animate-music-bar-1 h-full rounded-full"></div>
              <div className="w-1 bg-devotion-gold animate-music-bar-2 h-3/4 rounded-full"></div>
              <div className="w-1 bg-devotion-gold animate-music-bar-3 h-full rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`text-base sm:text-lg font-bold truncate ${isSelected ? 'text-devotion-gold' : 'text-white group-hover:text-devotion-gold transition-colors'}`}>
          {song.title}
        </h3>
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium truncate mt-0.5">
          {song.artist}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-4 text-right pr-2">
        <button onClick={(e) => { e.stopPropagation(); window.open(song.url, '_blank'); }} className="active:scale-90 transition-all text-gray-500 hover:text-devotion-gold opacity-0 group-hover:opacity-100" title="Download for Offline">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={(e) => onLike(e, song._id)} className={`active:scale-90 transition-all ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100'}`}>
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>
        <span className="text-xs font-bold text-gray-500 tracking-widest min-w-[30px]">{song.duration || '—'}</span>
      </div>
    </div>
  );
});

export default function Songs() {
  const { language } = useLanguage();
  const { user, setUser } = useAuth();
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('all'); // 'none', 'all', 'one'
  const [audioError, setAudioError] = useState(false);
  
  // Refs for both audio types
  const audioRef = useRef(null);   // Native <audio> for direct files
  const ytRef    = useRef(null);   // iframe for YouTube
  const ytReady  = useRef(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let allSongs = [];
        let allPlaylists = [];
        try {
          const [songsRes, playlistsRes] = await Promise.all([
            axios.get('/api/songs?_t=' + Date.now()),
            axios.get('/api/playlists?_t=' + Date.now())
          ]);
          if (songsRes.data && songsRes.data.length > 0) {
            allSongs = songsRes.data;
            localStorage.setItem('gita_songs', JSON.stringify(allSongs));
          }
          if (playlistsRes.data && playlistsRes.data.length > 0) {
            allPlaylists = playlistsRes.data;
          }
        } catch (apiErr) {
          console.error('Network fetch failed, trying local storage', apiErr);
          const localSongs = localStorage.getItem('gita_songs');
          if (localSongs) allSongs = JSON.parse(localSongs);
          else throw apiErr;
        }

        setSongs(allSongs);
        setPlaylists(allPlaylists);
        if (allSongs.length > 0) {
          setCurrentSongIndex(0);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const handleContentUpdate = (data) => {
      if (data && data.type === 'songs') {
        console.log('[SOCKET] Songs updated, refreshing list...');
        fetchData();
      }
    };

    socket.on('content_updated', handleContentUpdate);
    return () => {
      socket.off('content_updated', handleContentUpdate);
    };
  }, []);

  // Reset player state whenever song changes
  useEffect(() => {
    setCurrentTime('0:00');
    setDuration('0:00');
    setProgress(0);
    setAudioError(false);
    ytReady.current = false;
  }, [currentSongIndex]);

  const currentSong = songs[currentSongIndex] || null;
  const isYouTube = !!(
    currentSong?.url?.includes('youtube.com') ||
    currentSong?.url?.includes('youtu.be')
  );

  // Extract YouTube video ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const ytId = getYouTubeId(currentSong?.url);

  // ─── Native Audio Control ───────────────────────────────────────────────
  useEffect(() => {
    const el = audioRef.current;
    if (!el || isYouTube) return;
    el.muted = isMuted;
    if (isPlaying) {
      const p = el.play();
      if (p) p.catch(err => console.warn('audio.play():', err));
    } else {
      el.pause();
    }
  }, [isPlaying, isYouTube, isMuted]);

  // When song changes, reset audio src and auto-play if needed
  useEffect(() => {
    const el = audioRef.current;
    if (!el || isYouTube) return;
    el.load(); // reload with new src
    if (isPlaying) {
      const p = el.play();
      if (p) p.catch(err => console.warn('audio.play() on song change:', err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSongIndex, isYouTube]);

  // ─── YouTube IFrame API Control ─────────────────────────────────────────
  useEffect(() => {
    if (!isYouTube || !ytId) return;

    // Load YT IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }

    let player = null;
    let progressInterval = null;

    const initPlayer = () => {
      if (ytRef.current && !ytRef.current.__ytPlayer) {
        player = new window.YT.Player(ytRef.current, {
          videoId: ytId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            iv_load_policy: 3,
          },
          events: {
            onReady: (e) => {
              ytReady.current = true;
              ytRef.current.__ytPlayer = e.target;
              e.target.setVolume(isMuted ? 0 : 100);
              if (isPlaying) e.target.playVideo();

              // Poll progress
              progressInterval = setInterval(() => {
                try {
                  const ct = e.target.getCurrentTime?.() || 0;
                  const dur = e.target.getDuration?.() || 0;
                  if (dur > 0) {
                    setProgress((ct / dur) * 100);
                    const fm = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
                    setCurrentTime(fm(ct));
                    setDuration(fm(dur));
                  }
                } catch(e) {}
              }, 1000);
            },
            onStateChange: (e) => {
              if (e.data === window.YT.PlayerState.ENDED) {
                handleEnded();
              }
            },
            onError: (e) => console.error('YT Player Error', e.data),
          },
        });
      }
    };

    const waitForYT = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        window.onYouTubeIframeAPIReady = initPlayer;
      }
    };

    waitForYT();

    return () => {
      clearInterval(progressInterval);
      try {
        const p = ytRef.current?.__ytPlayer;
        if (p) { p.stopVideo(); p.destroy(); }
        if (ytRef.current) ytRef.current.__ytPlayer = null;
      } catch(e) {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytId]);

  // Play/pause YouTube player
  useEffect(() => {
    if (!isYouTube) return;
    const p = ytRef.current?.__ytPlayer;
    if (!p || !ytReady.current) return;
    try {
      if (isPlaying) {
        p.setVolume(isMuted ? 0 : 100);
        p.playVideo();
      } else {
        p.pauseVideo();
      }
    } catch(e) {}
  }, [isPlaying, isMuted, isYouTube]);

  const handleLike = async (e, songId) => {
    e.stopPropagation();
    if (!user) return alert('Please login to save songs.');
    try {
      const { data } = await axios.post(`/api/songs/${songId}/like`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUser(prev => ({ ...prev, likedSongs: data.likedSongs }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnded = useCallback(() => {
    if (repeatMode === 'one') {
      if (audioRef.current) audioRef.current.currentTime = 0;
      const p = ytRef.current?.__ytPlayer;
      if (p) { try { p.seekTo(0); p.playVideo(); } catch(e) {} }
      setIsPlaying(true);
    } else {
      setCurrentSongIndex((prev) => {
        if (repeatMode === 'none' && prev === songs.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        if (isShuffle) return Math.floor(Math.random() * songs.length);
        return (prev + 1) % songs.length;
      });
      setIsPlaying(true);
    }
  }, [repeatMode, isShuffle, songs.length]);

  const handleNext = useCallback(() => {
    if (songs.length === 0) return;
    if (isShuffle) {
      setCurrentSongIndex(Math.floor(Math.random() * songs.length));
    } else {
      setCurrentSongIndex((prev) => {
        if (repeatMode === 'none' && prev === songs.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return (prev + 1) % songs.length;
      });
    }
    setIsPlaying(true);
  }, [songs.length, isShuffle, repeatMode]);

  const handlePrev = useCallback(() => {
    if (songs.length === 0) return;
    if (isShuffle) {
      setCurrentSongIndex(Math.floor(Math.random() * songs.length));
    } else {
      setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
    }
    setIsPlaying(true);
  }, [songs.length, isShuffle]);

  const togglePlay = () => setIsPlaying(p => !p);
  const toggleMute = () => setIsMuted(m => !m);

  const handleProgressClick = (e) => {
    const bar = e.currentTarget;
    const pct = (e.clientX - bar.getBoundingClientRect().left) / bar.offsetWidth;
    if (isYouTube) {
      const p = ytRef.current?.__ytPlayer;
      if (p) { try { p.seekTo(pct * (p.getDuration?.() || 0), true); } catch(e) {} }
    } else if (audioRef.current) {
      audioRef.current.currentTime = pct * (audioRef.current.duration || 0);
    }
  };

  // Media session
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentSong.title || 'Divine Track',
        artist: currentSong.artist || 'Omstream',
        album: 'Divine Playlist',
        artwork: [{ src: currentSong.cover, sizes: '512x512', type: 'image/jpeg' }]
      });
      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [currentSong, isPlaying, handleNext, handlePrev]);

  return (
    <div 
      className="min-h-screen px-4 sm:px-6 lg:px-8 relative bg-[#06101E] overflow-x-hidden flex flex-col items-center w-full"
      style={{ paddingTop: '1rem', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.05),transparent_60%)]"></div>
      
      <div className="w-full max-w-5xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12">
        
        {/* Left Side: Music Player */}
        <div className="lg:col-span-5 flex flex-col items-center order-2 lg:order-1 w-full max-w-md mx-auto">
          <div className="w-full bg-glass-premium backdrop-blur-3xl rounded-[2.5rem] border border-devotion-gold/20 p-6 sm:p-8 shadow-2xl flex flex-col items-center animate-slide-up relative z-20">
            <h1 className="text-2xl font-serif font-black uppercase tracking-widest text-devotion-gold mb-6 text-center">
              Divine Player
            </h1>
            
            {currentSong ? (
              <>
                {/* ── Hidden Audio Engines ── */}
                {isYouTube ? (
                  /* YouTube IFrame – completely off-screen but rendered */
                  <div
                    style={{
                      position: 'fixed',
                      top: '-9999px',
                      left: '-9999px',
                      width: '320px',
                      height: '180px',
                      pointerEvents: 'none',
                      zIndex: -1,
                    }}
                  >
                    <div ref={ytRef} />
                  </div>
                ) : (
                  /* Native audio element for MP3 / MP4 / direct URL */
                  <audio
                    ref={audioRef}
                    src={resolveAudioUrl(currentSong.url)}
                    preload="metadata"
                    onTimeUpdate={(e) => {
                      const curr = e.target.currentTime || 0;
                      const dur  = e.target.duration   || 0;
                      if (dur > 0) setProgress((curr / dur) * 100);
                      const fm = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
                      setCurrentTime(fm(curr));
                      if (dur > 0 && !isNaN(dur)) setDuration(fm(dur));
                    }}
                    onLoadedMetadata={(e) => {
                      const dur = e.target.duration;
                      if (dur && !isNaN(dur)) {
                        const fm = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
                        setDuration(fm(dur));
                        setAudioError(false);
                      }
                    }}
                    onEnded={handleEnded}
                    onError={(e) => {
                      console.error('Audio error:', e.target.error, 'URL:', resolveAudioUrl(currentSong.url));
                      setAudioError(true);
                      setIsPlaying(false);
                    }}
                  />
                )}

                {/* ── Album Art Circle ── */}
                <div className={`relative w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-devotion-gold/30 shadow-[0_0_40px_rgba(255,215,0,0.2)] overflow-hidden mb-8 flex-shrink-0 transition-all duration-700 ${isPlaying ? 'scale-105 shadow-[0_0_60px_rgba(255,215,0,0.4)]' : ''}`}>
                  <img
                    src={currentSong.cover}
                    alt={currentSong.title}
                    className={`w-full h-full object-cover transition-all duration-700 ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>

                <div className="text-center mb-8 w-full flex flex-col items-center">
                  <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center mb-3">
                    <Music className="w-4 h-4 text-devotion-gold" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 truncate px-2">{currentSong.title}</h2>
                  <p className="text-devotion-gold/80 text-sm font-medium tracking-wider uppercase">{currentSong.artist}</p>
                </div>

                <div className="w-full mb-8">
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold tracking-widest mb-2">
                    <span>{currentTime}</span>
                    <span>{duration}</span>
                  </div>
                  <div 
                    className="w-full h-2 bg-white/10 rounded-full cursor-pointer relative overflow-hidden group"
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-devotion-gold to-yellow-400 rounded-full transition-all duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(255,255,255,1)]"></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 sm:gap-6 w-full">
                  <button tabIndex="0" onClick={() => setIsShuffle(!isShuffle)} className={`tv-focusable focus:ring-2 focus:ring-devotion-gold rounded-full transition-colors p-2 active:scale-90 ${isShuffle ? 'text-devotion-gold' : 'text-gray-400 hover:text-white'}`}>
                    <Shuffle className="w-5 h-5" />
                  </button>

                  <button tabIndex="0" onClick={handlePrev} className="tv-focusable focus:ring-4 focus:ring-devotion-gold w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 border border-white/10">
                    <SkipBack className="w-5 h-5 fill-current" />
                  </button>
                  
                  <button 
                    tabIndex="0"
                    onClick={togglePlay} 
                    className="tv-focusable focus:ring-4 focus:ring-devotion-gold w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-devotion-gold to-yellow-600 text-[#06101E] shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-105 transition-all active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current translate-x-0.5" />}
                  </button>
                  
                  <button tabIndex="0" onClick={handleNext} className="tv-focusable focus:ring-4 focus:ring-devotion-gold w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 border border-white/10">
                    <SkipForward className="w-5 h-5 fill-current" />
                  </button>

                  <button tabIndex="0" onClick={() => setRepeatMode(prev => prev === 'all' ? 'one' : prev === 'one' ? 'none' : 'all')} className={`tv-focusable focus:ring-2 focus:ring-devotion-gold rounded-full transition-colors p-2 active:scale-90 ${repeatMode !== 'none' ? 'text-devotion-gold' : 'text-gray-400 hover:text-white'}`}>
                    {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                  </button>
                </div>

                {/* Audio error notice */}
                {audioError && !isYouTube && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 rounded-xl px-4 py-2 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Audio unavailable. <a href={resolveAudioUrl(currentSong?.url)} target="_blank" rel="noreferrer" className="underline text-devotion-gold">Open directly</a></span>
                  </div>
                )}

                {/* Mute button */}
                <button tabIndex="0" onClick={toggleMute} className="mt-4 tv-focusable focus:ring-2 focus:ring-devotion-gold rounded-full text-gray-400 hover:text-white transition-colors p-2 active:scale-90">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="text-gray-400 py-10 flex flex-col items-center">
                <Music className="w-10 h-10 mb-4 opacity-50" />
                <p>{loading ? 'Loading divine songs...' : 'No songs available in the database.'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Playlist */}
        <div className="lg:col-span-7 flex flex-col order-1 lg:order-2 w-full">
          {playlists.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Featured Playlists</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {playlists.map(pl => (
                  <div key={pl._id} onClick={() => { setSongs(pl.songs); setCurrentSongIndex(0); }} className="flex-shrink-0 w-32 cursor-pointer group">
                    <div className="w-32 h-32 rounded-xl overflow-hidden mb-2 relative">
                      <img src={pl.coverImage || '/default_playlist.png'} alt={pl.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 bg-devotion-gold rounded-full flex items-center justify-center">
                          <Play className="w-5 h-5 text-black fill-black" />
                        </div>
                      </div>
                    </div>
                    <p className="text-white font-bold text-sm truncate">{pl.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-3xl font-serif font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                Devotional Playlist
              </h2>
              <span className="text-devotion-gold text-xs sm:text-sm font-bold tracking-widest uppercase">{songs.length} Tracks</span>
            </div>
            
            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="Search songs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:border-devotion-gold outline-none"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:gap-3 max-h-[35vh] sm:max-h-none sm:h-[500px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2 pb-4">
            {songs.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artist.toLowerCase().includes(searchQuery.toLowerCase())).map((song) => {
              const actualIndex = songs.findIndex(s => s._id === song._id);
              const isSelected = currentSongIndex === actualIndex;
              return (
                <SongItem 
                  key={song._id} 
                  song={song} 
                  isSelected={isSelected} 
                  actualIndex={actualIndex} 
                  onPlay={(idx) => {
                    setCurrentSongIndex(idx);
                    setIsPlaying(true);
                  }}
                  onLike={handleLike}
                  isLiked={user?.likedSongs?.includes(song._id)}
                />
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
