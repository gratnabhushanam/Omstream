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
const NotFound = lazy(() => import('./pages/NotFound'));


function AppShell() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { immersiveNotification, setImmersiveNotification } = useNotifications();
  const [minSplashTimeReached, setMinSplashTimeReached] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashTimeReached(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const loading = authLoading || !minSplashTimeReached;

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

  const pageFallback = (
    <div className="flex min-h-[40vh] items-center justify-center text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-spiritual-gold border-t-transparent"></div>
        <p className="text-sm uppercase tracking-[0.2em] text-spiritual-textMuted">Loading page...</p>
      </div>
    </div>
  );

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/register/verify-otp' || location.pathname === '/forgot-password';
  const isFullScreenRoute = location.pathname.startsWith('/reels');

  if (loading) {
    return <SplashScreen />;
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
                <Route path="/" element={<Navigate to={user ? '/kids' : '/login'} replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register/verify-otp" element={<RegisterVerifyOtp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/home" element={user ? <Home /> : <Navigate to="/login" replace />} />
                <Route path="/stories" element={user ? <Stories /> : <Navigate to="/login" replace />} />
                <Route path="/chapters" element={user ? <Stories /> : <Navigate to="/login" replace />} />
                <Route path="/videos" element={user ? <Videos /> : <Navigate to="/login" replace />} />
                <Route path="/sloka" element={user ? <Sloka /> : <Navigate to="/login" replace />} />
                <Route path="/about" element={user ? <About /> : <Navigate to="/login" replace />} />
                <Route path="/install" element={<InstallApp />} />
                <Route path="/quiz" element={user ? <Quiz /> : <Navigate to="/login" replace />} />
                <Route path="/quizzes" element={user ? <QuizList /> : <Navigate to="/login" replace />} />
                <Route path="/student" element={user ? <StudentGuide /> : <Navigate to="/login" replace />} />
                <Route path="/mentor" element={user ? <Mentor /> : <Navigate to="/login" replace />} />
                <Route path="/satsangs" element={user ? <Satsangs /> : <Navigate to="/login" replace />} />
                <Route path="/daily-sloka" element={user ? <DailySloka /> : <Navigate to="/login" replace />} />
                <Route path="/reels" element={user ? <Reels /> : <Navigate to="/login" replace />} />
                <Route path="/kids" element={user ? <KidsMode /> : <Navigate to="/login" replace />} />
                <Route path="/search" element={user ? <Search /> : <Navigate to="/login" replace />} />
                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
                <Route path="/movies" element={user ? <Movies /> : <Navigate to="/login" replace />} />
                <Route path="/upload-reel" element={user ? <UploadReel /> : <Navigate to="/login" replace />} />
                <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/login" replace />} />
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
