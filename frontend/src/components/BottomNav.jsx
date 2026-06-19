import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Film, Tv, BookOpen, User, Star, Shield, Music, Library } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: 'Home',    path: '/home',        icon: Home     },
    { name: 'TV',      path: '/tv',          icon: Tv       },
    { name: 'Movies',  path: '/movies',      icon: Film     },
    { name: 'Kids',    path: '/kids',        icon: Star     },
    { name: 'Library', path: '/stories',     icon: Library  },
    { name: 'Songs',   path: '/songs',       icon: Music    },
    { name: 'Slokas',  path: '/daily-sloka', icon: BookOpen },
    { name: 'Profile', path: '/profile',     icon: User     },
    ...(user?.role === 'admin' ? [{ name: 'Admin', path: '/admin', icon: Shield }] : []),
  ];

  return (
    /* Hidden on desktop & TV, visible on mobile */
    <nav 
      className="md:hidden tv:hidden fixed bottom-0 left-0 w-full z-[100] bg-[#060F1B]/95 backdrop-blur-xl border-t border-devotion-gold/10 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-start items-center h-[60px] px-2 overflow-x-auto no-scrollbar gap-2 snap-x snap-mandatory">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              style={{ minHeight: 0, minWidth: '4.5rem' }}
              className={`relative flex flex-col items-center justify-center flex-shrink-0 h-full gap-0.5 transition-all duration-200 snap-center ${
                isActive ? 'text-devotion-gold' : 'text-gray-500'
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
                />
              </div>
              <span className={`text-[9px] font-bold tracking-wider uppercase transition-all leading-none ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
