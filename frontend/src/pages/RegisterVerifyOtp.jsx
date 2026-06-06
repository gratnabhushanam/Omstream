import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DeviceLimitResolver from '../components/DeviceLimitResolver';
import { ArrowLeft, ArrowRight, MailCheck, RotateCcw, Shield, Sparkles, KeyRound } from 'lucide-react';
import heroImage from '../assets/hero.png';
import '../styles/auth.css';

export default function RegisterVerifyOtp() {
  const RESEND_COOLDOWN_SECONDS = 60;
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyRegisterOtp, resendRegisterOtp } = useAuth();

  const sessionPending = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('pending_registration_v1');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const initialEmail = String(location.state?.email || sessionPending?.email || '').trim();
  const initialPhone = String(location.state?.phoneNumber || sessionPending?.phoneNumber || '').trim();
  const [email] = useState(initialEmail);
  const [phoneNumber] = useState(initialPhone);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(
    initialPhone 
      ? 'Enter the OTP sent to your mobile number to complete account creation.'
      : 'Enter the OTP sent to your email to complete account creation.'
  );
  const [loading, setLoading] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(() => Number(location.state?.retryAfterSeconds || sessionPending?.retryAfterSeconds || 0));
  const [previewCode, setPreviewCode] = useState(() => location.state?.previewCode || sessionPending?.previewCode || '');
  const [pendingRequestId, setPendingRequestId] = useState(null);

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (otpResendCooldown <= 0) return undefined;

    const timer = setInterval(() => {
      setOtpResendCooldown((seconds) => {
        if (seconds <= 1) return 0;
        return seconds - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpResendCooldown]);

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError('');

    if (!email) {
      setError('Registration session expired. Please register again.');
      return;
    }

    if (otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      await verifyRegisterOtp(email, otpCode);
      sessionStorage.removeItem('pending_registration_v1');
      navigate('/home', { replace: true });
    } catch (err) {
      if (err.response?.data?.status === 'device_limit_reached') {
        setPendingRequestId(err.response.data.deviceRequestId);
      } else {
        setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;

    try {
      setLoading(true);
      setError('');
      const response = await resendRegisterOtp(email);
      const retryAfterSeconds = Number(response?.retryAfterSeconds || RESEND_COOLDOWN_SECONDS);
      setOtpResendCooldown(retryAfterSeconds);
      setInfoMessage(
        response?.message || 
        (phoneNumber 
          ? 'A new OTP has been sent to your mobile number.' 
          : 'A new OTP has been sent to your email.')
      );
      if (response?.previewCode) {
        setPreviewCode(response.previewCode);
      } else {
        setPreviewCode('');
      }
    } catch (err) {
      const retryAfterSeconds = Number(err.response?.data?.retryAfterSeconds || 0);
      if (retryAfterSeconds > 0) {
        setOtpResendCooldown(retryAfterSeconds);
      }
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (pendingRequestId) {
    return (
      <div className="auth-page flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8 bg-[#06101E]">
        <DeviceLimitResolver 
          deviceRequestId={pendingRequestId}
          onSuccess={() => {
            sessionStorage.removeItem('pending_registration_v1');
            navigate('/home', { replace: true });
            window.location.reload();
          }}
          onCancel={() => setPendingRequestId(null)}
        />
      </div>
    );
  }

  return (
    <div className="auth-page flex min-h-screen items-start px-4 py-6 sm:px-6 lg:px-8">
      <div className="auth-stage mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
        <section className="auth-card order-2 rounded-[2rem] p-6 sm:p-8 lg:order-1 lg:sticky lg:top-8 lg:self-start">
          <div className="relative z-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.32em] text-[#f7d77d]/85">Final step</p>
                <h2 className="mt-2 text-3xl font-serif font-black uppercase tracking-tight text-white">Verify OTP</h2>
              </div>
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-[#f7d77d]">
                <ArrowLeft className="h-4 w-4" />
                Register
              </Link>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            {infoMessage && (
              <div className="mb-5 rounded-2xl border border-emerald-300/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                {infoMessage}
              </div>
            )}

            {previewCode && (
              <div className="mb-5 rounded-2xl border border-[#f7d77d]/30 bg-[#f7d77d]/10 p-4 text-sm text-[#ffe3a3] flex items-center gap-3 animate-pulse">
                <KeyRound className="h-5 w-5 text-[#f7d77d] shrink-0" />
                <div>
                  <span className="font-bold">Testing/Fallback Mode:</span> Use code <span className="font-mono font-black text-white text-base bg-black/40 px-2 py-0.5 rounded border border-[#f7d77d]/35">{previewCode}</span> to verify.
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  className="auth-input opacity-70"
                />
              </div>

              <div className="rounded-2xl border border-[#f7d77d]/25 bg-[#f7d77d]/8 p-4">
                <label htmlFor="otp" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f7d77d]">
                  <MailCheck className="h-4 w-4" /> Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  className="auth-input text-center text-lg tracking-[0.4em]"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || otpResendCooldown > 0}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f7d77d] hover:text-[#ffe3a3] disabled:opacity-60"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> {otpResendCooldown > 0 ? `Resend in ${otpResendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
                <p className="mt-2 text-right text-[11px] uppercase tracking-[0.14em] text-white/45">
                  For security, OTP can be resent once per minute.
                </p>
              </div>

              <button type="submit" disabled={loading} className="auth-button mt-2 w-full px-5 py-3.5">
                {loading ? 'Please wait...' : 'Verify OTP & Create Account'}
              </button>
            </form>

            <div className="auth-divider my-6 flex items-center justify-center">
              <span className="relative z-10 bg-[#0d1520] px-3 text-xs uppercase tracking-[0.28em] text-white/45">or</span>
            </div>

            <p className="text-center text-sm text-white/70">
              Already have an account?{' '}
              <Link to="/login" className="auth-link inline-flex items-center gap-2">
                Sign in <ArrowRight className="h-4 w-4" />
              </Link>
            </p>
          </div>
        </section>

        <section className="auth-hero order-1 rounded-[2rem] p-6 sm:p-8 lg:order-2 lg:p-10">
          <div className="relative z-10 flex h-full flex-col gap-8">
            <div className="space-y-6">
              <div className="auth-badge w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                Protected signup
              </div>

              <div className="max-w-2xl space-y-5">
                <h1 className="text-5xl font-serif font-black uppercase leading-none tracking-tight text-[#f7d77d] sm:text-7xl">
                  Secure Verify
                </h1>
                <p className="auth-quote max-w-xl text-lg leading-relaxed sm:text-xl">
                  We send a one-time code to your email. Verify it here to activate your account securely.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <Shield className="mb-3 h-5 w-5 text-[#f7d77d]" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/90">Email Auth</p>
                  <p className="mt-1 text-xs text-white/70">OTP is delivered by email, not shown in UI.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <KeyRound className="mb-3 h-5 w-5 text-[#f7d77d]" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/90">One-time OTP</p>
                  <p className="mt-1 text-xs text-white/70">Expires automatically for stronger protection.</p>
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
      </div>
    </div>
  );
}
