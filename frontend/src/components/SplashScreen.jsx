import React from 'react';
import '../styles/app-shell.css';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#06101E] overflow-hidden">
      {/* Background ambient glow matching the Om Logo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(247,215,125,0.08),transparent_40%)]"></div>
      
      {/* Central Logo Container with JioHotstar-style premium entrance */}
      <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-8 rounded-full shadow-[0_0_60px_rgba(247,215,125,0.2)]">
            <img 
              src="/logo-om-v2.png" 
              alt="Omstream Logo" 
              className="w-full h-full object-contain animate-pulse-slow drop-shadow-[0_0_15px_rgba(247,215,125,0.5)]"
            />
        </div>
        
        {/* App Title typography appearing softly */}
        <h1 className="text-3xl sm:text-4xl font-serif font-black uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-[#f7d77d] via-[#f5a623] to-[#f7d77d] drop-shadow-lg mb-8">
          Omstream
        </h1>

        {/* Premium subtle loader */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#f7d77d] to-[#f5a623] rounded-full animate-loader-progress"></div>
        </div>
      </div>
    </div>
  );
}
