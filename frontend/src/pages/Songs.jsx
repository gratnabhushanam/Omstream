import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Heart, Search, Download } from 'lucide-react';
import ReactPlayer from 'react-player';
import axios from 'axios';

import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

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
        <span className="text-xs font-bold text-gray-500 tracking-widest min-w-[30px]">{song.duration || 'Playing'}</span>
      </div>
    </div>
  );
});

export default function Songs() {
  const { language } = useLanguage();
  const { user, setUser } = useAuth();
  const [songs, setSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const playerRef = useRef(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/songs');
        if (data && data.length > 0) {
          setSongs(data);
          setCurrentSongIndex(0);
        } else {
          setSongs([]);
        }
      } catch (error) {
        console.error('Error fetching songs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, []);


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

  const currentSong = songs[currentSongIndex] || null;

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (songs.length === 0) return;
    setCurrentSongIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (songs.length === 0) return;
    setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  };

  const handleProgress = (state) => {
    setProgress(state.played * 100);
    const mins = Math.floor(state.playedSeconds / 60);
    const secs = Math.floor(state.playedSeconds % 60);
    setCurrentTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
  };

  const handleDuration = (dur) => {
    const mins = Math.floor(dur / 60);
    const secs = Math.floor(dur % 60);
    setDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
  };

  const handleProgressClick = (e) => {
    if (!playerRef.current) return;
    const bar = e.currentTarget;
    const clickX = e.clientX - bar.getBoundingClientRect().left;
    const percentage = clickX / bar.offsetWidth;
    playerRef.current.seekTo(percentage);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative bg-[#06101E] overflow-hidden flex flex-col items-center">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.05),transparent_60%)]"></div>
      
      <div className="w-full max-w-5xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Side: Music Player */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full bg-glass-premium backdrop-blur-3xl rounded-[2.5rem] border border-devotion-gold/20 p-6 sm:p-8 shadow-2xl flex flex-col items-center animate-slide-up">
            <h1 className="text-2xl font-serif font-black uppercase tracking-widest text-devotion-gold mb-6 text-center">
              Divine Player
            </h1>
            
            {currentSong ? (
              <>
                <div className={`relative w-48 h-48 sm:w-64 sm:h-64 rounded-2xl border-4 border-devotion-gold/30 shadow-[0_0_40px_rgba(255,215,0,0.2)] overflow-hidden mb-8 transition-all duration-700 ${isPlaying ? 'scale-105 shadow-[0_0_60px_rgba(255,215,0,0.4)]' : ''}`}>
                  <img 
                    src={currentSong.cover} 
                    alt={currentSong.title} 
                    className={`w-full h-full object-contain bg-black ${isPlaying ? 'scale-105 transition-transform duration-[20s]' : 'scale-100'}`} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

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

                <div className="flex items-center justify-center gap-6 w-full">
                  <button tabIndex="0" onClick={(e) => handleLike(e, currentSong._id)} className={`tv-focusable focus:ring-2 focus:ring-devotion-gold rounded-full text-gray-400 hover:text-red-500 transition-colors p-2 active:scale-90 ${user?.likedSongs?.includes(currentSong._id) ? 'text-red-500' : ''}`}>
                    <Heart className={`w-5 h-5 ${user?.likedSongs?.includes(currentSong._id) ? 'fill-current' : ''}`} />
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

                  <button tabIndex="0" onClick={toggleMute} className="tv-focusable focus:ring-2 focus:ring-devotion-gold rounded-full text-gray-400 hover:text-white transition-colors p-2 active:scale-90 hidden sm:block">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>

                <div className="fixed bottom-0 right-0 overflow-hidden pointer-events-none -z-50" style={{ width: '2px', height: '2px', opacity: 0.01 }}>
                  <ReactPlayer
                    ref={playerRef}
                    url={currentSong.url}
                    playing={isPlaying}
                    muted={isMuted}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onEnded={handleNext}
                    width="100%"
                    height="100%"
                    playsinline
                    progressInterval={1000}
                    config={{
                      file: {
                        forceVideo: true,
                        attributes: {
                          controlsList: 'nodownload'
                        }
                      },
                      youtube: {
                        playerVars: {
                          autoplay: 1,
                          controls: 0,
                          modestbranding: 1,
                          playsinline: 1,
                          origin: window.location.origin
                        }
                      }
                    }}
                  />
                </div>
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
        <div className="lg:col-span-7 flex flex-col">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-serif font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                Devotional Playlist
              </h2>
              <span className="text-devotion-gold text-sm font-bold tracking-widest uppercase">{songs.length} Tracks</span>
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

          <div className="flex flex-col gap-3 h-[500px] overflow-y-auto custom-scrollbar pr-2 pb-10">
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
