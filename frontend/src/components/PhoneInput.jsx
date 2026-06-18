import React, { useState, useEffect, useRef } from 'react';

const countries = [
  { name: 'India', code: 'IN', dial: '+91', flag: '🇮🇳' },
  { name: 'United States', code: 'US', dial: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dial: '+44', flag: '🇬🇧' },
  { name: 'Australia', code: 'AU', dial: '+61', flag: '🇦🇺' },
  { name: 'Canada', code: 'CA', dial: '+1', flag: '🇨🇦' },
  { name: 'United Arab Emirates', code: 'AE', dial: '+971', flag: '🇦🇪' },
  { name: 'Singapore', code: 'SG', dial: '+65', flag: '🇸🇬' },
  { name: 'Germany', code: 'DE', dial: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dial: '+33', flag: '🇫🇷' },
  { name: 'Japan', code: 'JP', dial: '+81', flag: '🇯🇵' },
  { name: 'New Zealand', code: 'NZ', dial: '+64', flag: '🇳🇿' },
  { name: 'South Africa', code: 'ZA', dial: '+27', flag: '🇿🇦' },
  { name: 'Saudi Arabia', code: 'SA', dial: '+966', flag: '🇸🇦' },
  { name: 'Malaysia', code: 'MY', dial: '+60', flag: '🇲🇾' },
  { name: 'Netherlands', code: 'NL', dial: '+31', flag: '🇳🇱' },
  { name: 'Switzerland', code: 'CH', dial: '+41', flag: '🇨🇭' },
  { name: 'Sweden', code: 'SE', dial: '+46', flag: '🇸🇪' },
  { name: 'Spain', code: 'ES', dial: '+34', flag: '🇪🇸' },
  { name: 'Italy', code: 'IT', dial: '+39', flag: '🇮🇹' },
  { name: 'Brazil', code: 'BR', dial: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: 'MX', dial: '+52', flag: '🇲🇽' }
];

export default function PhoneInput({ value, onChange, selectedCountry, setSelectedCountry }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (selectedCountry) return;
    
    // Guess default country from browser timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    let guessedCode = 'US';
    if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('Asia/Kolkata')) {
      guessedCode = 'IN';
    } else if (tz.includes('London') || tz.includes('Europe/London')) {
      guessedCode = 'GB';
    } else if (tz.includes('Australia') || tz.includes('Sydney') || tz.includes('Melbourne')) {
      guessedCode = 'AU';
    } else if (tz.includes('Singapore')) {
      guessedCode = 'SG';
    } else if (tz.includes('Tokyo') || tz.includes('Asia/Tokyo')) {
      guessedCode = 'JP';
    }
    
    const found = countries.find(c => c.code === guessedCode);
    if (found) setSelectedCountry(found);

    // Precise IP geo lookup
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.country_code) {
          const precise = countries.find(c => c.code === data.country_code);
          if (precise) setSelectedCountry(precise);
        }
      })
      .catch(() => {});
  }, [selectedCountry, setSelectedCountry]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeCountry = selectedCountry || countries[0];

  return (
    <div className="flex gap-2 relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white hover:bg-white/10 transition-colors"
      >
        <span className="text-lg">{activeCountry.flag}</span>
        <span className="font-semibold text-white/80">{activeCountry.dial}</span>
      </button>

      <input
        type="tel"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="1234567890"
        className="auth-input flex-1 shadow-[0_0_0_4px_rgba(255,215,0,0.0)] focus:shadow-[0_0_0_4px_rgba(255,215,0,0.12)]"
      />

      {showDropdown && (
        <div className="absolute top-[110%] left-0 z-50 w-72 rounded-2xl border border-white/10 bg-[#0d1520] p-3 shadow-2xl animate-fade-in max-h-80 overflow-hidden flex flex-col">
          <input
            type="text"
            placeholder="Search country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#f7d77d] mb-2"
          />
          <div className="overflow-y-auto space-y-1 pr-1 custom-scrollbar flex-1">
            {countries
              .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.dial.includes(searchQuery))
              .map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(c);
                    setShowDropdown(false);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm text-white hover:bg-white/10 hover:text-[#f7d77d] transition-colors text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{c.flag}</span>
                    <span className="truncate max-w-[140px] text-white font-semibold">{c.name}</span>
                  </span>
                  <span className="font-extrabold text-amber-400">{c.dial}</span>
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
