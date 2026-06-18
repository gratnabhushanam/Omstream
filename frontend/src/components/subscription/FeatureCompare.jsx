import React from 'react';
import { Check, X } from 'lucide-react';

export default function FeatureCompare({ plans }) {
  if (!plans) return null;

  const featuresList = [
    { key: 'maxDevices', label: 'Devices Limit' },
    { key: 'maxProfiles', label: 'Family Profiles' },
    { key: 'adFree', label: 'Ad-free Experience', type: 'bool' },
    { key: 'offlineDownload', label: 'Offline Downloads', type: 'bool' },
    { key: 'maxQuality', label: 'Video Quality' },
    { key: 'aiChatLimit', label: 'AI Mentor Chats', formatter: (val) => val === -1 ? 'Unlimited' : `${val} / day` },
    { key: 'movieAccess', label: 'Movie Access', formatter: (val) => val === 'none' ? '❌' : val === 'preview' ? 'Preview' : 'Full Access' },
    { key: 'satsangAccess', label: 'Satsangs Access', type: 'bool' },
  ];

  const tiers = ['free', 'silver', 'gold', 'diamond'];

  return (
    <div className="mt-12 overflow-x-auto bg-zinc-900/40 backdrop-blur rounded-2xl border border-zinc-800 p-6">
      <h3 className="text-xl font-bold mb-6 font-sans text-center">Detailed Plan Comparison</h3>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="py-4 text-zinc-400 font-medium">Features</th>
            <th className="py-4 text-slate-400 font-bold capitalize">Sadhak (Free)</th>
            <th className="py-4 text-slate-300 font-bold capitalize">Sevak (Silver)</th>
            <th className="py-4 text-amber-500 font-bold capitalize">Bhakt (Gold)</th>
            <th className="py-4 text-violet-400 font-bold capitalize">Param Bhakt (Diamond)</th>
          </tr>
        </thead>
        <tbody>
          {featuresList.map((feat) => (
            <tr key={feat.key} className="border-b border-zinc-850 hover:bg-zinc-800/10">
              <td className="py-4 font-medium text-zinc-300">{feat.label}</td>
              {tiers.map((t) => {
                const val = plans[t]?.features[feat.key];
                return (
                  <td key={t} className="py-4">
                    {feat.type === 'bool' ? (
                      val ? <Check className="text-emerald-500 w-5 h-5" /> : <X className="text-rose-500 w-5 h-5" />
                    ) : feat.formatter ? (
                      feat.formatter(val)
                    ) : (
                      val
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
