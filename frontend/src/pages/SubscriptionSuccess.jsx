import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Sparkles, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract tier from query or state
  const queryParams = new URLSearchParams(location.search);
  const tier = queryParams.get('tier') || location.state?.tier || 'Bhakt';

  useEffect(() => {
    // Trigger confetti explosion
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, animate a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-height-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-zinc-900/40 border border-zinc-800 backdrop-blur rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500"></div>

        <div className="flex justify-center mb-6">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500 animate-bounce">
            <CheckCircle className="w-12 h-12" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold mb-2 font-sans flex items-center justify-center gap-2">
          Payment Verified! <Sparkles className="text-amber-400 w-6 h-6" />
        </h1>
        <p className="text-zinc-400 text-sm mb-6">Your transaction was processed successfully.</p>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850 mb-8 text-left">
          <div className="flex justify-between border-b border-zinc-800 pb-3 mb-3 text-sm">
            <span className="text-zinc-400">Plan Tier</span>
            <span className="font-bold text-amber-400 capitalize">{tier} Plan</span>
          </div>
          <div className="text-zinc-400 text-xs leading-relaxed">
            🚀 All plan features have been successfully unlocked on your profile. You may need to refresh the page or reload profiles to see immediate status shifts on device counts.
          </div>
        </div>

        <button
          onClick={() => navigate('/home')}
          className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-rose-500 text-black hover:opacity-95 transition shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2"
        >
          Start Exploring <Play className="w-4 h-4 fill-black" />
        </button>
      </div>
    </div>
  );
}
