import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Bell, Shield, Heart, Flame, Trophy, Settings, LogOut, Camera, Edit2, Check, ExternalLink, Sparkles, BookOpen, Share2, Bookmark, Video, Trash2, Library, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { requestNotificationPermission } from '../utils/notificationService';
import JapaCounter from '../components/JapaCounter';

const MAX_REEL_DURATION_SECONDS = 90;
const INTEREST_OPTIONS = ['Karma Yoga', 'Bhakti Yoga', 'Meditation', 'Stress Relief', 'Motivation', 'Leadership'];

const getVideoDuration = (file) => new Promise((resolve, reject) => {
  const testVideo = document.createElement('video');
  const objectUrl = URL.createObjectURL(file);

  testVideo.preload = 'metadata';
  testVideo.onloadedmetadata = () => {
    const duration = Number(testVideo.duration || 0);
    URL.revokeObjectURL(objectUrl);
    resolve(duration);
  };
  testVideo.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('Unable to read video duration'));
  };
  testVideo.src = objectUrl;
});

export default function Profile() {
  const DAILY_SAVED_KEY = 'daily_saved_verses_v1';
  const MENTOR_SAVED_KEY = 'mentor_saved_verses_v1';
  const SAVED_REELS_KEY = 'saved_reels_v1';
  const { user, setUser, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedVerses, setSavedVerses] = useState([]);
  const [savedReels, setSavedReels] = useState([]);
  const [dailySavedVerses, setDailySavedVerses] = useState([]);
  const [mentorSavedVerses, setMentorSavedVerses] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [myReels, setMyReels] = useState([]);
  const [myReelsLoading, setMyReelsLoading] = useState(false);
  const [reelActionLoading, setReelActionLoading] = useState(false);
  const [editingReelId, setEditingReelId] = useState(null);
  const [reelForm, setReelForm] = useState({ title: '', description: '', tags: '' });
  const [reelVideoFile, setReelVideoFile] = useState(null);
  const [reelEditError, setReelEditError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    profilePicture: ''
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [privacySetting, setPrivacySetting] = useState('public');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [savingPersonalization, setSavingPersonalization] = useState(false);
  const [personalizationStatus, setPersonalizationStatus] = useState('');
  const [activeSavedTab, setActiveSavedTab] = useState('verses');
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [watchlistStories, setWatchlistStories] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      setFormData({
        name: user.name,
        bio: user.bio || '',
        profilePicture: user.profilePicture || ''
      });
      setNotificationsEnabled(Boolean(user.settings?.notifications));
      setPrivacySetting(String(user.settings?.privacy || 'public').toLowerCase() === 'private' ? 'private' : 'public');
      setSelectedInterests(Array.isArray(user.settings?.interests) ? user.settings.interests : []);
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadSavedVerses = async () => {
      const bookmarks = Array.isArray(user?.bookmarkedSlokas) ? user.bookmarkedSlokas : [];
      if (!bookmarks.length) {
        setSavedVerses([]);
        return;
      }

      const normalizedIds = bookmarks.map((item) => (typeof item === 'object' ? item.id || item._id : item)).filter(Boolean);
      if (!normalizedIds.length) {
        setSavedVerses([]);
        return;
      }

      try {
        setSavedLoading(true);
        const responses = await Promise.all(
          normalizedIds.map((id) => axios.get(`/api/slokas/${id}`))
        );
        setSavedVerses(responses.map((response) => response.data));
      } catch (error) {
        console.error('Error loading saved verses:', error);
        setSavedVerses([]);
      } finally {
        setSavedLoading(false);
      }
    };

    loadSavedVerses();
  }, [user]);

  useEffect(() => {
    try {
      const currentUserId = user ? String(user.id || user._id) : null;
      if (!currentUserId) {
        setSavedReels([]);
        return;
      }

      const raw = localStorage.getItem(SAVED_REELS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const mine = list.filter((item) => String(item.savedByUserId) === currentUserId);
      setSavedReels(mine);
    } catch (error) {
      console.error('Error loading saved reels:', error);
      setSavedReels([]);
    }
  }, [user]);

  useEffect(() => {
    try {
      const rawDaily = localStorage.getItem(DAILY_SAVED_KEY);
      const daily = rawDaily ? JSON.parse(rawDaily) : [];
      setDailySavedVerses(Array.isArray(daily) ? daily : []);

      const rawMentor = localStorage.getItem(MENTOR_SAVED_KEY);
      const mentor = rawMentor ? JSON.parse(rawMentor) : [];
      setMentorSavedVerses(Array.isArray(mentor) ? mentor : []);
    } catch (error) {
      console.error('Error loading local saved verses:', error);
      setDailySavedVerses([]);
      setMentorSavedVerses([]);
    }
  }, []);

  useEffect(() => {
    const loadMyReels = async () => {
      if (!user) {
        setMyReels([]);
        return;
      }

      try {
        setMyReelsLoading(true);
        const token = localStorage.getItem('token');
        const { data } = await axios.get('/api/videos/user-reels/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyReels(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading uploaded reels:', error);
        setMyReels([]);
      } finally {
        setMyReelsLoading(false);
      }
    };

    loadMyReels();
  }, [user]);

  useEffect(() => {
    const loadWatchlistMovies = async () => {
      if (!user || !user.watchlist?.length) {
        setWatchlistMovies([]);
        return;
      }
      try {
        setWatchlistLoading(true);
        const { data } = await axios.get('/api/movies/watchlist');
        setWatchlistMovies(data);
      } catch (error) {
        console.error('Error loading watchlist movies:', error);
        setWatchlistMovies([]);
      } finally {
        setWatchlistLoading(false);
      }
    };

    const loadWatchlistStories = async () => {
      if (!user || !user.storyWatchlist?.length) {
        setWatchlistStories([]);
        return;
      }
      try {
        setWatchlistLoading(true);
        const token = localStorage.getItem('token');
        const { data } = await axios.get('/api/stories/watchlist/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWatchlistStories(data);
      } catch (error) {
        console.error('Error loading watchlist stories:', error);
        setWatchlistStories([]);
      } finally {
        setWatchlistLoading(false);
      }
    };

    loadWatchlistMovies();
    loadWatchlistStories();
  }, [user]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.put('/api/auth/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit file size (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Max size is 2MB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.put('/api/auth/profile', {
          ...formData,
          profilePicture: base64String
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(data);
        setFormData(prev => ({ ...prev, profilePicture: data.profilePicture }));
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setUploading(false);
      }
    };
  };

  const toggleDailyAlerts = async () => {
    const nextValue = !notificationsEnabled;

    if (nextValue) {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        alert('Notification permission is needed to enable daily wisdom alerts.');
        return;
      }
    }

    setNotificationsEnabled(nextValue);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        settings: {
          ...(user?.settings || {}),
          notifications: nextValue,
          privacy: privacySetting,
          interests: selectedInterests,
        },
      };

      const { data } = await axios.put('/api/auth/profile', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(data);
      setPersonalizationStatus(nextValue ? 'Daily wisdom alerts enabled.' : 'Daily wisdom alerts disabled.');
      setTimeout(() => setPersonalizationStatus(''), 2000);
    } catch (error) {
      console.error('Error updating notifications setting:', error);
      setNotificationsEnabled(!nextValue);
    }
  };

  const savePersonalization = async (nextSettings) => {
    try {
      setSavingPersonalization(true);
      const token = localStorage.getItem('token');
      const payload = {
        settings: {
          ...(user?.settings || {}),
          notifications: notificationsEnabled,
          privacy: privacySetting,
          interests: selectedInterests,
          ...(nextSettings || {}),
        },
      };

      const { data } = await axios.put('/api/auth/profile', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(data);
      return true;
    } catch (error) {
      console.error('Error saving personalization settings:', error);
      return false;
    } finally {
      setSavingPersonalization(false);
    }
  };

  const handlePrivacyChange = async (event) => {
    const nextPrivacy = event.target.value === 'private' ? 'private' : 'public';
    setPrivacySetting(nextPrivacy);
    const ok = await savePersonalization({ privacy: nextPrivacy });
    setPersonalizationStatus(ok
      ? nextPrivacy === 'private'
        ? 'Profile set to private. Your seeker details are hidden from community users.'
        : 'Profile set to public. Community users can discover your seeker profile.'
      : 'Could not update privacy setting.');
    setTimeout(() => setPersonalizationStatus(''), 2500);
  };

  const toggleInterest = async (interest) => {
    const exists = selectedInterests.includes(interest);
    const nextInterests = exists
      ? selectedInterests.filter((item) => item !== interest)
      : [...selectedInterests, interest];

    setSelectedInterests(nextInterests);
    const ok = await savePersonalization({ interests: nextInterests });
    setPersonalizationStatus(ok ? 'Wisdom interests updated.' : 'Could not update wisdom interests.');
    setTimeout(() => setPersonalizationStatus(''), 1800);
  };

  const addCustomInterest = async () => {
    const trimmed = String(newInterest || '').trim();
    if (!trimmed) return;
    if (selectedInterests.includes(trimmed)) {
      setNewInterest('');
      return;
    }

    const nextInterests = [...selectedInterests, trimmed];
    setSelectedInterests(nextInterests);
    setNewInterest('');
    const ok = await savePersonalization({ interests: nextInterests });
    setPersonalizationStatus(ok ? 'Custom wisdom interest added.' : 'Could not add custom interest.');
    setTimeout(() => setPersonalizationStatus(''), 1800);
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderMeaning = (sloka) => sloka?.englishMeaning || sloka?.teluguMeaning || 'No meaning available';

  const handleShareSavedVerse = async (sloka) => {
    if (!sloka) return;
    const title = `Bhagavad Gita ${sloka.chapter}:${sloka.verse}`;
    const text = `${title}\n\n${sloka.sanskrit}\n\n${renderMeaning(sloka)}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Verse copied to clipboard');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  };

  const removeDailySavedVerse = (verseKey) => {
    const next = dailySavedVerses.filter((item) => item.verseKey !== verseKey);
    setDailySavedVerses(next);
    localStorage.setItem(DAILY_SAVED_KEY, JSON.stringify(next));
  };

  const removeMentorSavedVerse = (verseKey) => {
    const next = mentorSavedVerses.filter((item) => item.verseKey !== verseKey);
    setMentorSavedVerses(next);
    localStorage.setItem(MENTOR_SAVED_KEY, JSON.stringify(next));
  };

  const removeSavedReel = (reelId) => {
    const currentUserId = user ? String(user.id || user._id) : null;
    if (!currentUserId) return;
    const next = savedReels.filter((item) => String(item.reelId) !== String(reelId));
    setSavedReels(next);

    try {
      const raw = localStorage.getItem(SAVED_REELS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const updated = list.filter(
        (item) => !(String(item.reelId) === String(reelId) && String(item.savedByUserId) === currentUserId)
      );
      localStorage.setItem(SAVED_REELS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing saved reel:', error);
    }
  };

  const removeWatchlistMovie = async (movieId) => {
    try {
      const { data } = await axios.post(`/api/movies/${movieId}/toggle-watchlist`);
      setWatchlistMovies(prev => prev.filter(m => (m._id || m.id) !== movieId));
      if (user) {
        const updatedUser = { ...user, watchlist: data.watchlist };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error removing movie from watchlist:', error);
    }
  };

  const openSavedReel = (reelId) => {
    navigate('/reels', { state: { focusReelId: reelId } });
  };

  const openEditReel = (reel) => {
    setEditingReelId(reel._id || reel.id);
    setReelEditError('');
    setReelForm({
      title: reel.title || '',
      description: reel.description || '',
      tags: Array.isArray(reel.tags) ? reel.tags.join(', ') : '',
    });
    setReelVideoFile(null);
  };

  const closeEditReel = () => {
    setEditingReelId(null);
    setReelForm({ title: '', description: '', tags: '' });
    setReelVideoFile(null);
    setReelEditError('');
  };

  const handleReelEditVideoSelection = async (file) => {
    if (!file) {
      setReelVideoFile(null);
      setReelEditError('');
      return;
    }

    try {
      const duration = await getVideoDuration(file);
      if (!duration || duration > MAX_REEL_DURATION_SECONDS) {
        setReelVideoFile(null);
        setReelEditError(`Video must be ${MAX_REEL_DURATION_SECONDS} seconds or less.`);
        return;
      }

      setReelVideoFile(file);
      setReelEditError('');
    } catch {
      setReelVideoFile(null);
      setReelEditError('Could not validate selected file. Please choose another video.');
    }
  };

  const saveEditedReel = async (reelId) => {
    try {
      setReelActionLoading(true);
      const token = localStorage.getItem('token');
      const payload = new FormData();
      payload.append('title', reelForm.title);
      payload.append('description', reelForm.description);
      payload.append('tags', reelForm.tags);
      if (reelVideoFile) {
        payload.append('video', reelVideoFile);
      }

      const { data } = await axios.patch(`/api/videos/user-reels/${reelId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMyReels((prev) => prev.map((item) => ((item._id || item.id) === reelId ? data : item)));
      closeEditReel();
      alert(data.message || 'Reel updated successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update reel');
    } finally {
      setReelActionLoading(false);
    }
  };

  const deleteReel = async (reelId) => {
    const confirmed = window.confirm('Delete this reel permanently?');
    if (!confirmed) return;

    try {
      setReelActionLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`/api/videos/user-reels/${reelId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyReels((prev) => prev.filter((item) => (item._id || item.id) !== reelId));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete reel');
    } finally {
      setReelActionLoading(false);
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-devotion-gold"></div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 sm:pt-28 tv:pt-36 pb-12 px-4 sm:px-6 lg:px-8 tv:px-16 relative bg-[#06101E] text-white">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.06),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(122,46,46,0.15),transparent_30%)]"></div>
      
      <div className="max-w-7xl tv:max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-3 tv:grid-cols-4 gap-10 tv:gap-16 relative z-10">
        
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div 
            className="bg-glass-premium rounded-[2.5rem] tv:rounded-[3.5rem] border border-devotion-gold/20 overflow-hidden shadow-2xl sticky top-20 sm:top-28 tv:top-36 preserve-3d transition-all duration-300 ease-out"
            onMouseMove={(e) => {
              const card = e.currentTarget;
              const rect = card.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const rotateX = ((y - centerY) / centerY) * -5;
              const rotateY = ((x - centerX) / centerX) * 5;
              card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            }}
          >
            <div className="h-32 sm:h-40 tv:h-56 bg-gradient-to-br from-[#B66A2A] via-[#E6C38A] to-[#B66A2A] relative">
               <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                  <div className="relative group">
                     <div className="w-32 h-32 sm:w-40 sm:h-40 tv:w-56 tv:h-56 rounded-full border-4 tv:border-8 border-[#06101E] shadow-2xl overflow-hidden bg-devotion-maroon flex items-center justify-center">
                        {formData.profilePicture ? (
                          <img 
                            src={formData.profilePicture} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-5xl font-serif font-black text-devotion-gold drop-shadow-lg">
                            {getInitials(user?.name)}
                          </span>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-devotion-gold border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                     </div>
                     {isEditing && (
                       <>
                         <button 
                           onClick={() => fileInputRef.current?.click()}
                           className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <Camera className="w-8 h-8 text-white" />
                         </button>
                         <input 
                           type="file" 
                           ref={fileInputRef} 
                           className="hidden" 
                           accept="image/*"
                           onChange={handleFileUpload}
                         />
                       </>
                     )}
                  </div>
               </div>
            </div>
            
            <div className="pt-16 pb-10 px-8 text-center">
               {isEditing ? (
                 <input 
                   className="bg-white/5 border border-devotion-gold/30 rounded-lg px-4 py-2 text-center text-2xl font-bold w-full mb-2"
                   value={formData.name}
                   onChange={(e) => setFormData({...formData, name: e.target.value})}
                 />
               ) : (
                 <h2 className="text-3xl font-serif font-black text-white mb-2">{user?.name}</h2>
               )}
               <p className="text-devotion-gold font-bold text-xs uppercase tracking-widest mb-6">Gita Seeker • Lv. {Math.floor((user?.benefits?.points || 0) / 100) + 1}</p>
               
               {isEditing ? (
                 <textarea 
                   className="bg-white/5 border border-devotion-gold/30 rounded-lg px-4 py-2 text-center text-sm w-full mb-6"
                   placeholder="Write a short bio..."
                   value={formData.bio}
                   onChange={(e) => setFormData({...formData, bio: e.target.value})}
                 />
               ) : (
                 <p className="text-gray-400 text-sm italic mb-8">"{user?.bio || 'Divine soul on a path of wisdom.'}"</p>
               )}

               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-devotion-gold/5 p-4 rounded-2xl border border-devotion-gold/20">
                     <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                     <p className="text-xl font-black text-white">{user?.streak || 0}</p>
                     <p className="text-[10px] text-gray-500 uppercase font-black">Streak</p>
                  </div>
                  <div className="bg-devotion-gold/5 p-4 rounded-2xl border border-devotion-gold/20">
                     <Trophy className="w-6 h-6 text-devotion-gold mx-auto mb-2" />
                     <p className="text-xl font-black text-white">{user?.benefits?.points || 0}</p>
                     <p className="text-[10px] text-gray-500 uppercase font-black">Points</p>
                  </div>
               </div>

               <div className="mb-8">
                 <JapaCounter />
               </div>

               <div className="space-y-3">
                  {isEditing ? (
                    <button 
                      onClick={handleUpdate}
                      className="w-full bg-devotion-gold text-devotion-darkBlue py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-400"
                    >
                       <Check className="w-4 h-4" /> Save Changes
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-white/5 border border-white/10 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                    >
                       <Edit2 className="w-4 h-4" /> Edit Profile
                    </button>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="w-full text-red-400 hover:text-red-300 py-3 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                  >
                     <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => navigate('/admin')}
                      className="w-full bg-devotion-gold/15 border border-devotion-gold/30 text-devotion-gold py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-devotion-gold/25 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Open Admin Dashboard
                    </button>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* User Benefits Section */}
          <section 
            className="bg-glass-gradient backdrop-blur-3xl rounded-[2.5rem] border border-devotion-gold/20 p-10 shadow-2xl relative overflow-hidden preserve-3d transition-all duration-300 ease-out"
            onMouseMove={(e) => {
              const card = e.currentTarget;
              const rect = card.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const rotateX = ((y - centerY) / centerY) * -3;
              const rotateY = ((x - centerX) / centerX) * 3;
              card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            }}
          >
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-[10rem] pointer-events-none italic">Wisdom</div>
             <div className="flex items-center gap-4 mb-8">
                <Sparkles className="text-devotion-gold w-8 h-8" />
                <h3 className="text-3xl font-serif font-bold text-white uppercase tracking-tighter">Seeker Benefits</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-devotion-darkBlue/40 p-6 rounded-2xl border border-white/5 group hover:border-devotion-gold/30 transition-colors">
                   <h4 className="text-devotion-gold font-black text-[10px] uppercase tracking-[0.2em] mb-4">Your Badges</h4>
                   <div className="flex flex-wrap gap-3">
                      {(user?.benefits?.badges?.length > 0 ? user.benefits.badges : ['Beginner Seeker']).map(badge => (
                        <span key={badge} className="px-4 py-2 bg-devotion-gold/10 rounded-full border border-devotion-gold/30 text-devotion-gold text-[10px] font-black uppercase tracking-widest">
                           {badge}
                        </span>
                      ))}
                   </div>
                </div>
                <div className="bg-devotion-darkBlue/40 p-6 rounded-2xl border border-white/5 group hover:border-blue-400/30 transition-colors">
                   <h4 className="text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Milestones</h4>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-gray-400">10 Daily Slokas</span>
                         <span className="text-white font-bold">{Math.min(user?.streak || 0, 10)}/10</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((user?.streak || 0) * 10, 100)}%` }}></div>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          <section 
            className="bg-glass-gradient backdrop-blur-3xl rounded-[2.5rem] border border-devotion-gold/20 p-10 shadow-2xl preserve-3d transition-all duration-300 ease-out"
            onMouseMove={(e) => {
              const card = e.currentTarget;
              const rect = card.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const rotateX = ((y - centerY) / centerY) * -2;
              const rotateY = ((x - centerX) / centerX) * 2;
              card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            }}
          >
             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                   <Bookmark className="text-devotion-gold w-8 h-8" />
                   <h3 className="text-3xl font-serif font-bold text-white uppercase tracking-tighter">Saved Content</h3>
                </div>
                <div className="flex bg-black/40 p-1.5 rounded-2xl overflow-x-auto hide-scrollbar">
                   {[
                     { id: 'verses', label: 'Verses', icon: <BookOpen className="w-4 h-4" /> },
                     { id: 'library', label: 'Library', icon: <Library className="w-4 h-4" /> },
                     { id: 'movies', label: 'Cinematic', icon: <Play className="w-4 h-4" /> },
                     { id: 'reels', label: 'Reels', icon: <Video className="w-4 h-4" /> },
                     { id: 'daily', label: 'Daily & Mentor', icon: <Bookmark className="w-4 h-4" /> }
                   ].map(tab => (
                     <button
                       key={tab.id}
                       onClick={() => setActiveSavedTab(tab.id)}
                       className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap ${activeSavedTab === tab.id ? 'bg-devotion-gold text-devotion-darkBlue shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                     >
                        {tab.icon} {tab.label}
                     </button>
                   ))}
                </div>
             </div>

             {/* Verses Tab */}
             {activeSavedTab === 'verses' && (
               savedLoading ? (
                 <div className="py-16 flex justify-center">
                   <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-devotion-gold"></div>
                 </div>
               ) : savedVerses.length === 0 ? (
                 <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-gray-400">
                   No saved verses yet. Use Save Verse on Daily Sloka or Mentor pages.
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-5">
                   {savedVerses.map((sloka) => (
                     <div 
                        key={sloka.id || sloka._id} 
                        className="bg-devotion-darkBlue/40 rounded-2xl border border-white/10 p-6 preserve-3d transition-all duration-300 ease-out"
                        onMouseMove={(e) => {
                          const card = e.currentTarget;
                          const rect = card.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          const centerX = rect.width / 2;
                          const centerY = rect.height / 2;
                          const rotateX = ((y - centerY) / centerY) * -5;
                          const rotateY = ((x - centerX) / centerX) * 5;
                          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
                        }}
                      >
                       <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                         <div className="space-y-3">
                           <div className="flex items-center gap-3 text-devotion-gold font-black text-xs uppercase tracking-widest">
                             <BookOpen className="w-4 h-4" />
                             Chapter {sloka.chapter} • Verse {sloka.verse}
                           </div>
                           <p className="text-white font-serif text-xl leading-relaxed">{sloka.sanskrit}</p>
                           <p className="text-gray-300 text-sm leading-relaxed">{renderMeaning(sloka)}</p>
                         </div>

                         <div className="flex items-center gap-3">
                           <button
                             onClick={() => handleShareSavedVerse(sloka)}
                             className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-black uppercase tracking-widest"
                           >
                             <Share2 className="w-4 h-4" /> Share
                           </button>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )
             )}

              {/* Library (Stories) Tab */}
              {activeSavedTab === 'library' && (
                watchlistLoading ? (
                  <div className="py-16 flex justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-devotion-gold"></div>
                  </div>
                ) : watchlistStories.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-gray-400">
                    Your personal library is empty. Discover and save stories from the Library page.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {watchlistStories.map((story) => (
                      <div 
                        key={story._id || story.id}
                        onClick={() => navigate('/stories', { state: { storyId: story._id || story.id } })}
                        className="bg-devotion-darkBlue/40 rounded-3xl border border-white/10 overflow-hidden group cursor-pointer hover:border-devotion-gold/30 transition-all hover:-translate-y-2"
                      >
                         <div className="aspect-video relative overflow-hidden">
                            <img src={story.thumbnail || '/story-placeholder.jpg'} alt={story.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Play className="w-12 h-12 text-devotion-gold fill-current" />
                            </div>
                            <div className="absolute top-4 left-4">
                               <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black text-devotion-gold uppercase tracking-widest border border-devotion-gold/30">
                                 {story.seriesTitle || 'Spiritual'}
                               </span>
                            </div>
                         </div>
                         <div className="p-6">
                            <h4 className="text-lg font-serif font-bold text-white mb-2 line-clamp-1">{story.title}</h4>
                            <div className="flex items-center justify-between">
                               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{story.viewCount || 0} Seekers</span>
                               <button 
                                 onClick={async (e) => {
                                   e.stopPropagation();
                                   try {
                                      const token = localStorage.getItem('token');
                                      const { data } = await axios.post(`/api/stories/${story._id || story.id}/toggle-watchlist`, {}, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      setUser({ ...user, storyWatchlist: data.storyWatchlist });
                                      setWatchlistStories(prev => prev.filter(s => (s._id || s.id) !== (story._id || story.id)));
                                      localStorage.setItem('user', JSON.stringify({ ...user, storyWatchlist: data.storyWatchlist }));
                                   } catch (err) {
                                      console.error('Error removing from watchlist:', err);
                                   }
                                 }}
                                 className="text-gray-500 hover:text-red-400 transition-colors"
                               >
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )
              )}

             {/* Cinematic Tab */}
             {activeSavedTab === 'movies' && (
               watchlistLoading ? (
                 <div className="py-16 flex justify-center">
                   <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-devotion-gold"></div>
                 </div>
               ) : watchlistMovies.length === 0 ? (
                 <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-gray-400">
                   Your cinematic watchlist is empty. Add movies from the Cinema section.
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   {watchlistMovies.map((movie) => (
                     <div 
                        key={movie._id || movie.id} 
                        className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden group/mcard transition-all hover:border-devotion-gold/30"
                     >
                        <div className="aspect-video relative overflow-hidden">
                           <img src={movie.thumbnail || '/scene-krishna.svg'} className="w-full h-full object-cover transition-transform duration-700 group-hover/mcard:scale-110" alt={movie.title} />
                           <div className="absolute inset-0 bg-gradient-to-t from-[#06101E] to-transparent opacity-60" />
                           <div className="absolute bottom-4 left-4">
                              <span className="px-2 py-1 bg-devotion-gold text-devotion-darkBlue text-[8px] font-black uppercase rounded">{movie.genre || 'Wisdom'}</span>
                           </div>
                        </div>
                        <div className="p-4">
                           <h4 className="text-white font-bold text-lg line-clamp-1 mb-2 italic">{movie.title}</h4>
                           <div className="flex gap-2">
                              <button 
                                onClick={() => navigate('/movies')} 
                                className="flex-1 bg-devotion-gold text-devotion-darkBlue py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-yellow-400"
                              >
                                 Watch Now
                              </button>
                              <button 
                                onClick={() => removeWatchlistMovie(movie._id || movie.id)} 
                                className="px-3 py-2 border border-red-500/30 text-red-400 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
               )
             )}

             {/* Reels Tab */}
             {activeSavedTab === 'reels' && (
               savedReels.length === 0 ? (
                 <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-gray-400">
                   No saved reels yet. Tap Save on any reel to collect it here.
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   {savedReels.slice(0, 30).map((reel) => (
                     <div 
                        key={`${reel.reelId}-${reel.savedAt}`} 
                        className="rounded-2xl border border-white/10 bg-white/5 p-5 preserve-3d transition-all duration-300 ease-out"
                        onMouseMove={(e) => {
                          const card = e.currentTarget;
                          const rect = card.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          const centerX = rect.width / 2;
                          const centerY = rect.height / 2;
                          const rotateX = ((y - centerY) / centerY) * -5;
                          const rotateY = ((x - centerX) / centerX) * 5;
                          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
                        }}
                      >
                       <h4 className="text-white font-bold text-lg line-clamp-1 mb-2">{reel.title || 'Saved Reel'}</h4>
                       <p className="text-sm text-gray-300 line-clamp-2 mb-3">{reel.description || 'No description'}</p>
                       <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                         ❤ {reel.likesCount || 0} • 💬 {reel.commentsCount || 0} • ↗ {reel.sharesCount || 0}
                       </p>
                       <div className="flex gap-2">
                         <button
                           onClick={() => openSavedReel(reel.reelId)}
                           className="flex-1 px-3 py-2 rounded-lg border border-devotion-gold/30 text-devotion-gold text-[10px] font-black uppercase tracking-widest hover:bg-devotion-gold/10"
                         >
                           Watch
                         </button>
                         <button
                           onClick={() => removeSavedReel(reel.reelId)}
                           className="px-3 py-2 rounded-lg border border-red-500/30 text-red-300 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10"
                         >
                           Remove
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )
             )}

             {/* Daily & Mentor Tab */}
             {activeSavedTab === 'daily' && (
               dailySavedVerses.length === 0 && mentorSavedVerses.length === 0 ? (
                 <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-gray-400">
                   No locally saved verses yet. Save verses from Daily Sloka or Mentor pages.
                 </div>
               ) : (
                 <div className="space-y-8">
                   {dailySavedVerses.length > 0 && (
                     <div>
                       <h4 className="text-devotion-gold font-black text-xs uppercase tracking-[0.2em] mb-4">Daily Sloka Saves</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {dailySavedVerses.slice(0, 8).map((item) => (
                           <div 
                              key={item.verseKey} 
                              className="rounded-2xl border border-white/10 bg-white/5 p-4 preserve-3d transition-all duration-300 ease-out"
                              onMouseMove={(e) => {
                                const card = e.currentTarget;
                                const rect = card.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const y = e.clientY - rect.top;
                                const centerX = rect.width / 2;
                                const centerY = rect.height / 2;
                                const rotateX = ((y - centerY) / centerY) * -5;
                                const rotateY = ((x - centerX) / centerX) * 5;
                                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
                              }}
                            >
                             <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">
                               {item.chapter && item.verse ? `Chapter ${item.chapter} • Verse ${item.verse}` : item.dailyKey || 'Daily Verse'}
                             </p>
                             <p className="text-sm text-white line-clamp-2 italic mb-2">{item.sanskrit}</p>
                             <p className="text-xs text-gray-300 line-clamp-2 mb-3">{item.englishMeaning}</p>
                             <div className="flex gap-2">
                               <button
                                 onClick={() => navigate('/daily-sloka', { state: { savedVerse: item } })}
                                 className="flex-1 px-3 py-2 rounded-lg border border-devotion-gold/30 text-devotion-gold text-[10px] font-black uppercase tracking-widest hover:bg-devotion-gold/10"
                               >
                                 Open
                               </button>
                               <button
                                 onClick={() => removeDailySavedVerse(item.verseKey)}
                                 className="px-3 py-2 rounded-lg border border-red-500/30 text-red-300 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10"
                               >
                                 Remove
                               </button>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {mentorSavedVerses.length > 0 && (
                     <div>
                       <h4 className="text-devotion-gold font-black text-xs uppercase tracking-[0.2em] mb-4">Mentor Saves</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {mentorSavedVerses.slice(0, 8).map((item) => (
                           <div key={item.verseKey} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                             <p className="text-[10px] uppercase tracking-[0.2em] text-devotion-gold mb-2">{item.problem || 'mentor'}</p>
                             <p className="text-sm text-white line-clamp-2 italic mb-2">{item.sanskrit}</p>
                             <p className="text-xs text-gray-300 line-clamp-2 mb-3">{item.englishMeaning}</p>
                             <div className="flex gap-2">
                               <button
                                 onClick={() => navigate('/mentor', { state: { savedVerse: item } })}
                                 className="flex-1 px-3 py-2 rounded-lg border border-devotion-gold/30 text-devotion-gold text-[10px] font-black uppercase tracking-widest hover:bg-devotion-gold/10"
                               >
                                 Open
                               </button>
                               <button
                                 onClick={() => removeMentorSavedVerse(item.verseKey)}
                                 className="px-3 py-2 rounded-lg border border-red-500/30 text-red-300 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10"
                               >
                                 Remove
                               </button>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               )
             )}
          </section>
          <section className="bg-glass-gradient backdrop-blur-3xl rounded-[2.5rem] border border-devotion-gold/20 p-10 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <Video className="text-devotion-gold w-8 h-8" />
                   <h3 className="text-3xl font-serif font-bold text-white uppercase tracking-tighter">Your Uploaded Reels</h3>
                </div>
                <button
                  onClick={() => navigate('/upload-reel')}
                  className="flex items-center gap-2 bg-devotion-gold text-devotion-darkBlue px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 transition-colors"
                >
                   <Camera className="w-4 h-4" /> New Reel
                </button>
             </div>

             {myReelsLoading ? (
               <div className="py-16 flex justify-center">
                 <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-devotion-gold"></div>
               </div>
             ) : myReels.length === 0 ? (
               <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-gray-400">
                 You haven't uploaded any reels yet.
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 {myReels.map((reel) => (
                   <div key={reel.id || reel._id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                     {editingReelId === (reel.id || reel._id) ? (
                       <div className="space-y-4">
                         <input
                           className="w-full bg-devotion-darkBlue text-white border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-devotion-gold"
                           value={reelForm.title}
                           onChange={(e) => setReelForm({ ...reelForm, title: e.target.value })}
                           placeholder="Title"
                         />
                         <textarea
                           className="w-full bg-devotion-darkBlue text-white border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-devotion-gold"
                           value={reelForm.description}
                           onChange={(e) => setReelForm({ ...reelForm, description: e.target.value })}
                           placeholder="Description"
                         />
                         <input
                           className="w-full bg-devotion-darkBlue text-white border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-devotion-gold"
                           value={reelForm.tags}
                           onChange={(e) => setReelForm({ ...reelForm, tags: e.target.value })}
                           placeholder="Tags (comma separated)"
                         />
                         
                         {reelEditError && <p className="text-red-400 text-xs">{reelEditError}</p>}
                         
                         <div className="flex gap-2">
                           <button
                             disabled={reelActionLoading}
                             onClick={() => saveEditedReel(reel.id || reel._id)}
                             className="flex-1 bg-devotion-gold text-devotion-darkBlue py-2 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
                           >
                             {reelActionLoading ? 'Saving...' : 'Save'}
                           </button>
                           <button
                             disabled={reelActionLoading}
                             onClick={() => closeEditReel()}
                             className="flex-1 bg-white/10 text-white py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 disabled:opacity-50"
                           >
                             Cancel
                           </button>
                         </div>
                       </div>
                     ) : (
                       <>
                         <div className="flex justify-between items-start mb-2">
                           <h4 className="text-white font-bold text-lg line-clamp-1 flex-1">{reel.title}</h4>
                           <div className="flex gap-2 ml-2">
                             <button 
                               onClick={() => openEditReel(reel)}
                               className="text-gray-400 hover:text-white transition-colors"
                             >
                               <Edit2 className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => deleteReel(reel.id || reel._id)}
                               disabled={reelActionLoading}
                               className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                         <p className="text-sm text-gray-300 line-clamp-2 mb-3">{reel.description || 'No description'}</p>
                         <div className="flex items-center justify-between">
                           <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${reel.moderationStatus === 'approved' ? 'bg-green-500/20 text-green-400' : reel.moderationStatus === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                             {reel.moderationStatus || 'pending'}
                           </span>
                           <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                             ❤ {reel.likesCount || 0} • 💬 {reel.commentsCount || 0}
                           </span>
                         </div>
                         {reel.moderationStatus === 'approved' && (
                           <div className="mt-3 text-[10px] text-green-400 bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                             Approved: Your reel is now visible in public spiritual reels.
                           </div>
                         )}
                         {reel.moderationStatus === 'rejected' && (
                           <div className="mt-3 text-[10px] text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                             Rejected: Did not meet community guidelines.
                           </div>
                         )}
                       </>
                     )}
                   </div>
                 ))}
               </div>
             )}
          </section>

        </div>
      </div>
    </div>
  );
}
