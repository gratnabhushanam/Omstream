import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import GlobalInstallPrompt from './components/GlobalInstallPrompt';
import SplashScreen from './components/SplashScreen';
import OtaSyncService from './services/OtaSyncService';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './styles/app-shell.css';
import LayoutWrapper from './components/LayoutWrapper';
import { NotificationProvider } from './context/NotificationContext';
import ImmersiveNotification from './components/ImmersiveNotification';
import { useNotifications } from './context/NotificationContext';

const Home = lazy(() => import('./pages/Home'));
const Stories = lazy(() => import('./pages/Stories'));
const Videos = lazy(() => import('./pages/Videos'));
const Sloka = lazy(() => import('./pages/Sloka'));
const About = lazy(() => import('./pages/About'));
const Quiz = lazy(() => import('./pages/Quiz'));
const QuizList = lazy(() => import('./pages/QuizList'));
const StudentGuide = lazy(() => import('./pages/StudentGuide'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const RegisterVerifyOtp = lazy(() => import('./pages/RegisterVerifyOtp'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Mentor = lazy(() => import('./pages/Mentor'));
const DailySloka = lazy(() => import('./pages/DailySloka'));
const Reels = lazy(() => import('./pages/Reels'));
const KidsMode = lazy(() => import('./pages/KidsMode'));
const Search = lazy(() => import('./pages/Search'));
const Profile = lazy(() => import('./pages/Profile'));
const Movies = lazy(() => import('./pages/Movies'));
const UploadReel = lazy(() => import('./pages/UploadReel'));
const Satsangs = lazy(() => import('./pages/Satsangs'));
const InstallApp = lazy(() => import('./pages/InstallApp'));
const Subscription = lazy(() => import('./pages/Subscription'));
const NotFound = lazy(() => import('./pages/NotFound'));


function AppShell() {
  const location = useLocation();
  const { user, loading: authLoading, selectedProfile, selectProfile } = useAuth();
  const { immersiveNotification, setImmersiveNotification } = useNotifications();
  const [minSplashTimeReached, setMinSplashTimeReached] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashTimeReached(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const loading = authLoading || !minSplashTimeReached;

  const isSubscribed = (u) => {
    if (!u) return false;
    if (u.role === 'admin') return true;
    if (u.subscriptionStatus === 'Trial Expired' || u.subscriptionStatus === 'Subscription Cancelled') return false;
    return true; // Trial Active or Subscription Active
  };

  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      const newSparkle = { id: Date.now(), x: e.clientX, y: e.clientY };
      setSparkles(prev => [...prev, newSparkle]);
      setTimeout(() => {
        setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
      }, 1000);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Auto-select default profile for admin users and users with no profiles
  // Must be in useEffect to avoid side-effects during render
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/register/verify-otp' || location.pathname === '/forgot-password';

  useEffect(() => {
    if (!user || selectedProfile || isAuthRoute) return;
    const profiles = user.profiles || [];
    if (user.role === 'admin' || profiles.length === 0) {
      selectProfile({ name: user.name || 'Main', _id: 'default' });
    }
  }, [user, selectedProfile, isAuthRoute, selectProfile]);

  const pageFallback = (
    <div className="flex min-h-[40vh] items-center justify-center text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-spiritual-gold border-t-transparent"></div>
        <p className="text-sm uppercase tracking-[0.2em] text-spiritual-textMuted">Loading page...</p>
      </div>
    </div>
  );

  const isFullScreenRoute = location.pathname.startsWith('/reels');

  if (loading) {
    return <SplashScreen />;
  }

  // Show profile selector ONLY for users who have profiles and haven't selected one
  // Admin users and users with no profiles skip this and go directly to the app
  const needsProfileSelection = user && !selectedProfile && !isAuthRoute && (user.profiles || []).length > 0 && user.role !== 'admin';

  if (needsProfileSelection) {
    const profiles = user.profiles || [];
    return (
      <div className="fixed inset-0 z-50 bg-[#06101E] flex flex-col items-center justify-center p-6 text-white overflow-y-auto">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.1),transparent_50%)]"></div>
        
        <div className="relative z-10 max-w-4xl w-full text-center space-y-12 animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-serif font-black uppercase tracking-tight text-[#f7d77d]">
              Who is seeking wisdom today?
            </h1>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Select your seeker profile to customize your path and track your spiritual growth.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8">
            {profiles.map((prof) => (
              <button
                key={prof._id || prof.name}
                onClick={() => selectProfile(prof)}
                className="group flex flex-col items-center gap-4 transition-transform hover:scale-105"
              >
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-gradient-to-br from-[#B66A2A] via-[#E6C38A] to-[#B66A2A] p-1 shadow-2xl group-hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all">
                  <div className="w-full h-full rounded-[1.8rem] bg-[#0d1520] flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl font-serif font-black text-[#f7d77d]">
                      {prof.name[0].toUpperCase()}
                    </span>
                  </div>
                </div>
                <span className="text-base sm:text-lg font-bold text-white group-hover:text-[#f7d77d] transition-colors">
                  {prof.name}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-6 flex flex-col items-center gap-4">
            <button
              onClick={() => selectProfile({ name: user.name || 'Main', _id: 'default' })}
              className="text-xs text-[#f7d77d]/70 hover:text-[#f7d77d] uppercase font-bold tracking-widest transition-colors border border-[#f7d77d]/20 rounded-full px-6 py-2"
            >
              Continue without profile
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('gita_wisdom_profile');
                window.location.reload();
              }}
              className="text-xs text-gray-500 hover:text-white uppercase font-black tracking-widest transition-colors"
            >
              Sign out of account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getAuraColor = () => {
    const path = location.pathname;
    if (path.startsWith('/kids')) return 'aura-pink';
    if (path.startsWith('/reels')) return 'aura-purple';
    if (path.startsWith('/movies')) return 'aura-blue';
    if (path.startsWith('/stories')) return 'aura-gold';
    return 'aura-gold';
  };

  return (
    <div className={`app-shell flex justify-center min-h-[100dvh] bg-[#06101E] overflow-x-hidden text-white transition-all duration-1000 relative ${getAuraColor()}`}>
      {/* Magic Sparkles */}
      {sparkles.map(s => (
        <div key={s.id} className="magic-sparkle" style={{ left: s.x, top: s.y }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="#FFD700" />
          </svg>
        </div>
      ))}

      {!isAuthRoute && (
        <>
          <div className="fixed inset-0 z-0 bg-[#06101E]"></div>
          <div className="fixed inset-0 z-0 opacity-30 pointer-events-none dynamic-aura-field"></div>
          <div className="fixed inset-0 z-0 opacity-10 pointer-events-none bg-[url('/sacred-geometry-pattern.svg')] bg-repeat opacity-[0.03]"></div>
        </>
      )}

      {/* Primary Responsive Layout Container */}
      <div className="relative z-10 w-full min-h-[100dvh] flex flex-col flex-1">
        
        <div className={`${!isAuthRoute && isFullScreenRoute ? 'hidden md:block' : ''}`}>
           {!isAuthRoute && <Navbar />}
        </div>
        <GlobalInstallPrompt />
        
        <main className="flex-1 relative z-0">
          <LayoutWrapper>
            <Suspense fallback={pageFallback}>
              <Routes>
                {/* Unauthenticated Home / Paywall */}
                <Route path="/" element={<Navigate to={isSubscribed(user) ? '/kids' : '/subscription'} replace />} />
                
                {/* Auth Routes */}
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register/verify-otp" element={<RegisterVerifyOtp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                
                {/* Protected Routes */}
                <Route path="/home" element={isSubscribed(user) ? <Home /> : <Navigate to="/subscription" replace />} />
                <Route path="/stories" element={isSubscribed(user) ? <Stories /> : <Navigate to="/subscription" replace />} />
                <Route path="/chapters" element={isSubscribed(user) ? <Stories /> : <Navigate to="/subscription" replace />} />
                <Route path="/videos" element={isSubscribed(user) ? <Videos /> : <Navigate to="/subscription" replace />} />
                <Route path="/sloka" element={isSubscribed(user) ? <Sloka /> : <Navigate to="/subscription" replace />} />
                <Route path="/about" element={isSubscribed(user) ? <About /> : <Navigate to="/subscription" replace />} />
                <Route path="/install" element={<InstallApp />} />
                <Route path="/quiz" element={isSubscribed(user) ? <Quiz /> : <Navigate to="/subscription" replace />} />
                <Route path="/quizzes" element={isSubscribed(user) ? <QuizList /> : <Navigate to="/subscription" replace />} />
                <Route path="/student" element={isSubscribed(user) ? <StudentGuide /> : <Navigate to="/subscription" replace />} />
                <Route path="/mentor" element={isSubscribed(user) ? <Mentor /> : <Navigate to="/subscription" replace />} />
                <Route path="/satsangs" element={isSubscribed(user) ? <Satsangs /> : <Navigate to="/subscription" replace />} />
                <Route path="/daily-sloka" element={isSubscribed(user) ? <DailySloka /> : <Navigate to="/subscription" replace />} />
                <Route path="/reels" element={isSubscribed(user) ? <Reels /> : <Navigate to="/subscription" replace />} />
                <Route path="/kids" element={isSubscribed(user) ? <KidsMode /> : <Navigate to="/subscription" replace />} />
                <Route path="/search" element={isSubscribed(user) ? <Search /> : <Navigate to="/subscription" replace />} />
                <Route path="/profile" element={isSubscribed(user) ? <Profile /> : <Navigate to="/subscription" replace />} />
                <Route path="/movies" element={isSubscribed(user) ? <Movies /> : <Navigate to="/subscription" replace />} />
                <Route path="/upload-reel" element={isSubscribed(user) ? <UploadReel /> : <Navigate to="/subscription" replace />} />
                <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/subscription" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </LayoutWrapper>
        </main>
        
        {!isAuthRoute && <Footer />}
        {!isAuthRoute && <BottomNav />}
        
        {/* Global Immersive Notification Overlay */}
        <ImmersiveNotification 
          notification={immersiveNotification} 
          onClose={() => setImmersiveNotification(null)}
          onAction={(n) => {
            // Mark as read and maybe navigate
            setImmersiveNotification(null);
            if (n.data?.url) {
              window.location.href = n.data.url;
            }
          }}
        />
      </div>
    </div>
  );
}

import { LanguageProvider } from './context/LanguageContext';

function App() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000); // Check for updates every hour
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
      // Trigger background sync exactly once on app boot natively
      OtaSyncService.syncContent();
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <NotificationProvider>
          <Router>
            <AppShell />
          </Router>
        </NotificationProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;

