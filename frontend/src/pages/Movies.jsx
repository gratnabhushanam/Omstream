import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Star, Sparkles, Heart, Search, Mic, Lock, Volume2, VolumeX, ArrowLeft, Film, Compass, Flame } from 'lucide-react';
import MediaPlayerHLS from '../components/MediaPlayerHLS';

export default function Movies() {
  const location = useLocation();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/movies')
      .then((res) => setMovies(Array.isArray(res.data) ? res.data : []))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  const heroMovies = movies.slice(0, 4);

  useEffect(() => {
    if (heroMovies.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroMovies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroMovies.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4FACFE] to-[#00F2FE]">
        <div className="animate-spin rounded-full h-20 w-20 border-t-8 border-white border-dashed"></div>
      </div>
    );
  }

  const categories = [
    { title: 'Trending Now', color: 'from-[#FF6B6B] to-[#FF8E8B]', icon: <Flame className="w-6 h-6 text-white" /> },
    { title: 'Divine Epics', color: 'from-[#4FACFE] to-[#00F2FE]', icon: <Sparkles className="w-6 h-6 text-white" /> },
    { title: 'Action & Adventure', color: 'from-[#FA709A] to-[#FEE140]', icon: <Compass className="w-6 h-6 text-white" /> },
    { title: 'Top Rated', color: 'from-[#667EEA] to-[#764BA2]', icon: <Star className="w-6 h-6 text-white" /> },
  ];

  const featuredMovie = heroMovies[heroIndex];
  const extractYoutubeId = (url) => { if (!url) return null; const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/); return match ? match[1] : null; };
  const featuredYtId = featuredMovie ? extractYoutubeId(featuredMovie.videoUrl || featuredMovie.youtubeUrl || featuredMovie.url || '') : null;
  const featuredThumbUrl = featuredMovie ? (featuredMovie.thumbnail || featuredMovie.thumbnailUrl || (featuredYtId ? `https://img.youtube.com/vi/${featuredYtId}/maxresdefault.jpg` : '/scene-krishna.svg')) : '';

  return (
    <div className="min-h-[100dvh] bg-[#F2F7FF] text-[#2D3748] overflow-x-hidden font-['Nunito',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .movies-nav { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .bubbly-button { transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .bubbly-button:hover { transform: scale(1.1) rotate(-3deg); }
        .bubbly-button:active { transform: scale(0.9); }
      `}</style>

      {/* Vibrant Movies Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'movies-nav py-3' : 'bg-transparent py-6'} px-6 md:px-12 flex items-center justify-between`}>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/home')} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center bubbly-button text-[#4FACFE]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#4FACFE] via-[#00F2FE] to-[#667EEA] drop-shadow-sm flex items-center gap-2">
            <Film className="w-8 h-8 text-[#4FACFE]" /> Divine Cinema
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-white rounded-full px-5 py-3 shadow-[0_5px_15px_rgba(0,0,0,0.08)] border-4 border-[#F2F7FF] focus-within:border-[#FA709A] transition-all">
            <Search className="w-5 h-5 text-[#A0AEC0]" />
            <input type="text" placeholder="Find movies..." className="bg-transparent border-none outline-none font-bold px-3 w-48 text-[#2D3748] placeholder-[#A0AEC0]" />
            <button className="w-8 h-8 bg-[#FA709A] rounded-full flex items-center justify-center bubbly-button">
              <Mic className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </nav>

      {/* Vibrant Cinematic Hero */}
      {featuredMovie && (
        <div className="relative w-full h-[75vh] md:h-[85vh] flex items-end pb-24 md:pb-32 px-6 md:px-16 pt-32">
          <div className="absolute inset-4 md:inset-8 z-0 rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-8 border-white bg-[#0F1014]">
            {featuredMovie.trailerUrl ? (
              <div className="w-full h-full relative">
                <MediaPlayerHLS
                  url={featuredMovie.trailerUrl}
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
              <img src={featuredThumbUrl} alt={featuredMovie.title} className="w-full h-full object-cover opacity-90" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2D3748] via-transparent to-transparent opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2D3748] via-[#2D3748]/60 to-transparent w-[70%] opacity-90" />
          </div>

          <div className="relative z-10 w-full max-w-4xl space-y-6 md:ml-12 mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white text-[#4FACFE] font-black text-sm uppercase tracking-widest shadow-[0_10px_20px_rgba(79,172,254,0.3)] animate-bounce border-2 border-[#4FACFE]/20">
              <Star className="w-5 h-5 fill-[#FEE140] text-[#FEE140]" /> 
              Blockbuster Hit
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-black leading-[0.9] text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
              {featuredMovie.title}
            </h1>
            
            <p className="text-lg md:text-2xl text-white line-clamp-2 max-w-2xl font-bold drop-shadow-md">
              {featuredMovie.desc || featuredMovie.description || 'Experience the ultimate cinematic journey through divine worlds!'}
            </p>

            <div className="flex items-center gap-5 pt-4">
              <button 
                onClick={() => setSelectedMovie(featuredMovie)}
                className="flex items-center gap-4 bg-gradient-to-r from-[#4FACFE] to-[#00F2FE] text-white px-10 py-5 rounded-full font-black text-xl tv:text-2xl bubbly-button shadow-[0_15px_30px_rgba(79,172,254,0.4)] border-4 border-white"
              >
                <Play className="w-8 h-8 fill-current" /> PLAY NOW!
              </button>
              <button 
                className="flex items-center gap-3 bg-white text-[#FA709A] px-8 py-5 rounded-full font-black text-xl tv:text-2xl bubbly-button shadow-xl border-4 border-[#FA709A]/20"
              >
                <Heart className="w-8 h-8 fill-current" /> Save
              </button>
            </div>
          </div>

          <div className="absolute bottom-16 right-20 flex gap-3 z-20">
            {heroMovies.map((_, i) => (
              <div key={i} className={`h-3 rounded-full transition-all duration-500 ${i === heroIndex ? 'w-10 bg-[#4FACFE] shadow-[0_0_15px_rgba(79,172,254,0.8)]' : 'w-3 bg-white/50'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Colorful Category Rows */}
      <div className="relative z-10 pb-32">
        {categories.map((cat, index) => (
          <MoviesRow 
            key={cat.title} 
            category={cat} 
            movies={movies} 
            onSelect={setSelectedMovie} 
            index={index}
          />
        ))}

        {movies.length === 0 && (
          <div className="text-center py-20 bg-white/50 rounded-[3rem] mx-6 border-4 border-dashed border-[#4FACFE]">
            <Film className="w-20 h-20 text-[#4FACFE] mx-auto mb-6 animate-pulse" />
            <p className="text-3xl font-black text-[#4FACFE]">Loading blockbuster movies...</p>
          </div>
        )}
      </div>

      {/* Disney-style Video Modal for Movies */}
      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} navigate={navigate} />
      )}
    </div>
  );
}

function MoviesRow({ category, movies, onSelect }) {
  const scrollRef = useRef(null);
  const rowMovies = [...movies].sort(() => 0.5 - Math.random()); // Shuffle for demo

  return (
    <div className="mb-16">
      <div className="px-6 md:px-16 mb-6 flex items-center justify-between">
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r ${category.color} text-white shadow-lg`}>
          {category.icon || <Film className="w-6 h-6" />}
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider">
            {category.title}
          </h2>
        </div>
      </div>
      
      <div className="relative group/row">
        <div ref={scrollRef} className="flex overflow-x-auto hide-scrollbar px-6 md:px-16 gap-6 py-6 snap-x snap-mandatory">
          {rowMovies.map((movie) => (
            <div key={movie._id || movie.id} className="snap-start shrink-0">
              <MovieCard movie={movie} onSelect={onSelect} colorClass={category.color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MovieCard({ movie, onSelect, colorClass }) {
  const extractYoutubeId = (url) => { if (!url) return null; const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/); return match ? match[1] : null; };
  const ytId = extractYoutubeId(movie.videoUrl || movie.youtubeUrl || movie.url || '');
  const thumbUrl = movie.thumbnail || movie.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '/scene-krishna.svg');

  return (
    <div
      className={`relative w-[280px] h-[320px] md:w-[320px] md:h-[360px] rounded-[2.5rem] overflow-hidden cursor-pointer bg-white shadow-[0_15px_35px_rgba(0,0,0,0.08)] border-4 border-transparent hover:border-white transition-all duration-300 bubbly-button group`}
      onClick={() => onSelect(movie)}
    >
      <div className="absolute top-0 inset-x-0 h-[60%]">
        <img src={thumbUrl} alt={movie.title} className="w-full h-full object-cover rounded-b-[2rem]" />
        <div className={`absolute top-4 left-4 px-3 py-1 bg-gradient-to-r ${colorClass} text-white font-black text-[10px] rounded-full uppercase tracking-widest shadow-md border-2 border-white`}>
          {movie.duration ? `${movie.duration} MINS` : 'FEATURE'}
        </div>
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-b-[2rem]">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
            <Play className="w-8 h-8 text-[#4FACFE] ml-1 fill-current" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-[40%] p-6 flex flex-col justify-center items-center text-center bg-white">
        <h3 className="font-black text-xl text-[#2D3748] line-clamp-2 leading-tight mb-2 group-hover:text-[#4FACFE] transition-colors">{movie.title}</h3>
        <p className="text-sm font-bold text-[#A0AEC0] uppercase tracking-widest bg-[#F2F7FF] px-4 py-1 rounded-full">
          {movie.genre || 'Action & Drama'}
        </p>
      </div>
    </div>
  );
}

function MovieModal({ movie, onClose, navigate }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#0F1014]/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-white rounded-[3rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] z-10 flex flex-col max-h-[95vh] border-8 border-white">
        
        <button onClick={onClose} className="absolute top-6 right-6 z-50 w-12 h-12 bg-[#FF6B6B] rounded-full flex items-center justify-center bubbly-button text-white shadow-xl border-4 border-white">
          <X className="w-6 h-6" />
        </button>

        <div className="w-full aspect-video bg-black rounded-b-[2rem] overflow-hidden shadow-xl relative z-20">
          <MediaPlayerHLS
            url={movie.trailerUrl || movie.videoUrl || movie.youtubeUrl || movie.url}
            title={movie.title}
            className="w-full h-full"
            autoPlay={true}
            controls={true}
          />
        </div>

        <div className="p-8 md:p-10 overflow-y-auto hide-scrollbar bg-gradient-to-br from-[#F2F7FF] to-[#E2E8F0]">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#4FACFE] text-white px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest shadow-md">
                <Star className="w-4 h-4 fill-current" /> Cinematic Masterpiece
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#2D3748] leading-tight">{movie.title}</h2>
              <p className="text-lg text-[#718096] font-bold leading-relaxed">
                {movie.desc || movie.description || 'Embark on a spectacular cinematic journey. This premium feature presentation combines breathtaking visuals with an immersive storyline.'}
              </p>
            </div>
            
            <div className="w-full md:w-auto flex flex-col gap-4">
              <button 
                onClick={() => { /* Play full movie logic */ }} 
                className="bg-gradient-to-r from-[#4FACFE] to-[#00F2FE] text-white px-8 py-5 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-[0_10px_20px_rgba(79,172,254,0.4)] bubbly-button flex items-center justify-center gap-3 border-4 border-white"
              >
                <Play className="w-6 h-6 fill-current" /> Watch Full Movie
              </button>
              <button className="bg-white text-[#FA709A] px-8 py-5 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-lg bubbly-button flex items-center justify-center gap-3 border-4 border-[#FA709A]/20">
                <Heart className="w-6 h-6 fill-current" /> Add to Watchlist
              </button>
            </div>
          </div>
          
          {movie.genre && (
            <div className="mt-10 bg-white rounded-[2rem] p-8 shadow-md border-2 border-[#4FACFE]/30 text-center flex flex-col md:flex-row justify-between items-center">
              <div>
                 <h3 className="text-xl font-black text-[#A0AEC0] uppercase tracking-widest mb-1">Genre</h3>
                 <p className="text-2xl font-bold text-[#2D3748]">{movie.genre}</p>
              </div>
              <div>
                 <h3 className="text-xl font-black text-[#A0AEC0] uppercase tracking-widest mb-1">Release Year</h3>
                 <p className="text-2xl font-bold text-[#2D3748]">{movie.releaseYear || '2025'}</p>
              </div>
              <div>
                 <h3 className="text-xl font-black text-[#A0AEC0] uppercase tracking-widest mb-1">Duration</h3>
                 <p className="text-2xl font-bold text-[#2D3748]">{movie.duration || '120'} mins</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
