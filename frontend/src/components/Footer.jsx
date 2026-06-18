import React from 'react';

export default function Footer() {
  return (
    <footer className="hidden md:block bg-[#04101D] border-t border-devotion-gold/15 py-8 text-center text-gray-400">
      <div className="max-w-7xl mx-auto px-4">
        <p className="font-serif text-xl text-devotion-gold mb-2 tracking-wide">Omstream</p>
        <p className="text-sm text-gray-300">Explore the timeless wisdom of Bhagavad Gita</p>
        <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Omstream. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
