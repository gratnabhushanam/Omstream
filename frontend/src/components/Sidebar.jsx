import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Tv, Film, Users, Star, LayoutGrid, Shield, User, Search, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  
  const navLinks = [
    { name: 'Home', path: '/home', icon: BookOpen },
    { name: 'TV', path: '/tv', icon: Tv },
    { name: 'Movies', path: '/movies', icon: Film },
    { name: 'Kids', path: '/kids', icon: Star },
    { name: 'Library', path: '/videos', icon: BookOpen },
    { name: 'Songs', path: '/songs', icon: Music },
    { name: 'Daily Sloka', path: '/daily-sloka', icon: BookOpen },
    { name: 'Community', path: '/satsangs', icon: Users },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Profile', path: '/profile', icon: User },
    ...(user?.role === 'admin' ? [{ name: 'Admin', path: '/admin', icon: Shield }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Invisible overlay to darken main content when expanded */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-500 hidden lg:block ${isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed left-0 top-0 h-screen z-50 bg-[#0B0F1A]/95 backdrop-blur-xl border-r border-white/5 transition-all duration-300 hidden lg:flex flex-col py-8 ${isHovered ? 'w-64 shadow-[20px_0_50px_rgba(0,0,0,0.8)]' : 'w-[5.5rem]'}`}
      >
        <Link to="/home" className="flex items-center gap-4 px-[18px] mb-12 hover:opacity-80 transition-opacity overflow-hidden">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#00A8FF]/10 border border-[#00A8FF]/30 shadow-[0_0_20px_rgba(0,168,255,0.1)] flex items-center justify-center">
             <img src="/logo-om-v2.png" alt="Logo" className="w-full h-full object-cover scale-90" />
          </div>
          <span className={`text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#FFD700] tracking-widest whitespace-nowrap transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
             OMSTREAM
          </span>
        </Link>
        
        <nav className="flex-1 flex flex-col gap-1 w-full overflow-hidden">
          {navLinks.map(link => {
            const active = isActive(link.path);
            const Icon = link.icon;
            return (
              <Link 
                key={link.path} 
                to={link.path}
                className={`relative flex items-center gap-6 px-6 py-4 transition-all group overflow-hidden ${active ? 'text-white font-bold' : 'text-white/50 hover:text-white font-medium'}`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-[#FF7A00] to-[#FFD700] rounded-r-full shadow-[0_0_15px_rgba(255,122,0,0.6)]" />
                )}
                
                <Icon className={`w-7 h-7 flex-shrink-0 transition-transform ${active ? 'scale-110 text-[#FF7A00]' : 'group-hover:scale-110 group-hover:text-white'}`} />
                
                <span className={`whitespace-nowrap tracking-wide transition-all duration-300 text-lg ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                  {link.name}
                </span>

                {active && isHovered && (
                   <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A00]/10 to-transparent pointer-events-none" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
