import React from 'react';
import { X, Bell, Sparkles, Gift, Info, ChevronRight, Play } from 'lucide-react';

const NOTIF_THEMES = {
  system: {
    icon: Info,
    accent: 'text-blue-400',
    bg: 'from-blue-600/20 to-transparent',
    border: 'border-blue-500/30',
    glow: 'shadow-[0_0_50px_rgba(59,130,246,0.3)]'
  },
  promo: {
    icon: Gift,
    accent: 'text-devotion-gold',
    bg: 'from-devotion-gold/20 to-transparent',
    border: 'border-devotion-gold/30',
    glow: 'shadow-[0_0_50px_rgba(255,215,0,0.3)]'
  },
  content: {
    icon: Sparkles,
    accent: 'text-purple-400',
    bg: 'from-purple-600/20 to-transparent',
    border: 'border-purple-500/30',
    glow: 'shadow-[0_0_50px_rgba(168,85,247,0.3)]'
  },
  default: {
    icon: Bell,
    accent: 'text-devotion-gold',
    bg: 'from-devotion-gold/20 to-transparent',
    border: 'border-devotion-gold/30',
    glow: 'shadow-[0_0_50px_rgba(255,215,0,0.2)]'
  }
};

export default function ImmersiveNotification({ notification, onClose, onAction }) {
  if (!notification) return null;

  const theme = NOTIF_THEMES[notification.type] || NOTIF_THEMES.default;
  const Icon = theme.icon;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500">
      <div 
        className="absolute inset-0 bg-[#02060B]/80 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-lg bg-gradient-to-br ${theme.bg} bg-[#0D1424] border ${theme.border} rounded-[3rem] p-8 sm:p-12 ${theme.glow} animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 overflow-hidden`}>
        {/* Cinematic Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        <div className={`absolute bottom-0 left-0 w-48 h-48 ${theme.accent} opacity-10 rounded-full blur-[60px] -ml-24 -mb-24 pointer-events-none`} />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all active:scale-90"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-[2.5rem] ${theme.accent} bg-white/[0.03] border ${theme.border} flex items-center justify-center mb-8 shadow-2xl relative group overflow-hidden`}>
             <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <Icon className={`w-12 h-12 sm:w-14 sm:h-14 ${theme.accent} animate-bounce-slow`} />
          </div>

          <p className={`text-[10px] sm:text-xs font-black ${theme.accent} uppercase tracking-[0.5em] mb-4`}>
            {notification.type === 'promo' ? 'Exclusive Reward' : notification.type === 'content' ? 'New Release' : 'Divine Alert'}
          </p>
          
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-white mb-6 leading-tight tracking-tight uppercase">
            {notification.title}
          </h2>
          
          <p className="text-base sm:text-lg text-gray-300 font-medium leading-relaxed mb-10 max-w-xs font-serif italic">
            "{notification.body || notification.message || notification.text}"
          </p>

          <div className="w-full flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => onAction(notification)}
              className="flex-1 py-5 bg-gradient-to-r from-devotion-gold to-[#FFB800] text-[#06101E] rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm shadow-2xl hover:shadow-[0_20px_40px_rgba(255,215,0,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Play className="w-5 h-5 fill-current" />
              {notification.actionText || 'Reveal Now'}
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs sm:text-sm rounded-2xl hover:bg-white/10 transition-all active:scale-95"
            >
              Later
            </button>
          </div>
          
          <div className="mt-8 flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-widest">
            <span>Powered by Gita Wisdom</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
