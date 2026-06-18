import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Sparkles, Shield, BookOpen, Heart } from 'lucide-react';
import heroImage from '../assets/hero.png';
import '../styles/auth.css';

export default function ForgotPassword() {
  const RESEND_COOLDOWN_SECONDS = 60;
  const [step, setStep] = useState('request');
  const [loading, setLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [previewCode, setPreviewCode] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timer = setInterval(() => {
      setResendCooldown((seconds) => {
        if (seconds <= 1) return 0;
        return seconds - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const requestResetOtp = async () => {
    const response = await axios.post('/api/auth/forgot-password/request-otp', {
      email: formData.email,
    });

    const apiMessage = response.data?.message || 'OTP sent to your email.';
    const retryAfterSeconds = Number(response.data?.retryAfterSeconds || RESEND_COOLDOWN_SECONDS);
    setStep('verify');
    setResendCooldown(Math.max(0, retryAfterSeconds));
    setMessage({
      type: 'success',
      text: apiMessage,
    });
    if (response.data?.previewCode) {
      setPreviewCode(response.data.previewCode);
    } else {
      setPreviewCode('');
    }
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateEmail(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    try {
      setLoading(true);
      await requestResetOtp();
    } catch (error) {
      const retryAfterSeconds = Number(error?.response?.data?.retryAfterSeconds || 0);
      if (retryAfterSeconds > 0) {
        setStep('verify');
        setResendCooldown(retryAfterSeconds);
      }
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send OTP.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.otp.trim()) {
      setMessage({ type: 'error', text: 'Please enter the OTP.' });
      return;
    }

    if (String(formData.newPassword).trim().length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/auth/forgot-password/verify-otp', {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });

      setResetComplete(true);
      setResendCooldown(0);
      setMessage({ type: 'success', text: response.data?.message || 'Password reset successful. Please sign in.' });
      setFormData((current) => ({ ...current, otp: '', newPassword: '', confirmPassword: '' }));
      setTimeout(() => {
        setStep('request');
        setResetComplete(false);
        setMessage({ type: '', text: '' });
      }, 1200);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page flex min-h-screen items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="auth-stage mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <section className="auth-hero rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="relative z-10 flex h-full flex-col gap-8">
            <div className="space-y-6">
              <div className="auth-badge w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                Krishna Flow
              </div>

              <div className="max-w-2xl space-y-5">
                <h1 className="text-5xl font-serif font-black uppercase leading-none tracking-tight text-[#f7d77d] sm:text-7xl">
                  Reset Access
                </h1>
                <p className="auth-quote max-w-xl text-lg leading-relaxed sm:text-xl">
                  Recover your Omstream account with OTP verification and return to your spiritual learning journey.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <BookOpen className="mb-3 h-5 w-5 text-[#f7d77d]" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/90">Recover</p>
                  <p className="mt-1 text-xs text-white/70">Restore access with one-time OTP.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <Heart className="mb-3 h-5 w-5 text-[#f7d77d]" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/90">Continue</p>
                  <p className="mt-1 text-xs text-white/70">Return quickly to your saved journey.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <Shield className="mb-3 h-5 w-5 text-[#f7d77d]" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/90">Secure</p>
                  <p className="mt-1 text-xs text-white/70">Strong password update via verified OTP.</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/20 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:p-6">
              <div className="absolute inset-0 bg-gradient-to-t from-[#06101e]/90 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,215,0,0.18),transparent_30%),radial-gradient(circle_at_70%_70%,rgba(255,164,54,0.12),transparent_24%)]"></div>
              <img src={heroImage} alt="Krishna theme" className="auth-floating-image relative z-10 w-full rounded-[1.4rem] object-cover shadow-[0_20px_50px_rgba(0,0,0,0.35)]" />
            </div>
          </div>
        </section>

        <section className="auth-card rounded-[2rem] p-6 sm:p-8">
          <div className="relative z-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.32em] text-[#f7d77d]/85">Account Recovery</p>
                <h2 className="mt-2 text-3xl font-serif font-black uppercase tracking-tight text-white">Forgot Password</h2>
              </div>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-[#f7d77d]">
                <ArrowLeft className="h-4 w-4" />
                Login
              </Link>
            </div>

            {message.text && (
              <div className={`mb-5 rounded-2xl border p-4 text-sm ${message.type === 'success' ? 'border-green-400/25 bg-green-500/10 text-green-200' : 'border-red-400/25 bg-red-500/10 text-red-200'}`}>
                {message.text}
              </div>
            )}

            {previewCode && (
              <div className="mb-5 rounded-2xl border border-[#f7d77d]/30 bg-[#f7d77d]/10 p-4 text-sm text-[#ffe3a3] flex items-center gap-3 animate-pulse">
                <Shield className="h-5 w-5 text-[#f7d77d] shrink-0" />
                <div>
                  <span className="font-bold">Testing/Fallback Mode:</span> Use code <span className="font-mono font-black text-white text-base bg-black/40 px-2 py-0.5 rounded border border-[#f7d77d]/35">{previewCode}</span> to verify.
                </div>
              </div>
            )}

            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { id: 'request', label: 'Request OTP' },
                  { id: 'verify', label: 'Verify OTP' },
                  { id: 'done', label: 'Reset Done' },
                ].map((item, index) => {
                  const isActive = (item.id === 'request' && step === 'request' && !resetComplete)
                    || (item.id === 'verify' && step === 'verify' && !resetComplete)
                    || (item.id === 'done' && resetComplete);
                  const isCompleted = (item.id === 'request' && (step === 'verify' || resetComplete))
                    || (item.id === 'verify' && resetComplete)
                    || (item.id === 'done' && resetComplete);

                  return (
                    <div key={item.id} className="flex flex-col items-center gap-2">
                      <div className={`h-8 w-8 rounded-full border text-[11px] font-black flex items-center justify-center transition-all ${isCompleted ? 'border-[#f7d77d] bg-[#f7d77d]/20 text-[#f7d77d]' : isActive ? 'border-white/40 bg-white/10 text-white animate-pulse' : 'border-white/15 bg-transparent text-white/45'}`}>
                        {index + 1}
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isCompleted || isActive ? 'text-white/85' : 'text-white/40'}`}>
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {step === 'request' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                    Signup Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                    placeholder="arjuna@example.com"
                    className="auth-input"
                  />
                </div>

                <button type="submit" disabled={loading} className="auth-button mt-2 w-full px-5 py-3.5">
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                    OTP Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    required
                    value={formData.otp}
                    onChange={(event) => setFormData((current) => ({ ...current, otp: event.target.value }))}
                    placeholder="Enter OTP"
                    className="auth-input"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    required
                    minLength={6}
                    value={formData.newPassword}
                    onChange={(event) => setFormData((current) => ({ ...current, newPassword: event.target.value }))}
                    placeholder="Enter new password"
                    className="auth-input"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={formData.confirmPassword}
                    onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
                    placeholder="Re-enter new password"
                    className="auth-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white/80 hover:text-white"
                  >
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="auth-button w-full px-5 py-3.5">
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>

                <button
                  type="button"
                  disabled={loading || resendCooldown > 0}
                  onClick={async () => {
                    setMessage({ type: '', text: '' });
                    try {
                      setLoading(true);
                      await requestResetOtp();
                    } catch (error) {
                      const retryAfterSeconds = Number(error?.response?.data?.retryAfterSeconds || 0);
                      if (retryAfterSeconds > 0) {
                        setResendCooldown(retryAfterSeconds);
                      }
                      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to resend OTP.' });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full rounded-2xl border border-[#f7d77d]/30 bg-[#f7d77d]/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#f7d77d] hover:bg-[#f7d77d]/15 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Please wait...' : resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                </button>
                <p className="text-center text-[11px] uppercase tracking-[0.14em] text-white/45">
                  For security, OTP can be resent once per minute.
                </p>
              </form>
            )}

            <div className="auth-divider my-6 flex items-center justify-center">
              <span className="relative z-10 bg-[#0d1520] px-3 text-xs uppercase tracking-[0.28em] text-white/45">or</span>
            </div>

            <p className="text-center text-sm text-white/70">
              Ready to sign in?{' '}
              <Link to="/login" className="auth-link inline-flex items-center gap-2">
                Go to Login <ArrowRight className="h-4 w-4" />
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
