import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SplashScreen = ({ onComplete }) => {
  const [stage, setStage] = useState(0); // 0: init, 1: om zoom, 2: text shimmer, 3: pulse & fadeout, 4: complete
  const audioRef = useRef(null);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  useEffect(() => {
    const timings = isMobile
      ? { t1: 120, t2: 420, t3: 760, t4: 1000 }
      : { t1: 500, t2: 2500, t3: 4500, t4: 6000 };

    // Stage 1: Ambient Bass and Dark Glow (0 - 1s)
    const t1 = setTimeout(() => {
      setStage(1);
    }, timings.t1);

    // Stage 2: Text Shimmer (2.5s)
    const t2 = setTimeout(() => {
      setStage(2);
    }, timings.t2);

    // Stage 3: Pulse & Fade to Black (4.5s)
    const t3 = setTimeout(() => {
      setStage(3);
    }, timings.t3);

    // Stage 4: Finish & Redirect (6.0s)
    const t4 = setTimeout(() => {
      setStage(4);
      if (onComplete) onComplete();
    }, timings.t4);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#02050A] overflow-hidden transition-opacity duration-1000 ${stage === 3 ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Background Particles / Stars */}
      <div className="absolute inset-0 z-0 bg-[url('/sacred-geometry-pattern.svg')] opacity-5 animate-spin-slow pointer-events-none"></div>
      <div className="absolute inset-0 z-0 radial-gradient-glow opacity-30"></div>

      <div className={`relative z-10 flex flex-col items-center transition-all duration-1000 ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        
        {/* Golden Om Logo Block */}
        <div className={`w-32 h-32 sm:w-40 sm:h-40 bg-[#0B1F3A] border-2 border-[#D4AF37]/40 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.4)] relative overflow-hidden transition-all duration-[3000ms] ease-out ${stage >= 1 ? 'cinematic-zoom' : ''}`}>
           {/* Light rays inside box */}
           <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 transform -translate-x-full animate-sweep-slow"></div>
           <span className="text-6xl sm:text-7xl font-sans text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2B2] via-[#D4AF37] to-[#AA7C11] filter drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]">
             ॐ
           </span>
        </div>

        {/* Text Reveal */}
        <div className={`mt-8 flex flex-col items-center transition-all duration-1000 transform ${stage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF2B2] to-[#D4AF37] tracking-[0.2em] mb-2 shimmer-text">
            OMSTREAM
          </h1>
          <p className="text-[#D4AF37] text-xs sm:text-sm font-bold uppercase tracking-[0.4em] opacity-80">
            Streaming Platform
          </p>
        </div>

      </div>

      {/* Skip Button (Optional) */}
      <button 
        onClick={() => { setStage(4); if(onComplete) onComplete(); }}
        className="absolute bottom-10 right-10 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors z-50 px-4 py-2 border border-white/10 rounded-full hover:bg-white/10"
      >
        Skip Intro
      </button>
    </div>
  );
};

export default SplashScreen;
