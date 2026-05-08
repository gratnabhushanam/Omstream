import React, { useState } from 'react';

export default function StoryCard({ title, description, chapter, language }) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setMousePos({ x: rotateX, y: rotateY });
  };

  return (
    <div 
      className="group bg-[#0B1F3A]/80 backdrop-blur border border-yellow-500/20 rounded-xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 preserve-3d cursor-pointer h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0, y: 0 }); }}
      onMouseMove={handleMouseMove}
      style={{
        transform: isHovered ? `perspective(1000px) rotateX(${mousePos.x}deg) rotateY(${mousePos.y}deg) scale3d(1.02, 1.02, 1.02)` : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
        transition: isHovered ? 'none' : 'all 0.4s ease-out'
      }}
    >
      <div className="p-6 preserve-3d">
        <div className="flex justify-between items-start mb-4 translate-z-20">
          <span className="text-xs font-medium text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
            Chapter {chapter}
          </span>
          <span className="text-xs text-gray-400">{language}</span>
        </div>
        <h3 className="text-xl font-serif font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors translate-z-30">
          {title}
        </h3>
        <p className="text-gray-300 line-clamp-3 text-sm leading-relaxed translate-z-10">
          {description}
        </p>
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center translate-z-20">
          <button className="text-yellow-500 text-sm font-medium hover:text-yellow-400 transition-colors flex items-center gap-1">
            Read More
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
