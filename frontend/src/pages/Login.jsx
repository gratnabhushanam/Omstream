import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import DeviceLimitResolver from '../components/DeviceLimitResolver';

// ─── Country data ────────────────────────────────────────────────────────────
const COUNTRIES = [
  { name: 'India',          dial: '+91', flag: '🇮🇳', code: 'IN' },
  { name: 'United States',  dial: '+1',  flag: '🇺🇸', code: 'US' },
  { name: 'United Kingdom', dial: '+44', flag: '🇬🇧', code: 'GB' },
  { name: 'UAE',            dial: '+971',flag: '🇦🇪', code: 'AE' },
  { name: 'Saudi Arabia',   dial: '+966',flag: '🇸🇦', code: 'SA' },
  { name: 'Canada',         dial: '+1',  flag: '🇨🇦', code: 'CA' },
  { name: 'Australia',      dial: '+61', flag: '🇦🇺', code: 'AU' },
  { name: 'Singapore',      dial: '+65', flag: '🇸🇬', code: 'SG' },
  { name: 'Germany',        dial: '+49', flag: '🇩🇪', code: 'DE' },
  { name: 'Malaysia',       dial: '+60', flag: '🇲🇾', code: 'MY' },
];

const LANGUAGES = [
  { code: 'te', name: 'Telugu',    native: 'తెలుగు' },
  { code: 'hi', name: 'Hindi',     native: 'हिन्दी' },
  { code: 'en', name: 'English',   native: 'English' },
  { code: 'ta', name: 'Tamil',     native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada',   native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn', name: 'Bengali',   native: 'বাংলা' },
  { code: 'mr', name: 'Marathi',   native: 'मराठी' },
];

const INTERESTS = [
  { id: 'gita',      label: '📖 Bhagavad Gita' },
  { id: 'ramayana',  label: '🏹 Ramayana' },
  { id: 'krishna',   label: '🪈 Krishna Stories' },
  { id: 'shiva',     label: '🔱 Shiva Purana' },
  { id: 'yoga',      label: '🧘 Yoga & Meditation' },
  { id: 'music',     label: '🎵 Devotional Music' },
  { id: 'kids',      label: '🌟 Kids Stories' },
  { id: 'mahabharata',label: '⚔️ Mahabharata' },
];

const STEPS = { WELCOME: 0, PHONE: 1, DETECTED: 2, OTP: 3, ONBOARDING: 4, EMAIL_LOGIN: 5 };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const maskPhone = (dial, phone) => {
  const d = phone.replace(/\D/g, '');
  if (d.length <= 4) return `${dial} ${d}`;
  return `${dial} ${'•'.repeat(d.length - 4)}${d.slice(-4)}`;
};

