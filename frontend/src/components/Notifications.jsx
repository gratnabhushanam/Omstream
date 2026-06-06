import React, { useEffect } from 'react';
import { Bell, X, CheckCheck, Info, Megaphone, Gift, Sparkles } from 'lucide-react';

const NOTIF_ICON_MAP = {
  system:  { icon: Info,      color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  promo:   { icon: Gift,      color: 'text-devotion-gold', bg: 'bg-devotion-gold/10', border: 'border-devotion-gold/30' },
  content: { icon: Sparkles,  color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  default: { icon: Megaphone, color: 'text-gray-400',   bg: 'bg-white/5',       border: 'border-white/10' },
};

export function NotificationItem({ n, onClick }) {
  const isUnread = !n.isRead && !n.read;
  const { icon: Icon, color, bg, border } = NOTIF_ICON_MAP[n.type] || NOTIF_ICON_MAP.default;
  const timeAgo = n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '';

  return (
    <div 
      onClick={onClick}
      className={`flex items-start gap-4 p-5 rounded-[1.8rem] mb-3 border transition-all duration-300 group cursor-pointer ${isUnread ? `${bg} ${border} shadow-xl scale-[1.01]` : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] opacity-80'}`}
    >
      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${isUnread ? `${bg} ${border} shadow-inner` : 'bg-white/5 border-white/10'}`}>
        <Icon className={`w-6 h-6 transition-all duration-500 ${isUnread ? color : 'text-gray-500'} group-hover:scale-125`} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex justify-between items-start mb-1.5">
          <p className={`text-[13px] font-black leading-tight tracking-tight uppercase transition-colors ${isUnread ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
            {n.title || 'Divine Update'}
          </p>
          {timeAgo && <p className="text-[9px] text-white/45 font-black uppercase tracking-widest whitespace-nowrap ml-2">{timeAgo}</p>}
        </div>
        <p className={`text-sm leading-relaxed font-semibold transition-colors ${isUnread ? 'text-gray-100' : 'text-gray-300 group-hover:text-gray-200'}`}>
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
    <div className="absolute right-0 top-full mt-4 w-[24rem] max-w-[calc(100vw-1rem)] bg-[#0B121F]/98 backdrop-blur-3xl border border-devotion-gold/30 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.7)] overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
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
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col overflow-hidden">
      {/* Full-screen background — tapping this closes the sheet */}
      <div 
        className="absolute inset-0 bg-[#070F1D] animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Sheet content — sits above backdrop, does NOT propagate clicks up */}
      <div 
        className="relative z-10 flex flex-col h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex-shrink-0 px-5 pb-5 flex justify-between items-center border-b border-white/10 bg-[#0D1424]"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4.5rem)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-devotion-gold/10 border border-devotion-gold/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-devotion-gold" />
            </div>
            <div>
              <p className="text-base font-black text-white uppercase tracking-[0.2em] leading-tight">Notifications</p>
              <p className="text-[10px] text-devotion-gold/60 font-black uppercase tracking-widest mt-0.5">
                {unreadCount > 0 ? `${unreadCount} NEW ALERTS` : 'ALL CLEAR'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleMarkAsRead(); }} 
                className="p-2.5 bg-devotion-gold/10 border border-devotion-gold/30 text-devotion-gold rounded-xl active:scale-90 transition-all"
              >
                <CheckCheck className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              className="p-2.5 bg-white/5 border border-white/10 text-white/60 rounded-xl active:scale-90 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
        >
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 px-8 text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-center mb-8 shadow-xl">
                <Bell className="w-10 h-10 text-white/10" />
              </div>
              <p className="text-lg font-black text-white/40 uppercase tracking-[0.3em] mb-3">All Caught Up!</p>
              <p className="text-sm text-white/20 font-serif italic max-w-[220px] leading-relaxed">Your spiritual path is clear of any new alerts.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Featured high-priority notification */}
              {notifications.find(n => !n.read && (n.type === 'promo' || n.type === 'content')) && (
                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-devotion-gold/20 to-transparent border border-devotion-gold/30 shadow-xl relative overflow-hidden mb-2">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-devotion-gold/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
                  <p className="text-[9px] font-black text-devotion-gold uppercase tracking-[0.4em] mb-3 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Featured
                  </p>
                  <h4 className="text-xl font-serif font-black text-white mb-2 uppercase tracking-tight">
                    {notifications.find(n => !n.read && (n.type === 'promo' || n.type === 'content')).title}
                  </h4>
                  <p className="text-gray-100 text-sm font-medium italic mb-4 leading-relaxed">
                    {notifications.find(n => !n.read && (n.type === 'promo' || n.type === 'content')).body}
                  </p>
                </div>
              )}
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em] px-1 pb-1">All Notifications</p>
              {notifications.map(n => (
                <NotificationItem 
                  key={n._id || n.id} 
                  n={n}
                  onClick={(e) => e.stopPropagation()}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
