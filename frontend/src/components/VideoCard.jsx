import React, { useState, useEffect, useRef } from 'react';

export default function VideoCard({ title, url, videoUrl, description }) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(window.innerWidth > 768);
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e) => {
    if (!isDesktop) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    setMousePos({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  // Extract video ID for YouTube thumbnail
  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/); 
    return match ? match[1] : null; 
  };

  const resolvedUrl = videoUrl || url || '';
  const videoId = getYoutubeVideoId(resolvedUrl);
  const thumbnailUrl = videoId 
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` 
    : 'https://images.unsplash.com/photo-1614850715649-1d0106293cb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

  return (
    <div 
      className="relative preserve-3d transition-transform duration-300 ease-out cursor-pointer bg-[#0B1F3A]/60 backdrop-blur rounded-2xl overflow-hidden shadow-xl border border-yellow-500/20 hover:border-yellow-500/40 group h-full flex flex-col"
      style={{ 
        transform: isHovered && isDesktop ? `perspective(1000px) rotateX(${mousePos.x}deg) rotateY(${mousePos.y}deg) scale3d(1.02, 1.02, 1.02)` : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
        transition: isHovered ? 'none' : 'all 0.5s ease-out',
        zIndex: isHovered ? 50 : 1
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-video overflow-hidden shrink-0 preserve-3d">
        <img 
          src={thumbnailUrl} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 translate-z-10"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-z-30">
          <div className="bg-yellow-500 text-black w-16 h-16 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-all shadow-[0_0_20px_rgba(234,179,8,0.5)]">
            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z"></path></svg>
          </div>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col translate-z-20">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-yellow-400 transition-colors">{title}</h3>
        <p className="text-gray-400 text-sm line-clamp-2">{description}</p>
      </div>
    </div>
  );
}
