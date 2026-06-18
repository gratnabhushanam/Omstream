import React from 'react';

export default function PlanToggle({ value, onChange }) {
  const options = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'quarterly', label: 'Quarterly', discount: 'Save ~15%' },
    { key: 'annual', label: 'Annual', discount: 'Save ~33%' }
  ];

  const getSliderPosition = () => {
    switch (value) {
      case 'monthly': return 'w-1/3 left-1';
      case 'quarterly': return 'w-1/3 left-[34%]';
      case 'annual': return 'w-1/3 left-[67%]';
      default: return 'w-1/3 left-1';
    }
  };

  return (
    <div className="billing-toggle-container">
      <div className="billing-toggle relative h-12 w-80 md:w-96">
        <div className={`absolute top-1 bottom-1 bg-amber-500 rounded-full transition-all duration-300 ease-out z-0 ${getSliderPosition()}`}></div>
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`flex-1 flex items-center justify-center text-xs md:text-sm font-semibold rounded-full relative z-10 transition-colors duration-200 ${
              value === opt.key ? 'text-black font-extrabold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {opt.label}
            {opt.discount && (
              <span className={`text-[9px] ml-1 px-1 py-0.5 rounded font-extrabold ${
                value === opt.key ? 'bg-black/10 text-black' : 'bg-emerald-950 text-emerald-400'
              }`}>
                {opt.discount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
