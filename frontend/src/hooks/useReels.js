import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ENV } from '../config/env';
import { useNotifications } from './useNotifications';

const SAVED_REELS_KEY = 'saved_reels_v1';
const REELS_SOUND_PREF_KEY = 'reels_sound_enabled_v1';

export const useReels = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  
  const [reels, setReels] = useState([]);
  const [pendingReels, setPendingReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingCommentId, setSubmittingCommentId] = useState(null);
  const [moderatingId, setModeratingId] = useState(null);
  const [bgIndex, setBgIndex] = useState(0);
  const [likedReelMap, setLikedReelMap] = useState({});
  const [expandedCommentReel, setExpandedCommentReel] = useState(null);
  const [savedReelMap, setSavedReelMap] = useState({});
  const [selectedCommentProfile, setSelectedCommentProfile] = useState(null);
  const [activeReelId, setActiveReelId] = useState('');
  const [viewMode, setViewMode] = useState('scroll'); // 'scroll' or 'grid'
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [likePopReelId, setLikePopReelId] = useState('');
  const [pausedReelId, setPausedReelId] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, handleMarkAsRead } = useNotifications(user);
  
  const reelsFeedRef = useRef(null);
  const likePopTimerRef = useRef(null);
  const singleTapTimerRef = useRef(null);
  const lastTapRef = useRef({ reelId: '', time: 0 });

  const currentUserId = user ? String(user.id || user._id) : null;

  const isReelOwner = (reel) => {
    const ownerId = reel ? String(reel.uploadedBy || reel.userId || '') : '';
    return Boolean(ownerId && currentUserId && ownerId === currentUserId);
  };

  const canViewCommenterProfile = (reel) => Boolean(user?.role === 'admin' || isReelOwner(reel));

  const fetchReels = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'x-api-key': ENV.API_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const [curatedResponse, userReelsResponse] = await Promise.all([
        axios.get(`${ENV.API_BASE_URL}/api/videos/reels`, { headers }).catch(e => e.response || e),
        axios.get(`${ENV.API_BASE_URL}/api/videos/user-reels`, { headers }).catch(e => e.response || e),
      ]);

      const isAuthError = (resp) => {
        if (!resp) return false;
        if (resp.status === 401 || resp.status === 403) return true;
        if (typeof resp.data === 'string' && resp.data.includes('<form') && resp.data.includes('SIGN IN')) return true;
        return false;
      };

      if (isAuthError(curatedResponse) || isAuthError(userReelsResponse)) {
        setError('Session expired. Please sign in again.');
        return;
      }

      const curatedData = Array.isArray(curatedResponse.data) ? curatedResponse.data : [];
      const userReelsData = Array.isArray(userReelsResponse.data) ? userReelsResponse.data : [];

      const safeUserReels = userReelsData.filter(
        (reel) =>
          reel.isUserReel &&
          reel.moderationStatus === 'approved' &&
          String(reel.contentType || 'other') === 'spiritual'
      );

      const mergedReels = [...safeUserReels, ...curatedData];
      
      // Prevent duplicates by ID
      const uniqueReels = [];
      const seen = new Set();
      mergedReels.forEach(r => {
         const id = String(r._id || r.id);
         if (!seen.has(id)) {
            seen.add(id);
            uniqueReels.push(r);
         }
      });

      setReels(uniqueReels);
      if (uniqueReels.length > 0) {
        setActiveReelId(String(uniqueReels[0]._id || uniqueReels[0].id));
      }
    } catch (err) {
      setError('Connection issue. Please check your internet.');
      console.error('Error fetching reels:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cycle background scenes as active reel changes
  useEffect(() => {
    if (activeReelId) {
      setBgIndex(prev => (prev + 1) % 3); // Cycle through 3 scenes
    }
  }, [activeReelId]);

  useEffect(() => {
    fetchReels();
    
    // Admin pending reels check
    if (user?.role === 'admin') {
      const token = localStorage.getItem('token');
      axios.get(`${ENV.API_BASE_URL}/api/videos/user-reels?status=pending`, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-api-key': ENV.API_KEY 
        } 
      }).then(res => setPendingReels(res.data || [])).catch(() => {});
    }
  }, [user?.role]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(REELS_SOUND_PREF_KEY);
      if (raw === null) {
        const isLikelyMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        setSoundEnabled(!isLikelyMobile);
      } else {
        setSoundEnabled(raw === 'true');
      }
    } catch { setSoundEnabled(false); }
  }, []);

  useEffect(() => {
    localStorage.setItem(REELS_SOUND_PREF_KEY, String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    if (user?.savedReels) {
      const map = {};
      user.savedReels.forEach(id => { map[String(id)] = true; });
      setSavedReelMap(map);
    }
  }, [user]);

  const handleToggleSave = async (reelId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${ENV.API_BASE_URL}/api/videos/${reelId}/save`, {}, {
        headers: { Authorization: `Bearer ${token}`, 'x-api-key': ENV.API_KEY }
      });
      const isSavedNow = res.data.isSaved;
      setSavedReelMap(prev => ({ ...prev, [String(reelId)]: isSavedNow }));
      // Also update the local user object to keep it in sync
      if (user) {
        const newSaved = isSavedNow 
          ? [...(user.savedReels || []), String(reelId)]
          : (user.savedReels || []).filter(id => String(id) !== String(reelId));
        setUser({ ...user, savedReels: newSaved });
      }
    } catch (e) { console.error('Save error:', e); }
  };

  const handleToggleLike = async (reel) => {
    const reelId = reel._id || reel.id;
    const normalizedId = String(reelId);
    
    // Fast UI update for curated reels (local state only)
    if (!reel.isUserReel) {
      const alreadyLiked = Boolean(likedReelMap[normalizedId]);
      setLikedReelMap(prev => ({ ...prev, [normalizedId]: !alreadyLiked }));
      setReels(prev => prev.map(r => (String(r._id || r.id) === normalizedId ? { ...r, likesCount: Math.max(0, (r.likesCount || 0) + (alreadyLiked ? -1 : 1)) } : r)));
      setLikePopReelId(normalizedId);
      setTimeout(() => setLikePopReelId(''), 700);
      return;
    }

    // Backend sync for user reels
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${ENV.API_BASE_URL}/api/videos/${reelId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}`, 'x-api-key': ENV.API_KEY }
      });
      setReels(prev => prev.map(r => (String(r._id || r.id) === normalizedId ? res.data.video : r)));
      setLikePopReelId(normalizedId);
      setTimeout(() => setLikePopReelId(''), 700);
    } catch (e) { console.error(e); }
  };

  const handleVideoSurfaceTap = (reel, reelId) => {
    const now = Date.now();
    const normalizedId = String(reelId);
    const isDoubleTap = lastTapRef.current.reelId === normalizedId && (now - lastTapRef.current.time) < 300;

    if (isDoubleTap) {
      clearTimeout(singleTapTimerRef.current);
      lastTapRef.current = { reelId: '', time: 0 };
      handleToggleLike(reel);
    } else {
      lastTapRef.current = { reelId: normalizedId, time: now };
      singleTapTimerRef.current = setTimeout(() => {
        setPausedReelId(prev => (prev === normalizedId ? '' : normalizedId));
        lastTapRef.current = { reelId: '', time: 0 };
      }, 300);
    }
  };
  const handleCommentSubmit = async (reelId) => {
    const text = commentInputs[reelId];
    if (!text?.trim() || !user) return;

    setSubmittingCommentId(reelId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${ENV.API_BASE_URL}/api/videos/${reelId}/comments`, { text }, {
        headers: { Authorization: `Bearer ${token}`, 'x-api-key': ENV.API_KEY }
      });
      setReels(prev => prev.map(r => (String(r._id || r.id) === String(reelId) ? res.data : r)));
      setCommentInputs(prev => ({ ...prev, [reelId]: '' }));
    } catch (e) {
      console.error('Comment error:', e);
      alert('Failed to post reflection. Please try again.');
    } finally {
      setSubmittingCommentId(null);
    }
  };

  const handleDeleteComment = async (reelId, commentId) => {
    if (!window.confirm('Delete this reflection?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${ENV.API_BASE_URL}/api/videos/user-reels/${reelId}/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-api-key': ENV.API_KEY }
      });
      setReels(prev => prev.map(r => (String(r._id || r.id) === String(reelId) ? res.data : r)));
    } catch (e) { console.error(e); }
  };

  return {
    user, reels, pendingReels, loading, error, commentInputs, setCommentInputs,
    submittingCommentId, moderatingId, bgIndex, expandedCommentReel, setExpandedCommentReel,
    savedReelMap, selectedCommentProfile, setSelectedCommentProfile, activeReelId,
    viewMode, setViewMode,
    soundEnabled, setSoundEnabled, likePopReelId, pausedReelId, reelsFeedRef,
    showNotifications, setShowNotifications, unreadCount, handleMarkAsRead, notifications,
    canViewCommenterProfile, handleToggleLike, setActiveReelId, setPausedReelId,
    handleVideoSurfaceTap, fetchReels, handleCommentSubmit, handleDeleteComment, handleToggleSave,
    handleShare: async (reel) => {
      try {
        const text = `${reel.title}\n${reel.description || ''}`;
        if (navigator.share) await navigator.share({ title: reel.title, text, url: reel.videoUrl || reel.url });
        else await navigator.clipboard.writeText(`${text}\n${reel.videoUrl || reel.url}`);
      } catch {}
    }
  };
};
