import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Film, BookOpen, User, Star, Shield, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: 'Home',    path: '/home',        icon: Home     },
    { name: 'Reels',   path: '/reels',       icon: Film     },
    { name: 'Kids',    path: '/kids',        icon: Star     },
    { name: 'Songs',   path: '/songs',       icon: Music    },
    { name: 'Slokas',  path: '/daily-sloka', icon: BookOpen },
    { name: 'Profile', path: '/profile',     icon: User     },
    ...(user?.role === 'admin' ? [{ name: 'Admin', path: '/admin', icon: Shield }] : []),
  ];

  return (
    /* Hidden on desktop & TV, shown on mobile/tablet in portrait */
    <nav className="
      md:hidden tv:hidden
      fixed bottom-0 left-0 w-full z-50
      bg-[#060F1B]/95 backdrop-blur-xl
      border-t border-devotion-gold/10
      shadow-[0_-8px_30px_rgba(0,0,0,0.5)]
      pb-safe
      landscape:hidden
    ">
      <div className="flex justify-around items-center h-[60px] px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 ${
                isActive ? 'text-devotion-gold' : 'text-gray-500 hover:text-white'
              }`}
            >
              {/* Active pill indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-devotion-gold rounded-full" />
              )}
              <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-devotion-gold/15' : ''}`}>
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${isActive ? 'scale-110' : ''}`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  fill={isActive ? 'none' : 'none'}
                />
              </div>
              <span className={`text-[9px] font-bold tracking-wider uppercase transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
