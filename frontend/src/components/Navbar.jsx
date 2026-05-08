import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Book, Menu, X, BrainCircuit, User, Star, Zap, Heart, Search, Film, Shield, Users, Bell, Download, CheckCheck, Info, Megaphone, Gift, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useNotifications } from '../hooks/useNotifications';
import { DesktopNotificationPanel, MobileNotificationSheet } from './Notifications';


export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { isInstallable, showInstallModal, setShowInstallModal, handleInstallClick } = useInstallPrompt();
  const { notifications, showNotifications, setShowNotifications, unreadCount, handleMarkAsRead } = useNotifications(user);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'G';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 1);
  };

  const navLinks = [
    { name: 'Home', path: '/home', icon: <BookOpen className="w-4 h-4 mr-2" /> },
    { name: 'Mentor', path: '/mentor', icon: <Heart className="w-4 h-4 mr-2" /> },
    { name: 'Reels', path: '/reels', icon: <Zap className="w-4 h-4 mr-2" /> },
    { name: 'Kids', path: '/kids', icon: <Star className="w-4 h-4 mr-2" /> },
    { name: 'Movies', path: '/movies', icon: <Film className="w-4 h-4 mr-2" /> },
    { name: 'Quizzes', path: '/quizzes', icon: <BrainCircuit className="w-4 h-4 mr-2" /> },
    { name: 'Daily Sloka', path: '/daily-sloka', icon: <Star className="w-4 h-4 mr-2" /> },
    { name: 'Chapters', path: '/chapters', icon: <Book className="w-4 h-4 mr-2" /> },
    ...(user?.role === 'admin' ? [{ name: 'Admin', path: '/admin', icon: <Shield className="w-4 h-4 mr-2" /> }] : []),
  ];

  const isActive = (path) => location.pathname === path;
  const toggleNotifications = () => { setIsOpen(false); setShowNotifications(prev => !prev); };

  return (
    <nav className="sticky top-0 w-full z-50 bg-[#06101E]/95 backdrop-blur-2xl border-b border-white/5 shadow-2xl tv:h-24 transition-all duration-500">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 pl-safe pr-safe">
        <div className="flex items-center justify-between h-16 tv:h-24">
          <Link to="/home" tabIndex={0} className="tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold rounded-2xl group flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-all flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 tv:w-14 tv:h-14 rounded-xl overflow-hidden flex items-center justify-center bg-devotion-gold/10 border border-devotion-gold/30 shadow-[0_0_20px_rgba(255,215,0,0.1)] group-hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all">
              <img src="/logo-om-v2.png" alt="Logo" className="w-full h-full object-cover scale-90 group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg tv:text-2xl font-black bg-gradient-to-r from-devotion-gold to-white bg-clip-text text-transparent tracking-tighter uppercase leading-none">GitaWisdom</span>
              <span className="text-[7px] sm:text-[8px] tv:text-xs font-black text-devotion-gold uppercase tracking-[0.4em] opacity-60">Divine Path</span>
            </div>
          </Link>
          
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                tabIndex={0}
                className={`tv-focusable flex items-center px-3 xl:px-4 py-2 tv:px-6 tv:py-4 rounded-xl font-black text-[10px] tv:text-base uppercase tracking-[0.18em] transition-all duration-300 ${isActive(link.path) ? 'bg-devotion-gold/15 text-devotion-gold border border-devotion-gold/30 shadow-[0_0_20px_rgba(255,215,0,0.15)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            
            <div className="h-6 w-px bg-white/10 mx-2 xl:mx-4"></div>
            
            <button onClick={handleInstallClick} className="tv-focusable group relative px-5 py-2 tv:px-8 tv:py-4 bg-gradient-to-br from-devotion-gold to-[#FFB800] text-[#06101E] text-[10px] tv:text-sm font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_25px_rgba(255,215,0,0.4)] transition-all flex items-center gap-2 overflow-hidden active:scale-95">
               <Download className="w-4 h-4 tv:w-5 tv:h-5 group-hover:translate-y-0.5 transition-transform" /> GET APP
            </button>
          
            {user && (
              <div className="relative ml-2">
                <button onClick={toggleNotifications} className={`tv-focusable w-10 h-10 tv:w-14 tv:h-14 rounded-xl flex items-center justify-center transition-all ${showNotifications ? 'bg-devotion-gold/20 text-devotion-gold' : 'text-gray-400 hover:bg-white/5 hover:text-white'} active:scale-110`}>
                  <Bell className="w-5 h-5 tv:w-6 tv:h-6" />
                  {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 tv:w-3.5 tv:h-3.5 bg-red-600 rounded-full border-2 border-[#06101E] animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]"></span>}
                </button>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-50" onClick={() => setShowNotifications(false)} />
                    <DesktopNotificationPanel notifications={notifications} unreadCount={unreadCount} handleMarkAsRead={handleMarkAsRead} />
                  </>
                )}
              </div>
            )}
            
            {user ? (
              <Link to="/profile" className="tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold rounded-2xl flex items-center gap-3 pl-4 border-l border-white/10 ml-2 group">
                <div className="w-10 h-10 tv:w-14 tv:h-14 rounded-xl overflow-hidden border border-white/10 group-hover:border-devotion-gold/50 transition-colors">
                  {user.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-devotion-gold/10 flex items-center justify-center text-devotion-gold font-black text-xs tv:text-sm uppercase">{getInitials(user.name)}</div>}
                </div>
                <div className="hidden xl:flex flex-col">
                  <span className="text-[10px] tv:text-xs font-black text-white group-hover:text-devotion-gold transition-colors uppercase tracking-widest truncate max-w-[100px] tv:max-w-[150px]">{user.name}</span>
                  <span className="text-[8px] tv:text-[10px] font-bold text-gray-500 uppercase tracking-widest">Devotee</span>
                </div>
              </Link>
            ) : (
              <Link to="/login" className="tv-focusable px-6 py-2 tv:px-8 tv:py-4 border border-devotion-gold/30 text-devotion-gold hover:bg-devotion-gold hover:text-devotion-darkBlue rounded-xl font-black text-[10px] tv:text-sm uppercase tracking-widest transition-all active:scale-95 ml-2 shadow-[0_0_20px_rgba(255,215,0,0.05)]">LOGIN</Link>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {user && (
              <button onClick={toggleNotifications} className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-devotion-gold bg-devotion-gold/10 rounded-xl border border-devotion-gold/20 active:scale-110 transition-all shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border-2 border-[#06101E] animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.6)]" />}
              </button>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-devotion-gold bg-white/5 rounded-xl border border-white/10 active:scale-90 transition-all">
              {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-[#08111F] border-b border-white/5 absolute w-full shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="px-6 pt-4 pb-8 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.path} onClick={() => setIsOpen(false)} className={`flex items-center px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all ${isActive(link.path) ? 'bg-devotion-gold/10 text-devotion-gold border border-devotion-gold/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                {link.icon} {link.name}
              </Link>
            ))}
            <button onClick={() => { handleInstallClick(); setIsOpen(false); }} className="w-full mt-4 py-4 bg-gradient-to-r from-devotion-gold to-[#FFB800] text-[#06101E] rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-3"><Download className="w-5 h-5" /> INSTALL DIVINE APP</button>
            {user ? (
              <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-4 mt-6 p-4 bg-white/5 rounded-2xl border border-white/10 group">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-devotion-gold/30">
                  {user.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-devotion-gold/10 flex items-center justify-center text-devotion-gold font-black text-xs">{getInitials(user.name)}</div>}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-xs font-black text-white uppercase tracking-widest truncate">{user.name}</span>
                  <span className="text-[9px] font-bold text-devotion-gold uppercase tracking-widest">Open Profile</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </Link>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="w-full mt-4 py-4 border-2 border-devotion-gold/30 text-devotion-gold rounded-2xl font-black text-[11px] uppercase tracking-widest text-center">LOGIN / JOIN COMMUNITY</Link>
            )}
          </div>
        </div>
      )}

      {showNotifications && isMobile && (
        <MobileNotificationSheet notifications={notifications} unreadCount={unreadCount} handleMarkAsRead={handleMarkAsRead} onClose={() => setShowNotifications(false)} />
      )}

      {showInstallModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0B121F] border border-devotion-gold/30 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] w-full max-w-sm overflow-hidden relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowInstallModal(false)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-all active:scale-90"><X className="w-6 h-6" /></button>
            <div className="p-10 text-center">
              <div className="w-24 h-24 mx-auto bg-devotion-gold/10 rounded-[2rem] border border-devotion-gold/30 flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-devotion-gold/20 to-transparent animate-pulse" />
                 <img src="/logo-om-v2.png" alt="Logo" className="w-14 h-14 object-contain relative z-10 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter font-serif">Divine Installation</h3>
              <p className="text-[13px] text-gray-400 leading-relaxed mb-8 font-medium italic font-serif">"Carry the Gita Wisdom in your pocket. Fast, secure, and always available offline."</p>
              <div className="space-y-4 mb-8">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
                    <p className="text-[10px] font-black text-devotion-gold uppercase tracking-[0.2em] mb-2">Instructions</p>
                    <p className="text-[11px] text-gray-300 font-medium leading-relaxed">
                       Tap <span className="text-white font-bold">Share</span> or <span className="text-white font-bold">Menu (⋮)</span> and select <span className="text-devotion-gold font-bold italic underline">"Add to Home Screen"</span>.
                    </p>
                 </div>
              </div>
              <button onClick={() => setShowInstallModal(false)} className="w-full py-5 bg-gradient-to-r from-devotion-gold to-[#FFB800] text-[#06101E] rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:shadow-[0_0_40px_rgba(255,215,0,0.5)] transition-all active:scale-95">REVEAL WISDOM</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
