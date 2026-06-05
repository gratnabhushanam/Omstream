import React from 'react';
import { Sparkles, PlayCircle, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Reels() {
  return (
    <div className="min-h-screen bg-[#06101E] flex flex-col items-center justify-center px-6 text-white relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.08),transparent_70%)]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-devotion-gold/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 text-center max-w-2xl mx-auto space-y-10">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-devotion-gold/20 to-orange-500/10 border border-devotion-gold/20 flex items-center justify-center shadow-[0_0_60px_rgba(255,215,0,0.1)]">
            <PlayCircle className="w-14 h-14 text-devotion-gold" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-devotion-gold/10 border border-devotion-gold/20">
          <Sparkles className="w-4 h-4 text-devotion-gold animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-devotion-gold">Coming Soon</span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-7xl font-serif font-black text-white uppercase tracking-tighter leading-[0.9]">
          Divine<br />
          <span className="text-devotion-gold">Reels</span>
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-400 leading-relaxed font-serif italic max-w-lg mx-auto">
          "Short spiritual wisdom, delivered in divine moments."<br />
          <span className="text-sm text-gray-500 not-italic">Our sacred reels feature is being crafted with devotion. Return soon.</span>
        </p>

        {/* Notify / Go Home */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            to="/home"
            className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-devotion-gold text-[#06101E] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(255,215,0,0.2)]"
          >
            Return to Home
          </Link>
          <Link
            to="/stories"
            className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            <Bell className="w-4 h-4" />
            Explore Library
          </Link>
        </div>

        {/* Quote */}
        <div className="pt-8 border-t border-white/5">
          <p className="text-xs text-gray-600 font-serif italic">
            "Let your actions be your legacy." — Bhagavad Gita 3.19
          </p>
        </div>
      </div>
    </div>
  );
}
