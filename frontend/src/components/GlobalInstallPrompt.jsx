import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GlobalInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the app is already installed natively (PWA standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    // Check if the user has already dismissed the popup in the past
    const hasSeenPopup = localStorage.getItem('hasSeenInstallPopupV2');

    if (isStandalone) {
      return; // Do not show if already installed
    }

    // Always show the popup after 1.5 seconds if they haven't seen it and aren't standalone
    // This ensures it works even on localhost or browsers that don't support beforeinstallprompt natively
    if (!hasSeenPopup) {
      setTimeout(() => setShowPopup(true), 1500);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Trigger the native PWA install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPopup(false);
      localStorage.setItem('hasSeenInstallPopupV2', 'true');
      }
      setDeferredPrompt(null);
    } else {
      // If there is no deferred prompt (e.g. Safari on iOS), redirect to the dedicated install instructions page
      setShowPopup(false);
      localStorage.setItem('hasSeenInstallPopupV2', 'true');
      navigate('/install');
    }
  };

  const handleDismiss = () => {
    setShowPopup(false);
    // Remember that the user dismissed it so we don't bother them again
    localStorage.setItem('hasSeenInstallPopupV2', 'true');
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 isolate">
      {/* Dim Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-300" 
        onClick={handleDismiss}
      ></div>

      {/* Popup Modal */}
      <div className="bg-gradient-to-b from-[#081426] to-[#04101D] border border-devotion-gold/30 rounded-3xl w-full max-w-sm shadow-2xl relative z-10 overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-500 ease-out">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-devotion-gold to-transparent opacity-50"></div>
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-devotion-gold/20 rounded-full blur-[40px] pointer-events-none"></div>
        
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            {/* Logo */}
            <div className="w-16 h-16 bg-gradient-to-br from-devotion-gold/20 to-devotion-gold/5 rounded-2xl border border-devotion-gold/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(255,215,0,0.15)] relative overflow-hidden">
               <img src="/logo-om-v2.png" alt="App Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
            </div>
            
            {/* Content */}
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-bold text-white mb-1 font-serif leading-tight">Omstream App</h3>
              <p className="text-[11px] text-gray-300 leading-relaxed max-w-[200px]">
                Install our native app for the best spiritual guidance experience, right on your home screen.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <button 
              onClick={handleInstall}
              className="w-full flex items-center justify-center py-3.5 bg-gradient-to-r from-devotion-gold to-[#FFE6A5] text-[#06101E] rounded-xl font-bold uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(255,215,0,0.25)] hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Install Free App
            </button>
            <button 
              onClick={handleDismiss}
              className="w-full py-3 bg-transparent text-gray-400 rounded-xl font-semibold uppercase tracking-[0.1em] text-[10px] hover:text-white hover:bg-white/5 transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
