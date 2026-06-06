import React from 'react';
import { Music, Play, ExternalLink } from 'lucide-react';

export default function Songs() {
  const platforms = [
    {
      name: 'Spotify',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg',
      link: 'https://open.spotify.com/search/divine%20songs%20bhakti',
      color: 'bg-[#1DB954]'
    },
    {
      name: 'YouTube Music',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Youtube_Music_logo.svg',
      link: 'https://music.youtube.com/search?q=divine+devotional+songs',
      color: 'bg-[#FF0000]'
    },
    {
      name: 'Apple Music',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
      link: 'https://music.apple.com/in/search?term=devotional%20songs',
      color: 'bg-[#FA243C]'
    },
    {
      name: 'JioSaavn',
      icon: 'https://upload.wikimedia.org/wikipedia/en/e/eb/JioSaavn_Logo.svg',
      link: 'https://www.jiosaavn.com/search/bhakti',
      color: 'bg-[#2BC5B4]'
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="w-20 h-20 mx-auto bg-devotion-gold/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,215,0,0.2)]">
            <Music className="w-10 h-10 text-devotion-gold" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-devotion-gold via-[#FFF2C8] to-devotion-gold mb-4">
            Divine Songs
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto font-light">
            Listen to soulful devotional and divine songs on your favorite streaming platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-slide-up">
          {platforms.map((platform, idx) => (
            <a
              key={idx}
              href={platform.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-[#0B121F]/80 backdrop-blur-xl border border-devotion-gold/20 p-8 rounded-3xl hover:border-devotion-gold/50 transition-all duration-300 flex flex-col items-center justify-center gap-6 overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(255,215,0,0.15)]"
            >
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-devotion-gold to-transparent" />
              
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center bg-white p-4 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                <img src={platform.icon} alt={platform.name} className="w-full h-full object-contain" />
              </div>
              
              <div className="text-center relative z-10">
                <h3 className="text-xl font-bold text-white mb-2">{platform.name}</h3>
                <span className="inline-flex items-center gap-2 text-sm text-devotion-gold font-medium">
                  Listen Now <ExternalLink className="w-4 h-4" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
