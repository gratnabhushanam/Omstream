import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Heart, Eye, EyeOff } from 'lucide-react';
import PhoneInput from '../components/PhoneInput';
import { useAuth } from '../context/AuthContext';
import heroImage from '../assets/hero.png';
import '../styles/auth.css';

export default function Login() {
  const [loginType, setLoginType] = useState('email');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [phoneVal, setPhoneVal] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    let loginIdentifier = formData.email;
    if (loginType === 'phone') {
      if (!phoneVal) {
        setError('Please enter your Phone Number');
        return;
      }
      loginIdentifier = selectedCountry ? selectedCountry.dial + phoneVal.replace(/\D/g, '') : phoneVal.replace(/\D/g, '');
    } else {
      if (!formData.email) {
        setError('Please enter your Email Address');
        return;
      }
    }

    if (!formData.password) {
      setError('Please enter your Password');
      return;
    }

    setLoading(true);
    try {
      await login(loginIdentifier, formData.password);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page flex min-h-screen items-center px-4 py-8 sm:px-6 lg:px-8 tv:px-24">
      <div className="auth-stage mx-auto grid w-full max-w-6xl tv:max-w-[1400px] gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 tv:gap-16">
        
        {/* Left Visual Stage */}
        <section className="auth-hero rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="relative z-10 flex h-full flex-col gap-8">
            <div className="space-y-6">
              <div className="auth-badge w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                Krishna Flow
              </div>

              <div className="max-w-2xl space-y-5">
                <h1 className="text-4xl sm:text-5xl tv:text-7xl font-serif font-black uppercase leading-none tracking-tight text-[#f7d77d]">
                  Gita Wisdom
                </h1>
                <p className="auth-quote max-w-xl text-lg leading-relaxed sm:text-xl">
                  Enter securely with your registered account. Quick access to your spiritual path.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <Shield className="mb-3 h-5 w-5 text-[#f7d77d]" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/90">Highly Secure</p>
                  <p className="mt-1 text-xs text-white/70">Using natively secured hash encryption.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <Heart className="mb-3 h-5 w-5 text-[#f7d77d]" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/90">Easy Entry</p>
                  <p className="mt-1 text-xs text-white/70">One tap access to your saved resources.</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/20 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:p-6 mt-auto">
              <div className="absolute inset-0 bg-gradient-to-t from-[#06101e]/90 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,215,0,0.18),transparent_30%),radial-gradient(circle_at_70%_70%,rgba(255,164,54,0.12),transparent_24%)]"></div>
              <img src={heroImage} alt="Krishna theme" className="auth-floating-image relative z-10 w-full rounded-[1.4rem] object-cover shadow-[0_20px_50px_rgba(0,0,0,0.35)]" />
            </div>
          </div>
        </section>

        {/* Right Auth Card */}
        <section className="auth-card rounded-[2rem] p-6 sm:p-8 flex flex-col justify-center relative">
          <div className="relative z-10">
            
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.32em] text-[#f7d77d]/85">Secure Portal</p>
                <h2 className="mt-2 text-2xl sm:text-3xl tv:text-5xl font-serif font-black uppercase tracking-tight text-white">Sign In</h2>
              </div>
              <Link to="/home" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-[#f7d77d]">
                Home
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mb-5 rounded-2xl border border-[#f7d77d]/20 bg-[#f7d77d]/8 p-4 text-sm text-white/80">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-[#f7d77d] underline decoration-[#f7d77d]/40 underline-offset-4">
                Sign up here
              </Link>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

             <div className="animate-fade-in-up">
                {/* Tabs to toggle login type */}
                <div className="flex gap-4 mb-6 border-b border-white/10 pb-3">
                  <button
                    type="button"
                    onClick={() => { setLoginType('email'); setError(''); }}
                    className={`text-xs font-bold uppercase tracking-wider pb-1 transition-all ${loginType === 'email' ? 'text-[#f7d77d] border-b-2 border-[#f7d77d]' : 'text-white/50 hover:text-white'}`}
                  >
                    Email Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginType('phone'); setError(''); }}
                    className={`text-xs font-bold uppercase tracking-wider pb-1 transition-all ${loginType === 'phone' ? 'text-[#f7d77d] border-b-2 border-[#f7d77d]' : 'text-white/50 hover:text-white'}`}
                  >
                    Phone Login
                  </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {loginType === 'email' ? (
                      <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                              Email Address
                          </label>
                          <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(event) => setFormData(c => ({...c, email: event.target.value}))}
                              onFocus={() => setFocusedField('id')}
                              onBlur={() => setFocusedField(null)}
                              placeholder="arjuna@example.com"
                              className={`auth-input ${focusedField === 'id' ? 'shadow-[0_0_0_4px_rgba(255,215,0,0.12)]' : ''}`}
                          />
                      </div>
                    ) : (
                      <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                              Phone Number
                          </label>
                          <PhoneInput
                            value={phoneVal}
                            onChange={setPhoneVal}
                            selectedCountry={selectedCountry}
                            setSelectedCountry={setSelectedCountry}
                          />
                      </div>
                    )}
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={formData.password}
                            onChange={(event) => setFormData(c => ({...c, password: event.target.value}))}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="••••••••"
                            className={`auth-input pr-12 ${focusedField === 'password' ? 'shadow-[0_0_0_4px_rgba(255,215,0,0.12)]' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/55 transition-colors hover:text-[#f7d77d]"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                    </div>

                    <div className="text-right mt-1">
                      <Link to="/forgot-password" className="text-[10px] uppercase font-semibold text-gray-400 hover:text-white transition-colors">
                        Forgot Password?
                      </Link>
                    </div>

                    <button type="submit" disabled={loading} className="auth-button mt-4 w-full px-5 py-3.5 tv:py-5 tv:text-xl">
                        {loading ? 'Please wait...' : 'Sign In'}
                    </button>
                </form>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
