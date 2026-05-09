import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HomeHeroVideo from '../components/HomeHeroVideo';
import { useLanguage } from '../context/LanguageContext';
import { Flame, Trophy, Award, ArrowRight, Play, Star, Film, BrainCircuit, Book, Heart, Sparkles } from 'lucide-react';

function HomeCard({ to, badge, icon: Icon, title, description, content, isKids }) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    setMousePos({ x: rotateX, y: rotateY });
  };

  return (
    <Link
      to={to}
      className="block group h-full tv-focusable preserve-3d"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0, y: 0 }); }}
      onMouseMove={handleMouseMove}
      style={{
        transform: isHovered ? `perspective(1000px) rotateX(${mousePos.x}deg) rotateY(${mousePos.y}deg) scale3d(1.02, 1.02, 1.02)` : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
        transition: isHovered ? 'none' : 'all 0.5s ease-out'
      }}
    >
      <div className={`
        bg-glass-gradient backdrop-blur-3xl rounded-[2rem] tv:rounded-[3rem]
        p-7 sm:p-10 tv:p-14
        border border-devotion-gold/30 shadow-2xl relative h-full
        flex flex-col items-center
        transition-all duration-500 preserve-3d
        ${isHovered ? 'border-devotion-gold/60 shadow-[0_20px_60px_rgba(255,215,0,0.18)]' : ''}
      `}>
        {/* Badge */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-devotion-gold to-[#FFB800] text-devotion-darkBlue px-6 py-1.5 rounded-full font-black text-[10px] tv:text-sm tracking-[0.2em] shadow-xl uppercase whitespace-nowrap translate-z-30">
          {badge}
        </div>

        <div className="mt-4 text-center flex flex-col items-center w-full translate-z-20">
          <div className={`w-16 h-16 tv:w-24 tv:h-24 bg-devotion-gold/10 rounded-full flex items-center justify-center mb-6 tv:mb-10 border border-devotion-gold/20 transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}>
            <Icon className="w-8 h-8 tv:w-12 tv:h-12 text-devotion-gold" fill={isKids ? 'currentColor' : 'none'} />
          </div>

          {content ? (
            <div className="translate-z-10">
              <p className="text-gray-200 font-serif leading-relaxed text-lg tv:text-2xl mb-6 italic opacity-90">
                {content}
              </p>
              <div className={`text-devotion-gold font-black text-xs tv:text-base tracking-widest border-b-2 inline-block pb-1 transition-all duration-300 ${isHovered ? 'border-devotion-gold' : 'border-transparent'}`}>
                EXPLORE WISDOM
              </div>
            </div>
          ) : (
            <div className="translate-z-10">
              <h3 className="text-2xl tv:text-4xl font-serif font-black text-devotion-gold mb-3 uppercase tracking-tighter">{title}</h3>
              <p className="text-gray-300 text-base tv:text-xl font-light leading-relaxed">{description}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { tLabel } = useLanguage();
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-[#06101E]">
      {/* Background radial */}
      {/* Cinematic Hero Video Background */}
      <HomeHeroVideo />

      {/* Background radial fallback */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(230,195,138,0.12),transparent_34%)]"></div>

      {/* Hero */}
      <div className="relative z-10 min-h-[80vh] tv:min-h-[85vh] flex flex-col items-center justify-center pt-20 sm:pt-28 tv:pt-36 pb-10 px-4 sm:px-8 tv:px-16">

        {/* Decorative Krishna art */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl tv:max-w-6xl opacity-[0.02] pointer-events-none select-none animate-float">
          <img src="/krishna-line-art.svg" alt="" loading="lazy" className="w-full h-auto" />
        </div>

        {/* Streak badge */}
        {user && (
          <div className="relative z-20 mb-8 sm:mb-12 flex flex-col sm:flex-row items-center gap-3 sm:gap-4
            bg-glass-gradient backdrop-blur-xl
            px-4 sm:px-8 tv:px-12 py-3 sm:py-4 tv:py-6
            rounded-2xl sm:rounded-full
            border border-devotion-gold/30
            animate-fade-in-down shadow-[0_0_30px_rgba(255,215,0,0.1)]
            w-full sm:w-auto justify-center
          ">
            <div className="bg-orange-500/20 p-2.5 rounded-full relative">
              <Flame className="w-7 h-7 tv:w-10 tv:h-10 text-orange-500" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500"></span>
              </span>
            </div>
            <div>
              <p className="text-[11px] tv:text-sm font-black uppercase tracking-[0.2em] text-devotion-textYellow/70">{tLabel('spiritualPath')}</p>
              <p className="text-2xl tv:text-4xl font-black text-devotion-gold">{user.streak || 0} DAY STREAK 🔥</p>
            </div>
            <div className="hidden sm:block h-10 w-px bg-devotion-gold/20 mx-2"></div>
            <div className="flex -space-x-3">
              <div className="w-10 h-10 tv:w-14 tv:h-14 rounded-full bg-devotion-gold/20 flex items-center justify-center border border-devotion-gold/50 shadow-xl backdrop-blur-md hover:scale-110 transition-transform cursor-pointer">
                <Trophy className="w-5 h-5 tv:w-7 tv:h-7 text-devotion-gold" />
              </div>
              <div className="w-10 h-10 tv:w-14 tv:h-14 rounded-full bg-devotion-darkBlue/40 flex items-center justify-center border border-white/10 shadow-lg hover:scale-110 transition-transform cursor-pointer">
                <Award className="w-5 h-5 tv:w-7 tv:h-7 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {/* Main headline */}
        <div className="relative z-20 text-center px-4 max-w-5xl tv:max-w-7xl mx-auto space-y-6 sm:space-y-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-devotion-gold/40 bg-devotion-gold/5 backdrop-blur-xl text-devotion-gold text-xs tv:text-base font-black tracking-[0.3em] shadow-[0_0_25px_rgba(255,215,0,0.15)] uppercase">
            <span className="w-2 h-2 rounded-full bg-devotion-gold animate-pulse"></span>
            {tLabel('welcome')}
          </div>

          {/* Floating Branded Logo */}
          <div className="mb-10 animate-float flex justify-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-devotion-gold/30 bg-devotion-gold/5 backdrop-blur-xl flex items-center justify-center shadow-[0_0_50px_rgba(255,215,0,0.15)] group hover:scale-110 transition-transform duration-700">
               <img src="/logo-om-v2.png" alt="Gita Wisdom Logo" loading="lazy" className="w-full h-full object-contain scale-90 drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]" />
            </div>
          </div>

          <h1 className="text-6xl sm:text-8xl md:text-9xl tv:text-[10rem] font-serif font-black text-devotion-gold drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] tracking-tighter leading-tight">
            Gita <span className="text-white opacity-90 italic font-light drop-shadow-none tracking-normal">Wisdom</span>
          </h1>

          <p className="text-lg sm:text-2xl md:text-3xl tv:text-4xl text-gray-200 font-light max-w-3xl tv:max-w-5xl mx-auto leading-relaxed font-serif italic">
            "Whenever dharma declines and adharma rises, I manifest Myself."
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-4">
            <Link to="/stories" className="group tv-focusable bg-gradient-to-br from-devotion-gold via-[#FFB800] to-[#FF9F1C] text-devotion-darkBlue px-8 sm:px-10 tv:px-16 py-4 sm:py-5 tv:py-7 rounded-2xl font-black text-lg tv:text-2xl transition-all duration-500 shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_rgba(255,215,0,0.5)] hover:-translate-y-1.5 flex items-center justify-center gap-3 active:scale-95">
              {tLabel('startLearning')}
              <ArrowRight className="w-5 h-5 tv:w-7 tv:h-7 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/reels" className="group tv-focusable bg-devotion-darkBlue/40 backdrop-blur-2xl border border-devotion-gold/40 text-white hover:bg-devotion-darkBlue/70 hover:border-devotion-gold px-8 sm:px-10 tv:px-16 py-4 sm:py-5 tv:py-7 rounded-2xl font-black text-lg tv:text-2xl transition-all duration-500 flex items-center justify-center gap-3 hover:-translate-y-1.5 active:scale-95 shadow-2xl">
              <Play className="w-5 h-5 tv:w-7 tv:h-7 text-devotion-gold group-hover:scale-125 transition-transform" fill="currentColor" />
              {tLabel('gitaReels')}
            </Link>
          </div>
        </div>
      </div>

      {/* Quick-access pills — mobile only */}
      <div className="md:hidden flex overflow-x-auto gap-3 px-4 pb-4 no-scrollbar">
        {[
          { to: '/kids',        label: 'Kids',    icon: Star   },
          { to: '/movies',      label: 'Movies',  icon: Film   },
          { to: '/quizzes',     label: 'Quizzes', icon: BrainCircuit },
          { to: '/daily-sloka', label: 'Sloka',   icon: Book   },
          { to: '/mentor',      label: 'Mentor',  icon: Heart  },
        ].map(item => (
          <Link key={item.to} to={item.to} className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-devotion-gold/20 rounded-full text-xs font-bold text-devotion-gold uppercase tracking-widest hover:bg-devotion-gold/10 transition-all">
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Featured cards */}
      <div className="max-w-7xl tv:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 tv:px-16 py-12 sm:py-20 tv:py-32 relative z-10">
        <div className="flex items-center justify-center gap-6 mb-14 tv:mb-24 opacity-40">
          <div className="h-px w-24 tv:w-40 bg-gradient-to-r from-transparent to-devotion-gold"></div>
          <Sparkles className="text-devotion-gold w-6 h-6 tv:w-8 tv:h-8" />
          <div className="h-px w-24 tv:w-40 bg-gradient-to-l from-transparent to-devotion-gold"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 tv:grid-cols-3 gap-6 sm:gap-10 tv:gap-14">
          <HomeCard to="/sloka"  badge={tLabel('dailySloka')}  icon={Book}  content={tLabel('slokaText')} />
          <HomeCard to="/mentor" badge="GITA MENTOR"  icon={Heart} title="Student Mode"    description="Krishna's solutions for stress, fear, and focus." />
          <HomeCard to="/kids"   badge="KIDS FUN!"    icon={Play}  title="Animated Stories" description="Watch & Learn with Krishna! Cartoon adventures for little heroes." isKids />
        </div>

        {/* Divine Cinema Promo Section */}
        <div className="mt-24 sm:mt-32 tv:mt-40 relative rounded-[2.5rem] tv:rounded-[4rem] overflow-hidden border border-devotion-gold/20 shadow-[0_0_100px_rgba(0,0,0,0.6)] group">
          {/* Cinematic BG */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050B14] via-[#0B1F3A]/80 to-[#050B14]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.06),transparent_70%)]"></div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-30"
               style={{ background: 'linear-gradient(to left, rgba(255,215,0,0.08), transparent)' }}>
          </div>

          <div className="relative z-10 p-8 sm:p-14 tv:p-20 flex flex-col md:flex-row items-center gap-10 md:gap-14">
            {/* Left: Text */}
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-3">
                <Film className="w-5 h-5 text-devotion-gold" />
                <span className="text-devotion-gold font-black uppercase tracking-[0.4em] text-xs tv:text-sm">{tLabel('divineCinema')}</span>
              </div>
              <h2 className="text-4xl sm:text-5xl tv:text-7xl font-serif font-black text-white uppercase tracking-tight leading-[0.9]">
                Watch Sacred<br />
                <span className="text-devotion-gold italic font-light">Stories</span>
              </h2>
              <p className="text-gray-400 text-base sm:text-lg tv:text-2xl font-light leading-relaxed max-w-lg">
                Stream divine narratives, epics, and spiritual documentaries. Bhagavad Gita, Ramayana, Mahabharat — all in one place.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                {['Bhagavad Gita', 'Ramayana', 'Mahabharat', 'Coming Soon'].map(tag => (
                  <span key={tag} className="text-[10px] tv:text-xs font-black uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                to="/movies"
                className="group tv-focusable inline-flex items-center gap-3 bg-gradient-to-r from-devotion-gold to-[#FFB800] text-devotion-darkBlue px-8 py-4 tv:px-12 tv:py-5 rounded-2xl font-black text-sm tv:text-lg uppercase tracking-widest hover:scale-105 transition-all shadow-[0_10px_30px_rgba(255,215,0,0.2)] mt-2"
              >
                <Play className="w-5 h-5 tv:w-6 tv:h-6 fill-current" />
                {tLabel('enterCinema')}
                <ArrowRight className="w-4 h-4 tv:w-5 tv:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right: Visual */}
            <div className="flex-shrink-0 flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 tv:w-72 tv:h-72 relative">
              <div className="absolute inset-0 rounded-full bg-devotion-gold/5 border border-devotion-gold/20 animate-pulse"></div>
              <div className="absolute inset-4 rounded-full bg-devotion-gold/5 border border-devotion-gold/10"></div>
              <img
                src="/logo-om-v2.png"
                alt="Divine Cinema"
                className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 tv:w-48 tv:h-48 object-contain drop-shadow-[0_0_30px_rgba(255,215,0,0.5)] group-hover:scale-110 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
