import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Search, Bookmark, History, Settings, Play, Info, 
  ChevronRight, Volume2, Globe, Bell, User, Star, Flame, Award, Heart
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import MediaPlayerHLS from '../components/MediaPlayerHLS';

export default function TvHome() {
  const navigate = useNavigate();
  const { tLabel, language, setLanguage, languages } = useLanguage();
  const { user } = useAuth();

  // Navigation state
  const [isSidebarFocused, setIsSidebarFocused] = useState(false);
  const [sidebarIndex, setSidebarIndex] = useState(0);
  const [activeRow, setActiveRow] = useState(-1); // -2: topbar, -1: hero, 0-5: content rows
  const [activeCol, setActiveCol] = useState(0);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef(null);

  // Menu items for horizontal top bar
  const topMenuItems = [
    { label: 'Home', path: '/home' },
    { label: 'Community', path: '/satsangs' },
    { label: 'Mentor', path: '/mentor' },
    { label: 'Kids', path: '/kids' },
    { label: 'Movies', path: '/movies' },
    { label: 'Songs', path: '/songs' },
    { label: 'Quizzes', path: '/quizzes' },
    { label: 'Daily Sloka', path: '/daily-sloka' },
    { label: 'Library', path: '/stories' },
    { label: 'Admin', path: '/admin', adminOnly: true }
  ].filter(item => !item.adminOnly || user?.role === 'admin');

  // Sidebar items
  const sidebarItems = [
    { label: 'Home', icon: Home, path: '/home' },
    { label: 'Search', icon: Search, path: '/search' },
    { label: 'My List', icon: Bookmark, path: '/movies' },
    { label: 'History', icon: History, path: '/home' },
    { label: 'Settings', icon: Settings, path: '/profile' }
  ];

  // Default static fallback scenes
  const fallbackHeroScenes = [
    {
      title: "Discover Eternal Wisdom",
      subtitle: "Stream Bhagavad Gita chapters, spiritual discourses, devotional music, and timeless stories.",
      bg: "/krishna_arjuna_banner.png",
      videoUrl: ""
    },
    {
      title: "The Legend of Mahabharat",
      subtitle: "Experience the epic battle of righteousness and the ultimate guidance of Lord Krishna.",
      bg: "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&w=1920&q=80",
      videoUrl: ""
    }
  ];

  const displayHeroScenes = movies.length > 0 
    ? movies.slice(0, 3).map(m => ({
        _id: m._id,
        title: m.title,
        subtitle: m.description || "Experience timeless stories reimagined with state-of-the-art cinematic storytelling.",
        bg: m.thumbnail || "/krishna_arjuna_banner.png",
        videoUrl: m.videoUrl || m.youtubeUrl || '',
        hlsUrl: m.hlsUrl,
        genre: m.genre
      }))
    : fallbackHeroScenes;

  const tvMovies = movies.filter(m => !m.isKids);
  const trendingMovies = [...tvMovies].sort((a, b) => (b.views || 0) - (a.views || 0));

  const contentRows = [
    ...(tvMovies.length > 0 ? [{ title: "Divine Movies", cards: tvMovies }] : []),
    ...(trendingMovies.length > 0 ? [{ title: "Trending Now", cards: trendingMovies }] : [])
  ];

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await axios.get('/api/movies');
        if (Array.isArray(res.data)) {
          setMovies(res.data);
        }
      } catch (err) {
        console.error('Error fetching movies for TV:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  // Rotate hero content every 10 seconds automatically unless playing
  useEffect(() => {
    if (isPlaying) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex(prev => (prev + 1) % displayHeroScenes.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [isPlaying, displayHeroScenes.length]);

  // Spatial Keyboard D-Pad Navigation Engine
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent scrolling defaults for D-pad navigation keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }

      if (selectedMovie) {
        if (e.key === 'Backspace' || e.key === 'Escape') {
          setSelectedMovie(null);
          setIsPlaying(false);
        }
        return;
      }

      if (isSidebarFocused) {
        switch (e.key) {
          case 'ArrowUp':
            setSidebarIndex(prev => Math.max(0, prev - 1));
            break;
          case 'ArrowDown':
            setSidebarIndex(prev => Math.min(sidebarItems.length - 1, prev + 1));
            break;
          case 'ArrowRight':
            setIsSidebarFocused(false);
            break;
          case 'Enter':
            navigate(sidebarItems[sidebarIndex].path);
            break;
          default:
            break;
        }
        return;
      }

      // Main content navigation
      switch (e.key) {
        case 'ArrowLeft':
          if (activeCol > 0) {
            setActiveCol(prev => prev - 1);
          } else {
            setIsSidebarFocused(true);
          }
          break;

        case 'ArrowRight':
          if (activeRow === -2) {
            // Topbar limits (items + Search/Avatar/Language triggers)
            setActiveCol(prev => Math.min(topMenuItems.length + 2, prev + 1));
          } else if (activeRow === -1) {
            // Hero buttons limits (Watch, Info)
            setActiveCol(prev => Math.min(1, prev + 1));
          } else {
            // Row cards limits
            const cardCount = contentRows[activeRow]?.cards?.length || 0;
            setActiveCol(prev => Math.min(Math.max(0, cardCount - 1), prev + 1));
          }
          break;

        case 'ArrowUp':
          if (activeRow > -2) {
            const nextRow = activeRow - 1;
            setActiveRow(nextRow);
            // Cap horizontal columns based on destination row layout limits
            if (nextRow === -1) {
              setActiveCol(prev => Math.min(1, prev));
            } else if (nextRow === -2) {
              setActiveCol(prev => Math.min(topMenuItems.length + 2, prev));
            }
          }
          break;

        case 'ArrowDown':
          if (activeRow < contentRows.length - 1) {
            const nextRow = activeRow + 1;
            setActiveRow(nextRow);
            if (nextRow === -1) {
              setActiveCol(prev => Math.min(1, prev));
            } else if (nextRow >= 0) {
              const cardCount = contentRows[nextRow]?.cards?.length || 0;
              setActiveCol(prev => Math.min(Math.max(0, cardCount - 1), prev));
            }
          }
          break;

        case 'Enter':
          handleEnterPress();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarFocused, sidebarIndex, activeRow, activeCol, selectedMovie]);

  // Center active element in screen view
  useEffect(() => {
    const focusedEl = document.querySelector('[data-focused="true"]');
    if (focusedEl) {
      focusedEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [activeRow, activeCol, isSidebarFocused, sidebarIndex]);

  const handleEnterPress = () => {
    if (activeRow === -2) {
      // Top Navigation Actions
      if (activeCol < topMenuItems.length) {
        navigate(topMenuItems[activeCol].path);
      } else if (activeCol === topMenuItems.length) {
        // Search icon
        navigate('/search');
      } else if (activeCol === topMenuItems.length + 1) {
        // Profile Avatar
        navigate('/profile');
      } else if (activeCol === topMenuItems.length + 2) {
        // Language selector
        setShowLanguageModal(true);
      }
    } else if (activeRow === -1) {
      // Hero banner buttons
      if (activeCol === 0) {
        // Watch Now
        setSelectedMovie(displayHeroScenes[currentHeroIndex]);
        setIsPlaying(true);
      } else {
        // More Info
        setSelectedMovie(displayHeroScenes[currentHeroIndex]);
      }
    } else {
      // Movie card pressed
      const movie = contentRows[activeRow].cards[activeCol];
      setSelectedMovie(movie);
    }
  };

  const handleSidebarSelect = (idx) => {
    navigate(sidebarItems[idx].path);
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen text-white bg-gradient-to-br from-[#060B12] via-[#091522] to-[#04080D] font-sans overflow-x-hidden relative pb-16"
    >
      {/* 10-foot overlay scale utility */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(245,166,35,0.04),transparent_40%)]"></div>

      {/* ============================================================== */}
      {/* LEFT SIDE NAVIGATION PANEL */}
      {/* ============================================================== */}
      <div 
        className={`fixed top-0 left-0 h-full z-40 bg-[#060C14]/90 backdrop-blur-md border-r border-white/5 transition-all duration-300 flex flex-col items-center pt-24 ${
          isSidebarFocused ? 'w-64 px-6 shadow-[10px_0_50px_rgba(0,0,0,0.8)]' : 'w-20 px-2'
        }`}
      >
        <div className="space-y-8 w-full flex-1">
          {sidebarItems.map((item, idx) => {
            const Icon = item.icon;
            const isFocused = isSidebarFocused && sidebarIndex === idx;
            return (
              <button
                key={item.label}
                onClick={() => handleSidebarSelect(idx)}
                onMouseEnter={() => {
                  setIsSidebarFocused(true);
                  setSidebarIndex(idx);
                }}
                className={`w-full flex items-center gap-4 py-4 px-4 rounded-xl transition-all duration-200 text-left ${
                  isFocused 
                    ? 'bg-[#F5A623] text-black font-bold scale-105 shadow-[0_0_20px_rgba(245,166,35,0.5)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                data-focused={isFocused ? "true" : "false"}
              >
                <Icon className={`w-6 h-6 shrink-0 ${isFocused ? 'text-black' : 'text-inherit'}`} />
                {isSidebarFocused && (
                  <span className="text-sm font-semibold tracking-wider transition-opacity duration-300">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Brand Bottom Indicator */}
        {isSidebarFocused && (
          <div className="mb-8 text-center animate-fade-in">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#F5A623]/80 font-black">OMSTREAM TV v1.0</span>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MAIN MAIN CONTAINER (Offsets for left sidebar) */}
      {/* ============================================================== */}
      <div className="pl-24 pr-8 lg:pr-16 transition-all duration-300">

        {/* ============================================================== */}
        {/* TOP NAVIGATION BAR */}
        {/* ============================================================== */}
        <header className="flex items-center justify-between py-6 border-b border-white/5 mb-8">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <span className="text-3xl text-[#F5A623] font-serif drop-shadow-[0_0_10px_rgba(245,166,35,0.4)]">ॐ</span>
            <span className="text-2xl font-black tracking-widest text-[#F5A623] uppercase font-sans">Omstream</span>
          </div>

          {/* Horizontal Nav Links */}
          <div className="flex items-center gap-2">
            {topMenuItems.map((item, idx) => {
              const isFocused = !isSidebarFocused && activeRow === -2 && activeCol === idx;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2.5 rounded-lg text-xs uppercase tracking-widest font-black transition-all ${
                    isFocused 
                      ? 'bg-white text-black scale-105 shadow-[0_0_25px_rgba(255,255,255,0.3)]' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                  data-focused={isFocused ? "true" : "false"}
                >
                  {item.label}
                </button>
              );
            })}

            <div className="h-6 w-px bg-white/10 mx-2"></div>

            {/* Search Icon button */}
            <button 
              className={`p-2.5 rounded-lg transition-all ${
                !isSidebarFocused && activeRow === -2 && activeCol === topMenuItems.length
                  ? 'bg-[#F5A623] text-black scale-105' 
                  : 'text-gray-300 hover:text-white'
              }`}
              data-focused={!isSidebarFocused && activeRow === -2 && activeCol === topMenuItems.length ? "true" : "false"}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Profile Avatar button */}
            <button 
              className={`w-9 h-9 rounded-full overflow-hidden border transition-all ${
                !isSidebarFocused && activeRow === -2 && activeCol === topMenuItems.length + 1
                  ? 'border-[#F5A623] scale-110 ring-4 ring-[#F5A623]/30' 
                  : 'border-white/20'
              }`}
              data-focused={!isSidebarFocused && activeRow === -2 && activeCol === topMenuItems.length + 1 ? "true" : "false"}
            >
              <div className="w-full h-full bg-[#1A2E44] flex items-center justify-center font-bold text-xs text-[#F5A623]">
                {user ? user.name[0].toUpperCase() : 'U'}
              </div>
            </button>

            {/* Language Trigger button */}
            <button 
              className={`px-3 py-1.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-all ${
                !isSidebarFocused && activeRow === -2 && activeCol === topMenuItems.length + 2
                  ? 'bg-white text-black border-white scale-105' 
                  : 'text-gray-300 border-white/20 hover:border-white'
              }`}
              data-focused={!isSidebarFocused && activeRow === -2 && activeCol === topMenuItems.length + 2 ? "true" : "false"}
            >
              <Globe className="w-3.5 h-3.5" />
              {language?.toUpperCase() || 'EN'}
            </button>
          </div>
        </header>

        {/* ============================================================== */}
        {/* HERO BANNER SECTION */}
        {/* ============================================================== */}
        <section 
          className="relative h-[55vh] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.6)] mb-12 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${displayHeroScenes[currentHeroIndex]?.bg})` }}
        >
          {/* Black gradients overlay for that immersive theater feel */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060B12] via-[#060B12]/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#060B12] via-transparent to-transparent z-10"></div>

          {/* Banner Contents */}
          <div className="absolute left-12 bottom-12 z-20 max-w-xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] text-[10px] tracking-[0.2em] font-black uppercase shadow-lg">
              <Star className="w-3.5 h-3.5 fill-[#F5A623]" /> Cinematic Feature
            </span>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-serif font-black tracking-tight leading-[1.1] text-white">
              {displayHeroScenes[currentHeroIndex]?.title}
            </h1>

            <p className="text-gray-300 text-sm lg:text-base xl:text-lg font-light leading-relaxed">
              {displayHeroScenes[currentHeroIndex]?.subtitle}
            </p>

            <div className="flex items-center gap-4 pt-3">
              {/* Watch Now Button */}
              <button 
                onClick={() => {
                  setSelectedMovie(displayHeroScenes[currentHeroIndex]);
                  setIsPlaying(true);
                }}
                className={`px-8 py-3.5 rounded-xl text-xs uppercase tracking-widest font-black flex items-center gap-2.5 transition-all ${
                  !isSidebarFocused && activeRow === -1 && activeCol === 0
                    ? 'bg-[#F5A623] text-black scale-105 shadow-[0_0_35px_rgba(245,166,35,0.4)]'
                    : 'bg-white text-black hover:scale-105'
                }`}
                data-focused={!isSidebarFocused && activeRow === -1 && activeCol === 0 ? "true" : "false"}
              >
                <Play className="w-4 h-4 fill-current text-inherit" /> Watch Now
              </button>

              {/* More Info Button */}
              <button 
                onClick={() => setSelectedMovie(displayHeroScenes[currentHeroIndex])}
                className={`px-8 py-3.5 rounded-xl text-xs uppercase tracking-widest font-black border flex items-center gap-2.5 transition-all ${
                  !isSidebarFocused && activeRow === -1 && activeCol === 1
                    ? 'bg-white/10 text-white border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                    : 'bg-black/30 text-gray-300 border-white/20 hover:border-white'
                }`}
                data-focused={!isSidebarFocused && activeRow === -1 && activeCol === 1 ? "true" : "false"}
              >
                <Info className="w-4 h-4 text-inherit" /> More Info
              </button>
            </div>
          </div>

          {/* TV Carousel Indicators */}
          <div className="absolute right-12 bottom-12 z-20 flex items-center gap-2">
            {displayHeroScenes.map((_, idx) => (
              <span 
                key={idx}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentHeroIndex === idx ? 'w-8 bg-[#F5A623]' : 'w-2.5 bg-white/30'
                }`}
              />
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* HORIZONTAL CONTENT ROWS */}
        {/* ============================================================== */}
        <div className="space-y-12">
          {contentRows.map((row, rIdx) => {
            const isRowFocused = !isSidebarFocused && activeRow === rIdx;
            return (
              <div key={row.title} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl lg:text-2xl font-bold tracking-wide text-white">{row.title}</h2>
                  {isRowFocused && <ChevronRight className="w-5 h-5 text-[#F5A623] animate-pulse" />}
                </div>

                {/* Cards Container */}
                <div className="flex gap-6 overflow-x-auto py-4 px-2 -mx-2 mask-fade-right scroll-smooth no-scrollbar">
                  {row.cards.map((card, cIdx) => {
                    const isCardFocused = isRowFocused && activeCol === cIdx;
                    const cardTitle = card.title;
                    const cardDesc = card.genre || card.description || '';
                    const cardBg = card.thumbnail || "/scene-krishna.svg";
                    return (
                      <div
                        key={card._id || cIdx}
                        onClick={() => setSelectedMovie(card)}
                        className={`flex-shrink-0 w-72 aspect-video rounded-2xl overflow-hidden bg-[#0F172A] border relative group transition-all duration-300 cursor-pointer ${
                          isCardFocused 
                            ? 'scale-110 border-[#F5A623] shadow-[0_0_30px_rgba(245,166,35,0.4)] z-30' 
                            : 'border-white/5 hover:border-white/10'
                        }`}
                        data-focused={isCardFocused ? "true" : "false"}
                      >
                        {/* Thumbnail */}
                        <img 
                          src={cardBg} 
                          alt={cardTitle} 
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Text Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-4">
                          <h3 className="text-sm font-bold text-white leading-tight">{cardTitle}</h3>
                          <p className="text-[11px] text-gray-400 font-medium">{cardDesc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIDEO PLAYER OVERLAY / DETAILS POPUP */}
      {/* ============================================================== */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 bg-[#04080D]/98 flex flex-col items-center justify-center p-8">
          {isPlaying ? (
            <div className="w-full h-full relative flex items-center justify-center">
              <MediaPlayerHLS 
                key={selectedMovie._id || selectedMovie.id || selectedMovie.videoUrl || selectedMovie.youtubeUrl}
                url={selectedMovie.videoUrl || selectedMovie.youtubeUrl} 
                hlsUrl={selectedMovie.hlsUrl}
                title={selectedMovie.title}
                className="w-full max-h-full aspect-video rounded-3xl border border-white/10"
                autoPlay={true}
                controls={true}
              />
              <button 
                onClick={() => {
                  setIsPlaying(false);
                  setSelectedMovie(null);
                }}
                className="absolute top-6 right-6 bg-white/10 text-white hover:bg-white/20 px-6 py-2.5 rounded-xl uppercase text-xs tracking-widest font-black"
              >
                Back to TV (Press Esc)
              </button>
            </div>
          ) : (
            <div className="max-w-4xl w-full bg-[#0A121C] rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col md:flex-row shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
              <img 
                src={selectedMovie.thumbnail || selectedMovie.bg || "/scene-krishna.svg"} 
                alt={selectedMovie.title} 
                className="w-full md:w-1/2 aspect-video object-cover"
              />
              <div className="p-8 sm:p-12 flex flex-col justify-between flex-1 space-y-6">
                <div className="space-y-4">
                  <span className="text-[10px] tracking-[0.2em] font-black uppercase text-[#F5A623]">
                    {selectedMovie.genre || selectedMovie.subtitle || 'Divine'}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-black text-white">{selectedMovie.title}</h2>
                  <p className="text-gray-400 text-sm font-light leading-relaxed">
                    {selectedMovie.description || "Stream the divine lessons of life directly in full high-definition."}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsPlaying(true)}
                    className="flex-1 py-4 bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-black uppercase text-xs tracking-widest rounded-xl flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" /> Play Video
                  </button>
                  <button 
                    onClick={() => setSelectedMovie(null)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase text-xs tracking-widest rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* LANGUAGE SELECTOR MODAL */}
      {/* ============================================================== */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
          <div className="bg-[#0A121C] rounded-[2rem] border border-white/10 max-w-md w-full p-8 space-y-6 text-center shadow-2xl">
            <h3 className="text-xl font-bold uppercase tracking-wider text-white">Select Language</h3>
            <div className="grid grid-cols-2 gap-4">
              {languages?.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLanguageModal(false);
                  }}
                  className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                    language === lang.code 
                      ? 'bg-[#F5A623] border-[#F5A623] text-black font-black' 
                      : 'border-white/10 hover:border-white/20 text-gray-300'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLanguageModal(false)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
