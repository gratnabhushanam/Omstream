import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, X } from 'lucide-react';

export default function UpgradePrompt({ isOpen, onClose, requiredTier, featureName }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    onClose();
    navigate('/subscription');
  };

  const getTierColor = () => {
    switch (requiredTier?.toLowerCase()) {
      case 'silver': return 'text-zinc-300 bg-zinc-900 border-zinc-800';
      case 'gold': return 'text-amber-500 bg-amber-950/20 border-amber-900/40';
      case 'diamond': return 'text-violet-400 bg-violet-950/20 border-violet-900/40';
      default: return 'text-amber-500 bg-amber-950/20 border-amber-900/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-905 border border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20">
            <Lock className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold mb-2">Premium Feature Locked</h3>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            {featureName ? `Accessing ${featureName}` : 'This exclusive content'} requires a higher level subscription tier. Upgrade your plan to unlock instant access.
          </p>

          {requiredTier && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold mb-8 ${getTierColor()}`}>
              Required: {requiredTier.toUpperCase()}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={handleUpgradeClick}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 transition shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
            >
              Explore Tiers <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800/20 transition"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
