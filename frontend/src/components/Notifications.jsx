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
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    /* Backdrop — tap anywhere on backdrop to close */
    <div
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel — tap inside panel does NOT close */}
      <div
        className="absolute inset-x-0 top-0 bottom-0 bg-[#0A1628] flex flex-col shadow-2xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0D1830]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-devotion-gold/20 border border-devotion-gold/40 flex items-center justify-center">
              <Bell className="w-5 h-5 text-devotion-gold" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-widest">Notifications</p>
              <p className="text-[10px] text-devotion-gold font-bold uppercase tracking-widest mt-0.5">
                {unreadCount > 0 ? `${unreadCount} new` : 'All clear'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleMarkAsRead(); }}
                className="px-3 py-2 bg-devotion-gold/10 border border-devotion-gold/30 text-devotion-gold rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <CheckCheck className="w-4 h-4" /> Read All
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/60 active:scale-90 transition-all active:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Swipe hint ── */}
        <div className="flex-shrink-0 flex justify-center py-2">
          <div className="w-12 h-1 bg-white/10 rounded-full" />
        </div>

        {/* ── Scrollable Content ── */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
        >
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
              <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg">
                <Bell className="w-9 h-9 text-white/30" />
              </div>
              <p className="text-base font-black text-white uppercase tracking-widest mb-2">All Caught Up!</p>
              <p className="text-sm text-gray-400 font-medium italic max-w-[220px] leading-relaxed">No new alerts at this time.</p>
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="mt-8 px-8 py-3 bg-devotion-gold/10 border border-devotion-gold/30 text-devotion-gold rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {/* Featured notification */}
              {notifications.find(n => !n.read && (n.type === 'promo' || n.type === 'content')) && (
                <div className="p-5 rounded-[1.5rem] bg-gradient-to-br from-devotion-gold/15 to-transparent border border-devotion-gold/25">
                  <p className="text-[9px] font-black text-devotion-gold uppercase tracking-[0.4em] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Featured
                  </p>
                  <h4 className="text-base font-black text-white mb-1 uppercase tracking-tight">
                    {notifications.find(n => !n.read && (n.type === 'promo' || n.type === 'content')).title}
                  </h4>
                  <p className="text-sm text-gray-300 italic leading-relaxed">
                    {notifications.find(n => !n.read && (n.type === 'promo' || n.type === 'content')).body}
                  </p>
                </div>
              )}
              <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] px-1 pt-1">All Notifications</p>
              {notifications.map(n => (
                <NotificationItem key={n._id || n.id} n={n} onClick={(e) => e.stopPropagation()} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
