import React from 'react';

export default function HomeHeroVideo() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Cinematic Video Background - Using a high-quality spiritual abstract loop */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover opacity-30 scale-105"
        style={{ filter: 'brightness(0.6) contrast(1.2) saturate(0.8)' }}
      >
        {/* Fallback to a high-quality space/spiritual background loop */}
        <source src="https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-loop-animation-4654-large.mp4" type="video/mp4" />
      </video>
      
      {/* Premium Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06101E] via-transparent to-[#06101E]/80"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#06101E]/60 via-transparent to-[#06101E]/60"></div>
      
      {/* Animated Particles Effect (CSS only) */}
      <div className="absolute inset-0 opacity-20 mix-blend-overlay">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-devotion-gold rounded-full animate-ping delay-700"></div>
        <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-1.5 h-1.5 bg-devotion-gold rounded-full animate-bounce delay-1500"></div>
      </div>
    </div>
  );
}
