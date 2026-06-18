import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Sparkles, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const COUNTRIES = [
  { name: 'India',          dial: '+91', flag: '🇮🇳', code: 'IN' },
  { name: 'United States',  dial: '+1',  flag: '🇺🇸', code: 'US' },
  { name: 'United Kingdom', dial: '+44', flag: '🇬🇧', code: 'GB' }
];

export default function Register() {
  const [step, setStep] = useState(1); // 1: Input details, 2: OTP verify
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isPhoneSignup, setIsPhoneSignup] = useState(false);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewCode, setPreviewCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef([]);
  const navigate = useNavigate();
  const { register, verifyRegisterOtp } = useAuth();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(p => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!name || !password) {
      setError('Name and Password are required');
      return;
    }
    if (isPhoneSignup && !phone) {
      setError('Mobile number is required');
      return;
    }
    if (!isPhoneSignup && !email) {
      setError('Email address is required');
      return;
    }

    setError('');
    setLoading(true);

    const fullPhone = isPhoneSignup ? (country.dial + phone.replace(/\D/g, '')) : '';
    const registrationEmail = isPhoneSignup ? `${phone.trim()}@gitawisdom.mock` : email.toLowerCase().trim();

    try {
      const data = await register(
        name.trim(),
        registrationEmail,
        fullPhone || undefined,
        password
      );

      setPreviewCode(data.previewCode || '');
      if (data.previewCode) {
        const digits = data.previewCode.toString().split('');
        setOtp(digits.length === 6 ? digits : ['', '', '', '', '', '']);
      }
      setResendCooldown(60);
      setStep(2);
      setTimeout(() => otpRefs.current[0]?.focus(), 350);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = useCallback((index, raw) => {
    if (!/^\d*$/.test(raw)) return;
    setOtp(prev => {
      const next = [...prev];
      next[index] = raw.slice(-1);
      if (raw && index < 5) setTimeout(() => otpRefs.current[index + 1]?.focus(), 0);
      return next;
    });
  }, []);

  const handleOtpKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    setError('');
    setLoading(true);
    const registrationEmail = isPhoneSignup ? `${phone.trim()}@gitawisdom.mock` : email.toLowerCase().trim();

    try {
      await verifyRegisterOtp(registrationEmail, code);

      navigate('/subscription', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Try again.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#060e1c] relative overflow-hidden px-4 py-8">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] h-[350px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.15) 0%, transparent 70%)' }} />
      </div>

      {/* Brand logo */}
      <div className="relative z-10 flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(251,191,36,0.3)] bg-gradient-to-br from-amber-400 to-amber-600">
          <span className="text-3xl">🪈</span>
        </div>
        <h1 className="text-xl font-black uppercase tracking-[0.2em] text-amber-400">Omstream</h1>
        <p className="text-[10px] text-white/40 tracking-widest uppercase mt-0.5 font-bold">Stream Wisdom. Anytime.</p>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl border border-white/10 shadow-2xl bg-zinc-950/80 backdrop-blur-2xl p-6 sm:p-8">
          
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-white">Create Account</h2>
                <p className="text-xs text-zinc-400">Join Omstream to explore sacred learnings</p>
              </div>

              {error && (
                <div className="bg-rose-950/30 border border-rose-900 text-rose-300 rounded-xl p-3 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Toggle Email / Phone */}
              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => { setIsPhoneSignup(false); setError(''); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${!isPhoneSignup ? 'bg-amber-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'}`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => { setIsPhoneSignup(true); setError(''); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${isPhoneSignup ? 'bg-amber-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'}`}
                >
                  Mobile Number
                </button>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-white text-sm font-semibold outline-none focus:border-amber-400/60 transition-colors placeholder-white/20"
                />
              </div>

              {/* Email or Phone */}
              {!isPhoneSignup ? (
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-white text-sm font-semibold outline-none focus:border-amber-400/60 transition-colors placeholder-white/20"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Mobile Number</label>
                  <div className="flex gap-2">
                    <select
                      value={country.code}
                      onChange={e => setCountry(COUNTRIES.find(c => c.code === e.target.value))}
                      className="h-11 rounded-xl border border-white/10 bg-zinc-900 px-2 text-white text-xs font-bold outline-none"
                    >
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.dial}</option>)}
                    </select>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit number"
                      className="flex-1 h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-white text-sm font-semibold outline-none focus:border-amber-400/60 transition-colors placeholder-white/20"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 pl-3 pr-10 text-white text-sm font-semibold outline-none focus:border-amber-400/60 transition-colors placeholder-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 hover:bg-amber-300 active:scale-98 transition disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Continue & Verify'}
              </button>

              <p className="text-center text-xs text-zinc-400 mt-2">
                Already have an account?{' '}
                <Link to="/login" className="text-amber-400 font-bold hover:underline">Log in</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError(''); }}
                  className="text-zinc-400 hover:text-white text-xs uppercase tracking-wider font-bold flex items-center gap-1 mb-2 transition-colors"
                >
                  ← Edit Details
                </button>
                <h2 className="text-xl font-black text-white">Enter OTP Code</h2>
                <p className="text-xs text-zinc-400 mt-1">We sent a 6-digit verification code to your {isPhoneSignup ? 'mobile' : 'email'}</p>
              </div>

              {error && (
                <div className="bg-rose-950/30 border border-rose-900 text-rose-300 rounded-xl p-3 text-xs font-semibold">
                  {error}
                </div>
              )}

              {previewCode && (
                <div className="border border-amber-400/20 bg-amber-400/5 rounded-xl p-3 text-center space-y-1">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Development Preview Code</p>
                  <p className="text-xl font-mono font-black text-amber-300 tracking-[0.2em]">{previewCode}</p>
                </div>
              )}

              {/* OTP Inputs */}
              <div className="flex gap-2 justify-between">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 rounded-xl text-center text-lg font-black border border-white/15 bg-white/5 text-white focus:border-amber-400 focus:bg-white/10 outline-none transition-all"
                  />
                ))}
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Expires in 5 minutes</span>
                {resendCooldown > 0 ? (
                  <span className="text-zinc-400 font-bold">Resend in {resendCooldown}s</span>
                ) : (
                  <button type="button" onClick={handleSendOtp} className="text-amber-400 font-bold hover:underline">Resend OTP</button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length < 6}
                className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 hover:bg-amber-300 active:scale-98 transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Signup'}
              </button>
            </form>
          )}

          {/* Trust indicators */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> Secure SSL Connection
          </div>

        </div>
      </div>
    </div>
  );
}
