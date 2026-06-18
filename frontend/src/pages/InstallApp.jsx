import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Command, LayoutGrid, ChevronRight } from 'lucide-react';

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install the app on your device, tap the Share icon in your browser (iOS) or the menu icon (Android) and select "Add to Home Screen".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#04101D] to-[#061428] py-20 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full relative">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-devotion-gold/20 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="bg-[#081426]/80 backdrop-blur-xl border border-devotion-gold/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
           {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-devotion-gold/20 to-devotion-gold/5 rounded-[2rem] border border-devotion-gold/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,215,0,0.15)] relative group cursor-pointer" onClick={handleInstallClick}>
              <div className="absolute inset-0 bg-devotion-gold/10 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img src="/logo-om-v2.png" alt="Omstream Logo" className="w-12 h-12 object-contain drop-shadow-lg scale-110" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 font-serif bg-gradient-to-r from-devotion-gold to-[#FFE6A5] bg-clip-text text-transparent">Omstream</h1>
            <p className="text-gray-400 text-sm">Your Spiritual Companion</p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-10">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-devotion-gold/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-devotion-gold/10 flex items-center justify-center flex-shrink-0">
                 <Smartphone className="w-5 h-5 text-devotion-gold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Native Experience</h3>
                <p className="text-xs text-gray-400 leading-relaxed">Runs perfectly on your phone with zero browser clutter.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-devotion-gold/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-devotion-gold/10 flex items-center justify-center flex-shrink-0">
                 <LayoutGrid className="w-5 h-5 text-devotion-gold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Home Screen Access</h3>
                <p className="text-xs text-gray-400 leading-relaxed">Launch instantly directly from your app drawer.</p>
              </div>
            </div>
          </div>

          {/* Action */}
          <button
            onClick={handleInstallClick}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-devotion-gold to-[#FFE6A5] text-[#06101E] rounded-2xl p-4 font-bold uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all flex items-center justify-between"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative z-10 flex items-center">
              <Download className="w-5 h-5 mr-3" />
              Install Free App
            </span>
            <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* QR Code Section for TV/Desktop -> Mobile Handoff */}
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-col items-center">
             <div className="p-3 bg-white rounded-2xl shadow-2xl mb-4 group hover:scale-105 transition-transform duration-500">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin)}`} 
                  alt="Scan to open on mobile" 
                  className="w-32 h-32"
                />
             </div>
             <p className="text-[10px] font-black text-devotion-gold uppercase tracking-[0.2em]">Scan to open on Mobile</p>
          </div>

          <p className="text-center text-[10px] text-gray-500 mt-6 uppercase tracking-widest leading-relaxed">
            Available for Android, iOS, Windows & Mac. <br/> Works instantly without App Store downloads.
          </p>
        </div>
      </div>
    </div>
  );
}
