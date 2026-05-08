import React, { useEffect } from 'react';
import { Bell, X, CheckCheck, Info, Megaphone, Gift, Sparkles } from 'lucide-react';

const NOTIF_ICON_MAP = {
  system:  { icon: Info,      color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  promo:   { icon: Gift,      color: 'text-devotion-gold', bg: 'bg-devotion-gold/10', border: 'border-devotion-gold/30' },
  content: { icon: Sparkles,  color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  default: { icon: Megaphone, color: 'text-gray-400',   bg: 'bg-white/5',       border: 'border-white/10' },
};

export function NotificationItem({ n }) {
  const isUnread = !n.isRead && !n.read;
  const { icon: Icon, color, bg, border } = NOTIF_ICON_MAP[n.type] || NOTIF_ICON_MAP.default;
  const timeAgo = n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '';

  return (
    <div className={`flex items-start gap-4 p-5 rounded-[1.8rem] mb-3 border transition-all duration-300 group cursor-pointer ${isUnread ? `${bg} ${border} shadow-xl scale-[1.01]` : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'}`}>
      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 ${isUnread ? `${bg} ${border} shadow-inner` : 'bg-white/5 border-white/10'}`}>
        <Icon className={`w-6 h-6 ${isUnread ? color : 'text-gray-500'}`} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex justify-between items-start mb-1.5">
          <p className={`text-[13px] font-black leading-tight tracking-tight uppercase ${isUnread ? 'text-white' : 'text-gray-400'}`}>
            {n.title || 'Divine Update'}
          </p>
          {timeAgo && <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest whitespace-nowrap ml-2">{timeAgo}</p>}
        </div>
        {/* Improved visibility for body text */}
        <p className={`text-sm leading-relaxed font-semibold ${isUnread ? 'text-gray-100' : 'text-gray-400'}`}>
          {n.body || n.message || n.text}
        </p>
        <div className="flex items-center justify-end mt-3">
           {isUnread && <div className="w-2 h-2 bg-devotion-gold rounded-full shadow-[0_0_12px_rgba(255,215,0,1)] animate-pulse" />}
        </div>
      </div>
    </div>
  );
}

export function DesktopNotificationPanel({ notifications, unreadCount, handleMarkAsRead }) {
  return (
    <div className="absolute right-0 top-full mt-4 w-96 bg-[#0B121F]/95 backdrop-blur-3xl border border-devotion-gold/30 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.7)] overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
      <div className="px-6 py-4 flex justify-between items-center border-b border-white/5 bg-[#141C2B]">
        <div className="flex items-center gap-3">
          <Bell className="w-4 h-4 text-devotion-gold" />
          <span className="text-[10px] font-black text-devotion-gold uppercase tracking-[0.3em]">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAsRead} className="flex items-center gap-1.5 text-[9px] text-white/40 hover:text-devotion-gold uppercase tracking-widest font-black transition-all active:scale-95">
            <CheckCheck className="w-3.5 h-3.5" /> MARK ALL READ
          </button>
        )}
      </div>
      <div className="max-h-[420px] overflow-y-auto p-4 scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 mx-auto mb-4 text-white/5" />
            <p className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">Spiritual silence</p>
            <p className="text-[10px] text-white/10 mt-1">No new alerts found</p>
          </div>
        ) : (
          notifications.map(n => <NotificationItem key={n._id} n={n} />)
        )}
      </div>
    </div>
  );
}

export function MobileNotificationSheet({ notifications, unreadCount, handleMarkAsRead, onClose }) {
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#070F1D] flex flex-col overflow-hidden animate-in fade-in duration-300 pt-safe" onClick={handleBackdrop}>
      <div className="flex-shrink-0 px-6 py-8 flex justify-between items-center border-b border-white/5 bg-[#0D1424]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-devotion-gold/10 border border-devotion-gold/30 flex items-center justify-center shadow-inner">
            <Bell className="w-6 h-6 text-devotion-gold" />
          </div>
          <div>
            <p className="text-lg font-black text-white uppercase tracking-[0.2em] leading-tight">Notifications</p>
            <p className="text-[11px] text-devotion-gold/60 font-black uppercase tracking-widest mt-1">
              {unreadCount > 0 ? `${unreadCount} DIVINE ALERTS` : 'PEACEFUL HEART'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button onClick={handleMarkAsRead} className="p-3 bg-devotion-gold/10 border border-devotion-gold/30 text-devotion-gold rounded-2xl active:scale-90 transition-all shadow-lg">
              <CheckCheck className="w-6 h-6" />
            </button>
          )}
          <button onClick={onClose} className="p-3 bg-white/5 border border-white/10 text-white/60 rounded-2xl active:scale-90 transition-all shadow-lg">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 pb-24 scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="text-center py-32 px-8 flex flex-col items-center justify-center h-full">
            <div className="w-28 h-28 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex items-center justify-center mb-10 shadow-2xl">
              <Bell className="w-12 h-12 text-white/5" />
            </div>
            <p className="text-xl font-black text-white/40 uppercase tracking-[0.3em] mb-4">All caught up!</p>
            <p className="text-base text-white/20 font-serif italic text-center max-w-[240px]">Your spiritual path is clear of any new alerts.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            {notifications.map(n => <NotificationItem key={n._id || n.id} n={n} />)}
          </div>
        )}
      </div>
    </div>
  );
}
