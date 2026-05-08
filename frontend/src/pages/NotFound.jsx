import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, ChevronLeft, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#06101E] relative overflow-hidden px-6 text-center">
      {/* Cinematic Background Layers */}
      <div className="absolute inset-0 bg-[#020610] z-0"></div>
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,rgba(255,159,28,0.05),transparent_60%)]"></div>
      
      {/* Ambient floating light streaks */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-devotion-gold/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      <div className="relative z-10 max-w-2xl w-full">
        {/* The Branded Image (OM Logo) */}
        <div className="mb-12 relative inline-block">
          <div className="absolute inset-0 bg-devotion-gold/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative w-32 h-32 sm:w-48 sm:h-48 rounded-full border border-devotion-gold/30 bg-[#06101E]/50 backdrop-blur-xl flex items-center justify-center shadow-[0_0_60px_rgba(255,215,0,0.15)] group transition-transform duration-1000 hover:scale-110">
            <img 
              src="/logo-om-v2.png" 
              alt="Gita Wisdom Logo" 
              className="w-full h-full object-contain scale-90 drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]"
            />
          </div>
          
          {/* Floating Sparkles */}
          <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-devotion-gold animate-bounce opacity-60" />
          <Sparkles className="absolute -bottom-2 -left-6 w-6 h-6 text-devotion-gold animate-pulse opacity-40" />
        </div>

        {/* Cinematic Error Messaging */}
        <div className="space-y-6 mb-12">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-devotion-gold/30 bg-devotion-gold/5 backdrop-blur-xl mb-4 text-devotion-gold text-[10px] font-black tracking-[0.4em] uppercase">
             <MapPin className="w-3.5 h-3.5" /> Path Uncharted
           </div>
           
           <h1 className="text-6xl sm:text-8xl font-serif font-black text-white tracking-tighter uppercase leading-none drop-shadow-2xl">
             404 <span className="text-devotion-gold italic font-light tracking-normal opacity-90">Lost</span>
           </h1>
           
           <p className="text-lg sm:text-2xl text-gray-400 font-serif italic max-w-lg mx-auto leading-relaxed opacity-80">
             "Even when the path is hidden, the eternal wisdom remains your guide."
           </p>
        </div>

        {/* Action Buttons - Optimized for Touch & TV */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black tracking-[0.2em] transition-all text-xs uppercase flex items-center justify-center gap-3 active:scale-95 group tv:px-16 tv:py-8 tv:text-lg"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Step Back
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-devotion-gold to-[#FFB800] text-[#06101E] rounded-2xl font-black tracking-[0.2em] transition-all text-xs uppercase flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(255,215,0,0.2)] hover:shadow-[0_25px_50px_rgba(255,215,0,0.4)] active:scale-95 tv:px-16 tv:py-8 tv:text-lg"
          >
            <Home className="w-4 h-4" /> Return Home
          </button>
        </div>
      </div>

      {/* Decorative footer text */}
      <div className="absolute bottom-12 left-0 right-0 opacity-20 pointer-events-none">
        <p className="text-[10px] uppercase font-black tracking-[0.6em] text-white">Gita Wisdom • Divine Cinema • Eternal Truth</p>
      </div>
    </div>
  );
}