// ─── OTP Box ─────────────────────────────────────────────────────────────────
function OtpBoxes({ value, onChange, onKeyDown, refs, loading }) {
  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {value.map((digit, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => onChange(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          onFocus={e => e.target.select()}
          disabled={loading}
          className={`
            w-11 h-14 sm:w-13 sm:h-16 rounded-2xl text-center text-2xl font-black
            border-2 outline-none transition-all duration-200
            bg-white/5 text-white caret-transparent
            ${digit
              ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_16px_rgba(251,191,36,0.35)]'
              : 'border-white/15 focus:border-amber-400/60 focus:bg-white/8'}
            ${loading ? 'opacity-50' : ''}
          `}
          style={{ fontSize: digit ? '1.5rem' : '1rem' }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Login() {
  const [step, setStep]                   = useState(STEPS.WELCOME);
  const [direction, setDirection]         = useState(1); // 1=forward, -1=back
  const [country, setCountry]             = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone]                 = useState('');
  const [userExists, setUserExists]       = useState(null);
  const [otp, setOtp]                     = useState(['', '', '', '', '', '']);
  const [previewCode, setPreviewCode]     = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [onboarding, setOnboarding]       = useState({ name: '', language: 'te', interests: [] });
  const [animating, setAnimating]         = useState(false);
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');

  const otpRefs    = useRef([]);
  const phoneRef   = useRef(null);
  const navigate   = useNavigate();
  const location   = useLocation();
  const returnTo   = location.state?.returnTo || '/home';
  const { sendOtpLogin, verifyOtpLogin, login } = useAuth();

  const fullPhone = country.dial + phone.replace(/\D/g, '');

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(p => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Auto focus phone on step 1
  useEffect(() => {
    if (step === STEPS.PHONE) setTimeout(() => phoneRef.current?.focus(), 350);
  }, [step]);

  // Auto focus otp[0] on step 3
  useEffect(() => {
    if (step === STEPS.OTP) setTimeout(() => otpRefs.current[0]?.focus(), 350);
  }, [step]);

  const goTo = useCallback((next, dir = 1) => {
    setDirection(dir);
    setAnimating(true);
    setError('');
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 200);
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // ── Step handlers ──────────────────────────────────────────────────────────
  const handlePhoneContinue = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) { setError('Please enter a valid mobile number'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/check-phone', { phone: fullPhone });
      setUserExists(data.exists);
      goTo(STEPS.DETECTED);
    } catch (err) {
      setError(err.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await sendOtpLogin({ phone: fullPhone });
      setPreviewCode(res.previewCode || '');
      if (res.previewCode) {
        const digits = res.previewCode.toString().split('');
        setOtp(digits.length === 6 ? digits : ['', '', '', '', '', '']);
      } else {
        setOtp(['', '', '', '', '', '']);
      }
      setResendCooldown(30);
      goTo(STEPS.OTP);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await sendOtpLogin({ phone: fullPhone });
      setPreviewCode(res.previewCode || '');
      if (res.previewCode) {
        const digits = res.previewCode.toString().split('');
        setOtp(digits.length === 6 ? digits : ['', '', '', '', '', '']);
      } else {
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
      setResendCooldown(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = useCallback((index, raw) => {
    if (!/^\d*$/.test(raw)) return;
    setOtp(prev => {
      const next = [...prev];
      next[index] = raw.slice(-1);
      // Auto-advance
      if (raw && index < 5) setTimeout(() => otpRefs.current[index + 1]?.focus(), 0);
      // Auto-submit
      if (next.every(d => d) && next.join('').length === 6) {
        setTimeout(() => submitOtp(next.join('')), 120);
      }
      return next;
    });
  }, []); // eslint-disable-line

  const handleOtpKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const submitOtp = async (code) => {
    if (code.length < 6 || loading) return;
    setError('');
    setLoading(true);
    try {
      const result = await verifyOtpLogin({ phone: fullPhone, otp: code });
      const isNewUser = result.isNew || !result.user?.name || (result.user?.name || '').startsWith('Member ');
      if (isNewUser) {
        goTo(STEPS.ONBOARDING);
      } else {
        navigate(returnTo, { replace: true });
      }
    } catch (err) {
      if (err.response?.data?.status === 'device_limit_reached') {
        setPendingRequestId(err.response.data.deviceRequestId);
      } else {
        setError(err.response?.data?.message || 'Invalid or expired OTP. Try again.');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    submitOtp(otp.join(''));
  };

  const handleOnboardingComplete = async () => {
    if (!onboarding.name.trim()) { setError('Please enter your full name'); return; }
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.put('/api/auth/profile', {
          name: onboarding.name.trim(),
          settings: { interests: onboarding.interests, preferredLanguage: onboarding.language }
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (_) { /* non-critical, continue */ }
    finally {
      setLoading(false);
      navigate(returnTo, { replace: true });
    }
  };

  const toggleInterest = (id) => {
    setOnboarding(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id]
    }));
  };

  // ── Device limit screen ────────────────────────────────────────────────────
  if (pendingRequestId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#060e1c]">
        <DeviceLimitResolver
          deviceRequestId={pendingRequestId}
          onSuccess={() => { navigate('/home', { replace: true }); window.location.reload(); }}
          onCancel={() => setPendingRequestId(null)}
        />
      </div>
    );
  }

  // ── Shared wrappers ────────────────────────────────────────────────────────
  const slideClass = `transition-all duration-300 ${animating
    ? direction > 0 ? 'opacity-0 translate-x-8' : 'opacity-0 -translate-x-8'
    : 'opacity-100 translate-x-0'}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#060e1c] relative overflow-hidden px-4 py-8">

      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.18) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 left-0 w-64 h-64 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.2) 0%, transparent 70%)' }} />
        {/* Floating orbs */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-10 animate-pulse"
            style={{
              width: `${40 + i * 20}px`, height: `${40 + i * 20}px`,
              left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%`,
              background: i % 2 === 0 ? 'rgba(251,191,36,0.3)' : 'rgba(139,92,246,0.2)',
              animationDelay: `${i * 0.7}s`, animationDuration: `${3 + i}s`
            }} />
        ))}
      </div>

      {/* ── Logo / Brand ── */}
      <div className="relative z-10 flex flex-col items-center mb-6 sm:mb-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mb-3 shadow-[0_0_40px_rgba(251,191,36,0.4)]"
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%)' }}>
          <span className="text-3xl sm:text-4xl">🪈</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-[0.2em] text-amber-400">
          Gita Wisdom
        </h1>
        <p className="text-xs text-white/40 tracking-widest uppercase mt-0.5">Divine Content Platform</p>
      </div>

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          style={{ background: 'rgba(10,18,35,0.85)', backdropFilter: 'blur(24px)' }}>

          {/* Step progress dots */}
          {step > STEPS.WELCOME && (
            <div className="flex justify-center gap-2 pt-5 pb-0">
              {[STEPS.PHONE, STEPS.DETECTED, STEPS.OTP, STEPS.ONBOARDING].map(s => (
                <div key={s} className={`h-1 rounded-full transition-all duration-500 ${
                  step === s ? 'w-6 bg-amber-400' :
                  step > s  ? 'w-3 bg-amber-400/50' : 'w-3 bg-white/15'
                }`} />
              ))}
            </div>
          )}

          <div className="p-6 sm:p-8">

            {/* ════════════════════════════════════════════════
                STEP 0 — WELCOME
            ════════════════════════════════════════════════ */}
            {step === STEPS.WELCOME && (
              <div className={`${slideClass} flex flex-col items-center text-center gap-6`}>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
                    Watch, Listen & Learn<br/>
                    <span className="text-transparent bg-clip-text"
                      style={{ backgroundImage: 'linear-gradient(90deg, #fbbf24, #f59e0b, #d97706)' }}>
                      Divine Content
                    </span>
                  </h2>
                  <p className="text-sm text-white/55 leading-relaxed max-w-xs mx-auto">
                    Experience Bhagavad Gita, devotional music, spiritual stories and timeless wisdom — all in one place.
                  </p>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap justify-center gap-2">
                  {['🎵 Music', '📖 Stories', '🧘 Yoga', '🎬 Videos'].map(f => (
                    <span key={f} className="text-xs font-semibold text-white/70 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => goTo(STEPS.PHONE)}
                  className="w-full py-4 rounded-2xl text-base font-black uppercase tracking-widest text-[#0d1520] transition-all duration-200 active:scale-95 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]"
                  style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' }}
                >
                  Continue with Mobile Number
                </button>

                <p className="text-xs text-white/30">
                  By continuing, you agree to our Terms & Privacy Policy
                </p>
              </div>
            )}

            {/* ════════════════════════════════════════════════
                STEP 1 — PHONE NUMBER
            ════════════════════════════════════════════════ */}
            {step === STEPS.PHONE && (
              <div className={`${slideClass}`}>
                <button onClick={() => goTo(STEPS.WELCOME, -1)}
                  className="text-white/40 hover:text-white text-xs uppercase tracking-wider font-semibold flex items-center gap-1 mb-5 transition-colors">
                  ← Back
                </button>

                <h2 className="text-xl sm:text-2xl font-black text-white mb-1">Enter Mobile Number</h2>
                <p className="text-sm text-white/45 mb-6">We'll send an OTP to verify your number</p>

                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-400/25 rounded-2xl px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* Phone input with country picker */}
                <div className="flex gap-2 mb-5">
                  {/* Country button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryPicker(p => !p)}
                      className="h-14 px-3 rounded-2xl border border-white/15 bg-white/5 flex items-center gap-2 text-white hover:border-amber-400/40 transition-colors whitespace-nowrap"
                    >
                      <span className="text-xl">{country.flag}</span>
                      <span className="text-sm font-bold">{country.dial}</span>
                      <span className="text-white/40 text-xs">▾</span>
                    </button>

                    {showCountryPicker && (
                      <div className="absolute top-16 left-0 z-50 w-56 rounded-2xl border border-white/15 shadow-2xl overflow-y-auto max-h-56"
                        style={{ background: 'rgba(10,18,35,0.97)', backdropFilter: 'blur(20px)' }}>
                        {COUNTRIES.map(c => (
                          <button key={c.code} type="button"
                            onClick={() => { setCountry(c); setShowCountryPicker(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/8 transition-colors ${c.code === country.code ? 'text-amber-400' : 'text-white/80'}`}>
                            <span className="text-lg">{c.flag}</span>
                            <span className="flex-1">{c.name}</span>
                            <span className="text-white/40 font-mono text-xs">{c.dial}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Number input */}
                  <input
                    ref={phoneRef}
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handlePhoneContinue()}
                    placeholder="Mobile Number"
                    maxLength={12}
                    className="flex-1 h-14 rounded-2xl border border-white/15 bg-white/5 px-4 text-white text-base font-semibold outline-none focus:border-amber-400/60 transition-colors placeholder-white/25"
                  />
                </div>

                <p className="text-xs text-white/35 mb-5 text-center">
                  {country.flag} {country.name} • OTP via SMS
                </p>

                <button
                  onClick={handlePhoneContinue}
                  disabled={loading || phone.replace(/\D/g,'').length < 7}
                  className="w-full py-4 rounded-2xl text-base font-black uppercase tracking-widest text-[#0d1520] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                      </svg>
                      Checking...
                    </span>
                  ) : 'Continue'}
                </button>
              </div>
            )}

            {/* ════════════════════════════════════════════════
                STEP 2 — SMART DETECTION
            ════════════════════════════════════════════════ */}
            {step === STEPS.DETECTED && (
              <div className={`${slideClass}`}>
                <button onClick={() => goTo(STEPS.PHONE, -1)}
                  className="text-white/40 hover:text-white text-xs uppercase tracking-wider font-semibold flex items-center gap-1 mb-5 transition-colors">
                  ← Change Number
                </button>

                {/* Phone display */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-6">
                  <span className="text-xl">{country.flag}</span>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Mobile Number</p>
                    <p className="text-base font-black text-white">{maskPhone(country.dial, phone)}</p>
                  </div>
                  <button onClick={() => goTo(STEPS.PHONE, -1)} className="ml-auto text-amber-400 text-xs font-bold uppercase tracking-wider hover:underline">
                    Edit
                  </button>
                </div>

                {/* Result card */}
                <div className={`rounded-2xl p-5 mb-6 border text-center ${
                  userExists
                    ? 'bg-emerald-500/8 border-emerald-500/25'
                    : 'bg-amber-500/8 border-amber-400/25'
                }`}>
                  <div className="text-3xl mb-2">{userExists ? '👋' : '🌟'}</div>
                  <h3 className={`text-lg font-black mb-1 ${userExists ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {userExists ? 'Welcome Back!' : 'New Here?'}
                  </h3>
                  <p className="text-sm text-white/60">
                    {userExists
                      ? 'We found your account. Verify with OTP to continue.'
                      : 'Create your account in seconds — just verify your number.'}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-400/25 rounded-2xl px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl text-base font-black uppercase tracking-widest text-[#0d1520] transition-all duration-200 active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' }}
                >
                  {loading ? 'Sending OTP...' : userExists ? '🔐 Login with OTP' : '✨ Create Account'}
                </button>

                <p className="text-xs text-white/35 text-center mt-4">
                  OTP will be sent to your mobile number via SMS
                </p>
              </div>
            )}

            {/* ════════════════════════════════════════════════
                STEP 3 — OTP VERIFICATION
            ════════════════════════════════════════════════ */}
            {step === STEPS.OTP && (
              <div className={`${slideClass}`}>
                <button onClick={() => { goTo(STEPS.DETECTED, -1); setOtp(['','','','','','']); }}
                  className="text-white/40 hover:text-white text-xs uppercase tracking-wider font-semibold flex items-center gap-1 mb-5 transition-colors">
                  ← Back
                </button>

                <h2 className="text-xl sm:text-2xl font-black text-white mb-1">Verify OTP</h2>
                <p className="text-sm text-white/45 mb-1">OTP sent to</p>
                <p className="text-base font-bold text-amber-400 mb-6">{maskPhone(country.dial, phone)}</p>

                {/* Dev preview code */}
                {previewCode && (
                  <div className="mb-5 rounded-2xl border-2 border-amber-400/40 bg-amber-500/8 px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-amber-400/70 font-bold mb-0.5">⚠️ Dev Mode — SMS not configured</p>
                      <p className="text-2xl font-black text-amber-400 tracking-[0.4em] font-mono">{previewCode}</p>
                    </div>
                    <button onClick={() => {
                      const d = previewCode.toString().split('');
                      setOtp(d.length === 6 ? d : ['','','','','','']);
                    }} className="text-xs bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 px-3 py-2 rounded-xl font-bold transition-colors shrink-0">
                      Use Code
                    </button>
                  </div>
                )}

                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-400/25 rounded-2xl px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <form onSubmit={handleVerifyOtp}>
                  <div className="mb-6">
                    <OtpBoxes
                      value={otp}
                      onChange={handleOtpChange}
                      onKeyDown={handleOtpKeyDown}
                      refs={otpRefs}
                      loading={loading}
                    />
                  </div>

                  {/* Resend */}
                  <div className="flex items-center justify-between text-xs mb-5">
                    <span className="text-white/35">Expires in 5 minutes</span>
                    {resendCooldown > 0 ? (
                      <span className="text-white/35 font-bold">Resend in {resendCooldown}s</span>
                    ) : (
                      <button type="button" onClick={handleResendOtp} disabled={loading}
                        className="text-amber-400 font-bold hover:underline disabled:opacity-50 uppercase tracking-wider">
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <button type="submit" disabled={loading || otp.join('').length < 6}
                    className="w-full py-4 rounded-2xl text-base font-black uppercase tracking-widest text-[#0d1520] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' }}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                        </svg>
                        Verifying...
                      </span>
                    ) : `Verify & ${userExists ? 'Sign In' : 'Create Account'}`}
                  </button>
                </form>
              </div>
            )}

            {/* ════════════════════════════════════════════════
                STEP 4 — NEW USER ONBOARDING
            ════════════════════════════════════════════════ */}
            {step === STEPS.ONBOARDING && (
              <div className={`${slideClass}`}>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">🎉</div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mb-1">Account Created!</h2>
                  <p className="text-sm text-white/50">Tell us a bit about yourself</p>
                </div>

                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-400/25 rounded-2xl px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* Name */}
                <div className="mb-4">
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={onboarding.name}
                    onChange={e => { setOnboarding(p => ({ ...p, name: e.target.value })); setError(''); }}
                    placeholder="Your name"
                    autoFocus
                    className="w-full h-13 rounded-2xl border border-white/15 bg-white/5 px-4 text-white text-base font-semibold outline-none focus:border-amber-400/60 transition-colors placeholder-white/25"
                    style={{ height: '3.25rem' }}
                  />
                </div>

                {/* Language */}
                <div className="mb-4">
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2">
                    Preferred Language
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(l => (
                      <button key={l.code} type="button"
                        onClick={() => setOnboarding(p => ({ ...p, language: l.code }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          onboarding.language === l.code
                            ? 'bg-amber-400/20 border-amber-400 text-amber-400'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/25'
                        }`}>
                        {l.native}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div className="mb-6">
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2">
                    Your Interests <span className="text-white/30 normal-case">(optional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map(interest => (
                      <button key={interest.id} type="button"
                        onClick={() => toggleInterest(interest.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          onboarding.interests.includes(interest.id)
                            ? 'bg-amber-400/20 border-amber-400 text-amber-400'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                        }`}>
                        {interest.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleOnboardingComplete}
                  disabled={loading || !onboarding.name.trim()}
                  className="w-full py-4 rounded-2xl text-base font-black uppercase tracking-widest text-[#0d1520] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' }}>
                  {loading ? 'Setting Up...' : '🚀 Start My Journey'}
                </button>

                <button onClick={() => navigate(returnTo, { replace: true })}
                  className="w-full mt-3 py-2 text-xs text-white/30 hover:text-white/50 transition-colors">
                  Skip for now
                </button>
              </div>
            )}

            {/* ════════════════════════════════════════════════
                STEP 5 — ADMIN / EMAIL LOGIN
            ════════════════════════════════════════════════ */}
            {step === STEPS.EMAIL_LOGIN && (
              <div className={`${slideClass}`}>
                <button onClick={() => goTo(STEPS.WELCOME, -1)}
                  className="text-white/40 hover:text-white text-xs uppercase tracking-wider font-semibold flex items-center gap-1 mb-5 transition-colors">
                  ← Back to OTP
                </button>

                <h2 className="text-xl sm:text-2xl font-black text-white mb-1">Admin Login</h2>
                <p className="text-sm text-white/45 mb-6">Login with your email and password</p>

                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-400/25 rounded-2xl px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEmailLogin}>
                  <div className="mb-4">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full h-14 rounded-2xl border border-white/15 bg-white/5 px-4 text-white text-base font-semibold outline-none focus:border-amber-400/60 transition-colors placeholder-white/25"
                    />
                  </div>
                  <div className="mb-6">
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full h-14 rounded-2xl border border-white/15 bg-white/5 px-4 text-white text-base font-semibold outline-none focus:border-amber-400/60 transition-colors placeholder-white/25"
                    />
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-4 rounded-2xl text-base font-black uppercase tracking-widest text-[#0d1520] transition-all duration-200 active:scale-95 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' }}>
                    {loading ? 'Logging In...' : 'Login Securely'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-2 mt-5">
          <p className="text-center text-xs text-white/25">
            🔒 Your data is encrypted and secure
          </p>
          {step !== STEPS.EMAIL_LOGIN && (
            <button onClick={() => goTo(STEPS.EMAIL_LOGIN)} className="text-[10px] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors font-bold">
              Admin / Email Login
            </button>
          )}
        </div>
      </div>

      {/* Click outside country picker */}
      {showCountryPicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowCountryPicker(false)} />
      )}
    </div>
  );
}
