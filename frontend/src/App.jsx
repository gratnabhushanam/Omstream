import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
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
const KidsMode = lazy(() => import('./pages/KidsMode'));
const Search = lazy(() => import('./pages/Search'));
const Profile = lazy(() => import('./pages/Profile'));
const Movies = lazy(() => import('./pages/Movies'));
const Satsangs = lazy(() => import('./pages/Satsangs'));
const InstallApp = lazy(() => import('./pages/InstallApp'));
const Subscription = lazy(() => import('./pages/Subscription'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const SubscriptionSuccess = lazy(() => import('./pages/SubscriptionSuccess'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Songs = lazy(() => import('./pages/Songs'));
const TvHome = lazy(() => import('./pages/TvHome'));
const ProfileSelection = lazy(() => import('./pages/ProfileSelection'));
const ManageProfile = lazy(() => import('./pages/ManageProfile'));


function AppShell() {
  const location = useLocation();
  const { user, loading: authLoading, selectedProfile, selectProfile } = useAuth();
  const { tier, status } = useSubscription();
  const { immersiveNotification, setImmersiveNotification } = useNotifications();
  const [minSplashTimeReached, setMinSplashTimeReached] = useState(false);
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('splashShown'));

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('splashShown', 'true');
  };

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashTimeReached(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const loading = authLoading || !minSplashTimeReached;

  const isSubscribed = (u) => {
    return !!u && status === 'active';
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

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/register/verify-otp' || location.pathname === '/forgot-password';
  const isTvRoute = location.pathname === '/tv';


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

  if (loading) {
    return <SplashScreen />;
  }

  const needsProfileSelection = user && !selectedProfile && !isAuthRoute && (user.profiles || []).length > 0 && user.role !== 'admin';

  if (needsProfileSelection) {
    return (
      <Suspense fallback={pageFallback}>
        <ProfileSelection />
      </Suspense>
    );
  }

  const getAuraColor = () => {
    const path = location.pathname;
    if (path.startsWith('/kids')) return 'aura-pink';
    if (path.startsWith('/movies')) return 'aura-blue';
    if (path.startsWith('/stories')) return 'aura-gold';
    return 'aura-gold';
  };

  return (
    <div className={`app-shell ott-mode flex justify-center overflow-x-hidden text-white transition-all duration-1000 relative ${getAuraColor()}`}>
      
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Magic Sparkles */}
      {sparkles.map(s => (
        <div key={s.id} className="magic-sparkle" style={{ left: s.x, top: s.y }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="#FFD700" />
          </svg>
        </div>
      ))}

      {!isAuthRoute && !isTvRoute && (
        <>
          <div className="fixed inset-0 z-0 pointer-events-none dynamic-aura-field opacity-20"></div>
        </>
      )}


      {/* Primary Responsive Layout Container */}
      <div className={`relative z-10 w-full min-h-[100dvh] flex flex-col flex-1 ${!isAuthRoute && !isTvRoute ? 'lg:pl-[5.5rem]' : ''}`}>
        
        <div>
           {!isAuthRoute && !isTvRoute && <Sidebar />}
           {!isAuthRoute && !isTvRoute && <Navbar />}
        </div>
        <GlobalInstallPrompt />
        
        <main className="flex-1 relative z-0">
          <LayoutWrapper>
            <Suspense fallback={pageFallback}>
              <Routes>
                {/* Unauthenticated Home / Paywall */}
                <Route path="/" element={user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} />
                
                {/* Auth Routes */}
                <Route path="/subscription" element={user ? <Subscription /> : <Navigate to="/login" replace />} />
                <Route path="/payment" element={user ? <PaymentPage /> : <Navigate to="/login" replace />} />
                <Route path="/subscription/success" element={user ? <SubscriptionSuccess /> : <Navigate to="/login" replace />} />
                <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
                <Route path="/register" element={user ? <Navigate to="/home" replace /> : <Register />} />
                <Route path="/register/verify-otp" element={user ? <Navigate to="/subscription" replace /> : <RegisterVerifyOtp />} />
                <Route path="/forgot-password" element={user ? <Navigate to="/home" replace /> : <ForgotPassword />} />
                
                {/* Protected Routes */}
                <Route path="/home" element={user ? <Home /> : <Navigate to="/login" replace />} />
                <Route path="/stories" element={user ? <Stories /> : <Navigate to="/login" replace />} />
                <Route path="/chapters" element={user ? <Stories /> : <Navigate to="/login" replace />} />
                <Route path="/videos" element={user ? <Videos /> : <Navigate to="/login" replace />} />
                <Route path="/sloka" element={user ? <Sloka /> : <Navigate to="/login" replace />} />
                <Route path="/about" element={user ? <About /> : <Navigate to="/login" replace />} />
                <Route path="/install" element={user ? <InstallApp /> : <Navigate to="/login" replace />} />
                <Route path="/quiz" element={user ? <Quiz /> : <Navigate to="/login" replace />} />
                <Route path="/quizzes" element={user ? <QuizList /> : <Navigate to="/login" replace />} />
                <Route path="/student" element={user ? <StudentGuide /> : <Navigate to="/login" replace />} />
                <Route path="/mentor" element={user ? <Mentor /> : <Navigate to="/login" replace />} />
                <Route path="/satsangs" element={user ? <Satsangs /> : <Navigate to="/login" replace />} />
                <Route path="/daily-sloka" element={user ? <DailySloka /> : <Navigate to="/login" replace />} />
                <Route path="/kids" element={user ? <KidsMode /> : <Navigate to="/login" replace />} />
                <Route path="/search" element={user ? <Search /> : <Navigate to="/login" replace />} />
                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
                <Route path="/profiles" element={user ? <ProfileSelection /> : <Navigate to="/login" replace />} />
                <Route path="/manage-profiles/:id" element={user ? <ManageProfile /> : <Navigate to="/login" replace />} />
                <Route path="/movies" element={user ? <Movies /> : <Navigate to="/login" replace />} />
                <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/home" replace />} />
                <Route path="/songs" element={user ? <Songs /> : <Navigate to="/login" replace />} />
                <Route path="/tv" element={user ? <TvHome /> : <Navigate to="/login" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </LayoutWrapper>
        </main>
        
        {!isAuthRoute && !isTvRoute && <Footer />}
        {!isAuthRoute && <BottomNav />}
        
        {/* Global Immersive Notification Overlay */}
        <ImmersiveNotification 
          notification={immersiveNotification} 
          onClose={() => setImmersiveNotification(null)}
          onAction={(n) => {
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
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true).then(() => {
        window.location.reload(true);
      });
    }
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
      OtaSyncService.syncContent();
  }, []);

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <LanguageProvider>
          <NotificationProvider>
            <Router>
              <AppShell />
            </Router>
          </NotificationProvider>
        </LanguageProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;


