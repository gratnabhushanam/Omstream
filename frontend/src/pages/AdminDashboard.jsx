import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import axios from 'axios';
import { Database, Upload, Users, BookOpen, Video, LogOut, Settings, Film, Plus, X, Check, AlertCircle, Image as ImageIcon, Link as LinkIcon, FileText, Flame, Trash2, Pencil, Menu, Eye } from 'lucide-react';
import { resumableUpload } from '../utils/resumableUpload';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import MediaPlayerHLS from '../components/MediaPlayerHLS';

const VIDEO_COLLECTION_PRESETS = ['Bhagavad Gita', 'Ramayanam', 'Mahabharat', 'Puranas'];

function AdminDashboardContent() {
  const [, setShowAuthError] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [trailerUploadProgress, setTrailerUploadProgress] = useState(0);
  const [, setVideoUploadFile] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ users: [], stats: null, movies: [], stories: [], videos: [], quizQuestions: [], quizSets: [] });
  const [pendingUserReels, setPendingUserReels] = useState([]);
  const [pendingContentFilter, setPendingContentFilter] = useState('all');
  const [videoCollectionFilter, setVideoCollectionFilter] = useState('all');
  const [storyLanguageFilter, setStoryLanguageFilter] = useState('all');
  const [quickFillStoryId, setQuickFillStoryId] = useState(null);
  const [moderationNotes, setModerationNotes] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [movieForm, setMovieForm] = useState({ title: '', description: '', videoUrl: '', trailerUrl: '', thumbnail: '', releaseYear: 2025, ownerHistory: '', tags: '', views: 0, isComingSoon: false });
  const [storyForm, setStoryForm] = useState({
    title: '',
    titleTelugu: '',
    titleHindi: '',
    titleEnglish: '',
    seriesTitle: 'Bhagavad Gita',
    content: '',
    chapter: 1,
    summary: '',
    summaryTelugu: '',
    summaryHindi: '',
    summaryEnglish: '',
    contentTelugu: '',
    contentHindi: '',
    contentEnglish: '',
    language: 'english',
    thumbnail: '',
    tags: '',
  });
  const [videoForm, setVideoForm] = useState({ title: '', description: '', videoUrl: '', category: 'reels', collectionTitle: 'Bhagavad Gita', isKids: false, tags: '', quizSetId: '', views: 0 });
  // Quiz builder state for video upload
  const [videoQuizList, setVideoQuizList] = useState([]);
  const [videoQuizDraft, setVideoQuizDraft] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
  });
  const [videosUploadType, setVideosUploadType] = useState('video');
  const [quizForm, setQuizForm] = useState({
    questionText: '',
    category: 'Gita Challenge',
    videoUrl: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'B',
  });
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [editingQuizSetId, setEditingQuizSetId] = useState(null);
  const [quizSetForm, setQuizSetForm] = useState({
    title: '', description: '', category: 'General', difficulty: 'medium', timeLimit: 0, thumbnail: '', tags: '', isPublished: false, questions: []
  });
  const [broadcastForm, setBroadcastForm] = useState({ title: '', body: '', type: 'system' });

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.body) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/notifications/broadcast', broadcastForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Broadcast sent successfully!' });
      setBroadcastForm({ title: '', body: '', type: 'system' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to send broadcast.' });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Handle resumable video file upload
  const handleVideoFileChange = async (e, isTrailer = false) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoUploadFile(file);
    const setProgress = isTrailer ? setTrailerUploadProgress : setVideoUploadProgress;
    setProgress(0);
    try {
      const token = localStorage.getItem('token');
      const currentTitle = isTrailer ? `${movieForm.title} Trailer` : (activeTab === 'movies' ? movieForm.title : videoForm.title);
      const currentDesc = isTrailer ? `Trailer for ${movieForm.title}` : (activeTab === 'movies' ? movieForm.description : videoForm.description);
      const currentTags = activeTab === 'movies' ? movieForm.tags : videoForm.tags;
      const currentKids = activeTab === 'movies' ? 'false' : (videoForm.isKids ? 'true' : 'false');
      const currentCategory = isTrailer ? 'trailer' : (activeTab === 'movies' ? 'movie' : videoForm.category);
      const currentCollection = activeTab === 'movies' ? 'Movie Library' : videoForm.collectionTitle;
      const contentType = activeTab === 'movies' ? 'long' : 'long'; 

      const headers = {
        Authorization: `Bearer ${token}`,
        'video-title': encodeURIComponent(currentTitle || ''),
        'video-description': encodeURIComponent(currentDesc || ''),
        'video-tags': encodeURIComponent(currentTags || ''),
        'video-kids': currentKids,
        'video-collection': encodeURIComponent(currentCollection || ''),
        'video-category': encodeURIComponent(currentCategory || ''),
        'video-content-type': contentType,
        'video-source': 'admin',
        'video-only-upload': isTrailer ? 'true' : 'false',
      };
      
      const result = await resumableUpload({
        file,
        url: '/api/videos/upload/resumable',
        headers,
        onProgress: setProgress,
      });
      
      if (isTrailer) {
        if (result && result.videoUrl) {
          setMovieForm((prev) => ({ ...prev, trailerUrl: result.videoUrl }));
        } else if (result && result.fileName) {
          setMovieForm((prev) => ({ ...prev, trailerUrl: `/uploads/reels/${result.fileName}` }));
        }
      } else if (activeTab === 'movies') {
        if (result && result.videoUrl) {
          setMovieForm((prev) => ({ ...prev, videoUrl: result.videoUrl, hlsUrl: result.hlsUrl }));
        } else if (result && result.fileName) {
          setMovieForm((prev) => ({ ...prev, videoUrl: `/uploads/reels/${result.fileName}` }));
        }
      } else {
        if (result && result.videoUrl) {
          setVideoForm((prev) => ({ ...prev, videoUrl: result.videoUrl, hlsUrl: result.hlsUrl }));
        } else if (result && result.fileName) {
          setVideoForm((prev) => ({ ...prev, videoUrl: `/uploads/reels/${result.fileName}` }));
        }
      }
      setMessage({ type: 'success', text: isTrailer ? 'Trailer successfully uploaded!' : 'HQ File successfully transferred and processed!' });
    } catch (err) {
      alert('Video upload failed: ' + err.message);
    } finally {
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const contentLabels = {
    movies: 'Movie',
    stories: 'Story',
    videos: 'Video',
  };

  const currentContentLabel = contentLabels[activeTab] || 'Content';
  const collectionSet = new Set((data.videos || []).map((item) => String(item.collectionTitle || 'Bhagavad Gita').trim()).filter(Boolean));
  const prioritizedCollections = VIDEO_COLLECTION_PRESETS.filter((item) => collectionSet.has(item));
  const customCollections = Array.from(collectionSet)
    .filter((item) => !VIDEO_COLLECTION_PRESETS.includes(item))
    .sort((a, b) => a.localeCompare(b));
  const videoCollectionOptions = ['all', ...prioritizedCollections, ...customCollections];
  const filteredAdminVideos = videoCollectionFilter === 'all'
    ? (data.videos || [])
    : (data.videos || []).filter((item) => String(item.collectionTitle || 'Bhagavad Gita').trim() === videoCollectionFilter);
  
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      console.warn('Unauthorized access to admin dashboard');
      navigate('/');
    } else if (user?.role === 'admin') {
      fetchAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, activeTab, pendingContentFilter, navigate]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      if (activeTab === 'dashboard') {
        const { data: stats } = await axios.get('/api/auth/stats', { headers });
        setData(prev => ({ ...prev, stats }));
      } else if (activeTab === 'users') {
        const { data: users } = await axios.get('/api/auth/users', { headers });
        const normalizedUsers = Array.isArray(users) ? users : (users ? [users] : []);
        setData(prev => ({ ...prev, users: normalizedUsers }));
      } else if (activeTab === 'movies') {
        const { data: movies } = await axios.get('/api/movies', { headers });
        setData(prev => ({ ...prev, movies }));
      } else if (activeTab === 'stories') {
        const { data: stories } = await axios.get('/api/stories', { headers });
        setData(prev => ({ ...prev, stories }));
      } else if (activeTab === 'videos') {
        const [videosResponse, quizSetsRes] = await Promise.all([
          axios.get('/api/videos', { headers }),
          axios.get('/api/quiz/admin/sets', { headers }).catch(() => ({ data: [] })),
        ]);
        setData(prev => ({
          ...prev,
          videos: Array.isArray(videosResponse.data) ? videosResponse.data : [],
          quizSets: Array.isArray(quizSetsRes.data) ? quizSetsRes.data : [],
        }));
      } else if (activeTab === 'reels') {
        const { data: pendingResponse } = await axios.get(`/api/videos/user-reels/moderation?status=${pendingContentFilter === 'all' ? 'pending' : pendingContentFilter}&contentType=all`, { headers });
        setPendingUserReels(Array.isArray(pendingResponse) ? pendingResponse : []);
      } else if (activeTab === 'quizzes') {
        const { data: quizSets } = await axios.get('/api/quiz/admin/sets', { headers });
        setData(prev => ({ ...prev, quizSets: Array.isArray(quizSets) ? quizSets : [] }));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setMessage({ type: 'error', text: 'Session expired or unauthorized. Please log in again.' });
        setTimeout(() => navigate('/login'), 3000);
      } else {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'System error while fetching admin records';
        setMessage({ type: 'error', text: `${errorMsg}. Please check your backend connection.` });
      }
      console.error('Error fetching admin data:', error);
    }
  };

  const handleModerateUserReel = async (id, status) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const note = moderationNotes[id] || '';
      await axios.patch(`/api/videos/user-reels/${id}/moderate`, { status, note }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModerationNotes((prev) => ({ ...prev, [id]: '' }));
      setMessage({ type: 'success', text: `Reel ${status} successfully!` });
      await fetchAdminData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to moderate reel' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleAddContent = async (e) => {
    e.preventDefault();
    
    if (activeTab === 'stories' && editingStoryId) {
       if (!window.confirm("Are you sure you want to save changes to this chapter?")) return;
    }

    setLoading(true);
    let endpoint = '';
    let payload = {};
    const publishLabel = activeTab === 'videos' && videosUploadType === 'quiz' ? 'Quiz Question' : currentContentLabel;

    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'movies') {
        endpoint = editingMovieId ? `/api/movies/${editingMovieId}` : '/api/movies';
        payload = { ...movieForm, tags: movieForm.tags.split(',').map(tag => tag.trim()) };
      } else if (activeTab === 'stories') {
        endpoint = editingStoryId ? `/api/stories/${editingStoryId}` : '/api/stories';
        const languageKey = storyForm.language.charAt(0).toUpperCase() + storyForm.language.slice(1);
        payload = {
          ...storyForm,
          tags: storyForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          title: storyForm.title || storyForm[`title${languageKey}`] || storyForm.titleEnglish || storyForm.titleHindi || storyForm.titleTelugu || '',
          summary: storyForm.summary || storyForm[`summary${languageKey}`] || '',
          content: storyForm.content || storyForm[`content${languageKey}`] || '',
        };
      } else if (activeTab === 'quizzes') {
        endpoint = editingQuizSetId ? `/api/quiz/admin/sets/${editingQuizSetId}` : '/api/quiz/admin/sets';
        payload = {
          ...quizSetForm,
          tags: quizSetForm.tags ? quizSetForm.tags.split(',').map(tag => tag.trim()) : [],
        };
      } else if (activeTab === 'videos') {
        if (videosUploadType === 'quiz') {
          endpoint = '/api/quiz/questions';
          const optionMap = {
            A: quizForm.optionA,
            B: quizForm.optionB,
            C: quizForm.optionC,
            D: quizForm.optionD,
          };
          payload = {
            questionText: quizForm.questionText,
            category: quizForm.category,
            videoUrl: quizForm.videoUrl,
            question: quizForm.questionText,
            options: ['A', 'B', 'C', 'D'].map((k) => optionMap[k]).filter(Boolean),
            correct_answer: optionMap[quizForm.correctOption],
            difficulty: 'medium',
          };
        } else {
          endpoint = '/api/videos';
          if (editingVideoId) {
            endpoint = `/api/videos/${editingVideoId}`;
          }
          payload = {
            ...videoForm,
            collectionTitle: String(videoForm.collectionTitle || '').trim() || 'Bhagavad Gita',
            tags: videoForm.tags.split(',').map(tag => tag.trim()),
            videoQuizDraft: videoQuizDraft && videoQuizDraft.questionText ? videoQuizDraft : null,
          };
        }
      }


      if (activeTab === 'stories' && editingStoryId) {
        const { data: updatedStory } = await axios.patch(endpoint, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(prev => ({
           ...prev,
           stories: prev.stories.map(st => (String(st._id || st.id) === String(editingStoryId)) ? updatedStory : st)
        }));
      } else if (activeTab === 'movies' && editingMovieId) {
        const { data: updatedMovie } = await axios.patch(endpoint, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(prev => ({
           ...prev,
           movies: prev.movies.map(m => (String(m._id || m.id) === String(editingMovieId)) ? updatedMovie : m)
        }));
      } else if (activeTab === 'videos' && editingVideoId && videosUploadType === 'video') {
        const { data: updatedVideo } = await axios.patch(endpoint, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(prev => ({
           ...prev,
           videos: prev.videos.map(v => (String(v._id || v.id) === String(editingVideoId)) ? updatedVideo : v)
        }));
      } else if (activeTab === 'videos' && videosUploadType === 'video') {
        // 1. Upload video
        const videoRes = await axios.post(endpoint, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const videoId = videoRes?.data?._id || videoRes?.data?.id || videoRes?.data?.videoId || null;
        // 2. Upload quizzes if any
        if (videoQuizList.length > 0 && videoId) {
          for (const quiz of videoQuizList) {
            const quizPayload = {
              questionText: quiz.questionText,
              category: videoForm.collectionTitle || 'Gita Challenge',
              videoUrl: videoForm.videoUrl,
              options: ['A', 'B', 'C', 'D']
                .map((key) => ({ answerText: String(quiz[`option${key}`] || '').trim(), isCorrect: quiz.correctOption === key }))
                .filter((item) => item.answerText),
              videoId,
            };
            await axios.post('/api/quiz/questions', quizPayload, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        }
      } else if (activeTab === 'quizzes') {
        if (editingQuizSetId) {
          const { data: updatedSet } = await axios.put(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });
          setData(prev => ({ ...prev, quizSets: prev.quizSets.map(q => (q._id === editingQuizSetId) ? updatedSet.quizSet : q) }));
        } else {
          const { data: newlyCreated } = await axios.post(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });
          setData(prev => ({ ...prev, quizSets: [newlyCreated.quizSet, ...prev.quizSets] }));
        }
      } else {
        const { data: newlyCreated } = await axios.post(endpoint, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (activeTab === 'stories') {
           setData(prev => ({ ...prev, stories: [newlyCreated, ...prev.stories] }));
        } else if (activeTab === 'movies') {
           setData(prev => ({ ...prev, movies: [newlyCreated, ...prev.movies] }));
        }
      }

      setMessage({ type: 'success', text: (editingStoryId || editingMovieId || editingVideoId) ? 'Updated successfully!' : `${publishLabel} published successfully!` });
      setShowAddModal(false);
      resetForms();
      setVideoQuizList([]);
      
      if (activeTab === 'videos' || activeTab === 'quiz' || activeTab === 'reels' || activeTab === 'users' || activeTab === 'dashboard') {
         await fetchAdminData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to publish content' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleDeleteContent = async (type, id, title) => {
    const confirmed = window.confirm(`Delete ${type.slice(0, -1)}: "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`/api/${type}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage({ type: 'success', text: `${type.slice(0, -1)} deleted successfully!` });
      await fetchAdminData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || `Failed to delete ${type.slice(0, -1)}` });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleDeleteUser = async (id, name, role) => {
    if (role === 'admin') {
      setMessage({ type: 'error', text: 'Admin accounts cannot be deleted.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return;
    }

    const confirmed = window.confirm(`Delete user account: "${name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`/api/auth/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: 'success', text: 'User account deleted successfully!' });
      await fetchAdminData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete user account' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleClearCache = async () => {
    const confirmed = window.confirm('Are you sure you want to globally clear the backend API cache? This will cause the next immediate requests to fetch from the database.');
    if (!confirmed) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/clear-cache', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: 'success', text: 'Global API Cache cleared successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to clear cache' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const resetForms = () => {
    setMovieForm({ title: '', description: '', videoUrl: '', trailerUrl: '', thumbnail: '', releaseYear: 2025, ownerHistory: '', tags: '', views: 0, isComingSoon: false });
    setStoryForm({
      title: '',
      titleTelugu: '',
      titleHindi: '',
      titleEnglish: '',
      seriesTitle: 'Bhagavad Gita',
      content: '',
      chapter: 1,
      summary: '',
      summaryTelugu: '',
      summaryHindi: '',
      summaryEnglish: '',
      contentTelugu: '',
      contentHindi: '',
      contentEnglish: '',
      language: 'english',
      thumbnail: '',
      tags: '',
    });
    setVideoForm({ title: '', description: '', videoUrl: '', category: 'reels', collectionTitle: 'Bhagavad Gita', isKids: false, tags: '', quizSetId: '', views: 0 });
    setQuizSetForm({ title: '', description: '', category: 'General', difficulty: 'medium', timeLimit: 0, thumbnail: '', tags: '', isPublished: false, questions: [] });
    setEditingQuizSetId(null);
    setQuizForm({
      questionText: '',
      category: 'Gita Challenge',
      videoUrl: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'B',
    });
    setVideosUploadType('video');
    setEditingStoryId(null);
    setEditingMovieId(null);
    setEditingVideoId(null);
  };

  const handleEditStory = (story) => {
    setActiveTab('stories');
    setEditingStoryId(story._id || story.id);
    setEditingMovieId(null);
    setEditingVideoId(null);
    setStoryForm({
      title: story.title || '',
      titleTelugu: story.titleTelugu || '',
      titleHindi: story.titleHindi || '',
      titleEnglish: story.titleEnglish || '',
      seriesTitle: story.seriesTitle || 'Bhagavad Gita',
      content: story.content || '',
      chapter: story.chapter || 1,
      summary: story.summary || '',
      summaryTelugu: story.summaryTelugu || '',
      summaryHindi: story.summaryHindi || '',
      summaryEnglish: story.summaryEnglish || '',
      contentTelugu: story.contentTelugu || '',
      contentHindi: story.contentHindi || '',
      contentEnglish: story.contentEnglish || '',
      language: story.language || 'english',
      thumbnail: story.thumbnail || '',
      tags: Array.isArray(story.tags) ? story.tags.join(', ') : (story.tags || ''),
    });
    setShowAddModal(true);
  };

  const handleEditMovie = (movie) => {
    setActiveTab('movies');
    setEditingMovieId(movie._id || movie.id);
    setEditingStoryId(null);
    setEditingVideoId(null);
    setMovieForm({
      title: movie.title || '',
      description: movie.description || '',
      videoUrl: movie.videoUrl || '',
      thumbnail: movie.thumbnail || '',
      releaseYear: movie.releaseYear || 2025,
      ownerHistory: movie.ownerHistory || '',
      tags: Array.isArray(movie.tags) ? movie.tags.join(', ') : (movie.tags || ''),
      views: movie.views || 0,
      isComingSoon: movie.isComingSoon || false,
    });
    setShowAddModal(true);
  };

  const handleEditVideo = (video) => {
    setActiveTab('videos');
    setEditingVideoId(video._id || video.id);
    setEditingStoryId(null);
    setEditingMovieId(null);
    setVideosUploadType('video');
    setVideoForm({
      title: video.title || '',
      description: video.description || '',
      videoUrl: video.videoUrl || '',
      category: video.category || 'reels',
      collectionTitle: video.collectionTitle || 'Bhagavad Gita',
      isKids: video.isKids || false,
      tags: Array.isArray(video.tags) ? video.tags.join(', ') : (video.tags || ''),
      views: video.views || 0,
    });
    setShowAddModal(true);
  };

  const handleQuickFillStoryTitle = async (story, targetLanguage) => {
    const storyId = story?._id || story?.id;
    if (!storyId) return;

    const baseTitle = String(story.title || '').trim();
    if (!baseTitle) {
      setMessage({ type: 'error', text: 'Primary title is required before quick fill.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3500);
      return;
    }

    const fieldByLanguage = {
      te: 'titleTelugu',
      hi: 'titleHindi',
      en: 'titleEnglish',
    };
    const targetField = fieldByLanguage[targetLanguage];
    if (!targetField) return;

    const currentTargetValue = String(story[targetField] || '').trim();
    if (currentTargetValue) {
      setMessage({ type: 'success', text: `${targetLanguage.toUpperCase()} title already exists.` });
      setTimeout(() => setMessage({ type: '', text: '' }), 2500);
      return;
    }

    const updatedPayload = {
      title: story.title,
      [targetField]: baseTitle,
    };

    try {
      setQuickFillStoryId(storyId);
      const token = localStorage.getItem('token');
      await axios.patch(`/api/stories/${storyId}`, updatedPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: 'success', text: `${targetLanguage.toUpperCase()} title filled successfully.` });
      await fetchAdminData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || `Failed to fill ${targetLanguage.toUpperCase()} title` });
    } finally {
      setQuickFillStoryId(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const hasLocalizedTitle = (value) => Boolean(String(value || '').trim());

  const filteredStories = data.stories.filter((story) => {
    if (storyLanguageFilter === 'all') return true;
    if (storyLanguageFilter === 'missing-any') {
      return !hasLocalizedTitle(story.titleTelugu)
        || !hasLocalizedTitle(story.titleHindi)
        || !hasLocalizedTitle(story.titleEnglish);
    }
    if (storyLanguageFilter === 'missing-te') return !hasLocalizedTitle(story.titleTelugu);
    if (storyLanguageFilter === 'missing-hi') return !hasLocalizedTitle(story.titleHindi);
    if (storyLanguageFilter === 'missing-en') return !hasLocalizedTitle(story.titleEnglish);
    return true;
  });

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#06101E]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-devotion-gold"></div></div>;

  return (
    <div className="min-h-screen bg-[#06101E] text-white flex flex-col">
      {message.type === 'error' && message.text.toLowerCase().includes('login') && (
        <div className="w-full flex flex-col items-center justify-center py-8 bg-black/90 z-50">
          <div className="text-2xl font-bold text-yellow-400 mb-4">{message.text}</div>
          <button
            onClick={() => { setShowAuthError(false); navigate('/login'); }}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold text-lg shadow-lg hover:scale-105 transition-transform"
          >
            Go to Login
          </button>
        </div>
      )}
      {/* Admin Sidebar (Desktop) */}
      <div className="w-72 bg-devotion-darkBlue/80 backdrop-blur-2xl border-r border-white/5 hidden md:flex flex-col shadow-2xl">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 bg-devotion-gold/20 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-devotion-gold" />
             </div>
             <h2 className="text-xl font-serif font-black text-white tracking-widest uppercase">
               Gita<span className="text-devotion-gold">Admin</span>
             </h2>
          </div>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Spiritual Management</p>
        </div>
        <nav className="flex-1 p-6 space-y-3">
          {[
            { id: 'dashboard', name: 'Analytics', icon: <Database className="w-5 h-5" /> },
            { id: 'movies', name: 'Movies', icon: <Film className="w-5 h-5" /> },
            { id: 'stories', name: 'Stories', icon: <BookOpen className="w-5 h-5" /> },
            { id: 'videos', name: 'Videos', icon: <Video className="w-5 h-5" /> },
            { id: 'reels', name: 'Reels Moderation', icon: <Video className="w-5 h-5 text-devotion-gold" /> },
            { id: 'quizzes', name: 'Quiz Manager', icon: <Check className="w-5 h-5 text-green-400" /> },
            { id: 'users', name: 'Users', icon: <Users className="w-5 h-5" /> },
            { id: 'notifications', name: 'Notifications', icon: <AlertCircle className="w-5 h-5 text-purple-400" /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === item.id ? 'bg-devotion-gold text-devotion-darkBlue shadow-2xl' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {item.icon} {item.name}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 font-black text-[10px] uppercase tracking-widest transition-all"
          >
            <LogOut className="w-5 h-5" /> Exit to App
          </button>
        </div>
      </div>

      {/* Mobile Admin Topbar Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-devotion-darkBlue/95 border-b border-devotion-gold/20 flex items-center justify-between px-4 py-3 shadow-xl">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-devotion-gold" />
          <span className="font-serif font-black text-lg text-white tracking-widest uppercase">Gita<span className="text-devotion-gold">Admin</span></span>
        </div>
        <div className="relative">
          <button
            onClick={() => { setShowAddModal(false); setShowMobileMenu((v) => !v); }}
            className="p-2 rounded-full bg-devotion-gold/10 border border-devotion-gold/30 text-devotion-gold focus:outline-none focus:ring-2 focus:ring-devotion-gold"
            aria-label="Open admin menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          {showMobileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-devotion-darkBlue border border-devotion-gold/20 rounded-2xl shadow-2xl z-50">
              {[
                { id: 'dashboard', name: 'Analytics', icon: <Database className="w-4 h-4" /> },
                { id: 'movies', name: 'Movies', icon: <Film className="w-4 h-4" /> },
                { id: 'stories', name: 'Stories', icon: <BookOpen className="w-4 h-4" /> },
                { id: 'videos', name: 'Videos', icon: <Video className="w-4 h-4" /> },
                { id: 'reels', name: 'Reels Moderation', icon: <Video className="w-4 h-4 text-devotion-gold" /> },
                { id: 'quizzes', name: 'Quiz Manager', icon: <Check className="w-4 h-4 text-green-400" /> },
                { id: 'users', name: 'Users', icon: <Users className="w-4 h-4" /> },
                { id: 'notifications', name: 'Notifications', icon: <AlertCircle className="w-4 h-4 text-purple-400" /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }}
                  className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-black text-[11px] uppercase tracking-widest ${activeTab === item.id ? 'bg-devotion-gold text-devotion-darkBlue' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                >
                  {item.icon} {item.name}
                </button>
              ))}
              <button
                onClick={() => { navigate('/'); setShowMobileMenu(false); }}
                className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-black text-[11px] uppercase tracking-widest transition-all border-t border-devotion-gold/10 mt-2"
              >
                <LogOut className="w-4 h-4" /> Exit to App
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col pt-20 sm:pt-24 tv:pt-36 px-4 md:px-10 tv:px-20 pb-10 overflow-y-auto">
         
         {message.text && (
           <div className={`fixed top-28 right-10 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl animate-shake shadow-2xl ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-bold text-sm">{message.text}</span>
           </div>
         )}

         <div className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div>
               <h1 className="text-4xl sm:text-6xl tv:text-[10rem] font-serif font-black text-white mb-2 uppercase tracking-tighter leading-none">
                 {activeTab} <span className="text-devotion-gold">Center</span>
               </h1>
               <p className="text-gray-500 tv:text-3xl text-sm font-serif italic">Managing the divine knowledge base.</p>
            </div>
            
            {['movies', 'stories', 'videos', 'quizzes'].includes(activeTab) && (
              <button
                onClick={() => {
                  resetForms();
                  if (activeTab === 'videos') {
                    setVideosUploadType('video');
                  }
                  setShowAddModal(true);
                }}
                className="bg-devotion-gold text-devotion-darkBlue px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-yellow-400 transition-all flex items-center gap-3 shadow-2xl shadow-devotion-gold/20 transform hover:-translate-y-1 active:scale-95"
              >
                <Plus className="w-5 h-5" /> Add New {activeTab === 'videos' ? 'Video' : activeTab === 'quizzes' ? 'Quiz Set' : currentContentLabel}
              </button>
            )}
         </div>

          <div className="grid grid-cols-1 gap-6">
            {activeTab === 'dashboard' && data.stats && (
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                   {[
                     { label: 'Seekers Joined', value: data.stats.totalUsers, icon: <Users />, color: 'text-blue-400' },
                     { label: 'Divine Movies', value: data.stats.totalMovies, icon: <Film />, color: 'text-devotion-gold' },
                     { label: 'Wisdom Stories', value: data.stats.totalStories, icon: <BookOpen />, color: 'text-orange-400' },
                     { label: 'Library Videos', value: data.stats.totalVideos, icon: <Video />, color: 'text-green-400' },
                   ].map((stat) => (
                     <div key={stat.label} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-3xl shadow-2xl">
                        <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 ${stat.color}`}>
                           {stat.icon}
                        </div>
                        <h4 className="text-4xl font-black text-white mb-2">{stat.value}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{stat.label}</p>
                     </div>
                   ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {data.stats && (
                  <>
                    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                       <h3 className="text-xl font-serif font-black text-white mb-6 uppercase tracking-widest text-center">Engagement Mix</h3>
                       <div className="h-[300px] w-full flex items-center justify-center">
                          <ResponsiveContainer width="99%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Users', value: data.stats.totalUsers || 0 },
                                  { name: 'Movies', value: data.stats.totalMovies || 0 },
                                  { name: 'Stories', value: data.stats.totalStories || 0 },
                                ]}
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={8}
                                dataKey="value"
                              >
                                <Cell fill="#fbbf24" />
                                <Cell fill="#fb923c" />
                                <Cell fill="#4ade80" />
                              </Pie>
                              <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                       <h3 className="text-xl font-serif font-black text-white mb-6 uppercase tracking-widest text-center">Platform Overview</h3>
                       <div className="h-[300px] w-full flex items-center justify-center">
                         <ResponsiveContainer width="99%" height="100%">
                           <BarChart
                             data={[
                               { name: 'Users', count: data.stats.totalUsers || 0 },
                               { name: 'Movies', count: data.stats.totalMovies || 0 },
                               { name: 'Stories', count: data.stats.totalStories || 0 },
                               { name: 'Videos', count: data.stats.totalVideos || 0 },
                             ]}
                             margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                           >
                             <XAxis dataKey="name" stroke="#64748b" />
                             <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                             <Bar dataKey="count" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                           </BarChart>
                         </ResponsiveContainer>
                       </div>
                    </div>
                  </>
                )}
              </div>

              {data.stats && data.stats.recentUsers && (
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                  <h3 className="text-2xl font-serif font-black text-white mb-10 uppercase tracking-widest flex items-center gap-4">
                     <Users className="text-devotion-gold" /> Recent Seeker Signups
                  </h3>
                  <div className="space-y-4">
                     {data.stats.recentUsers.map(user => (
                       <div key={user.id || user._id || user.email} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-devotion-gold/30 transition-all">
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 rounded-full bg-devotion-gold/20 flex items-center justify-center text-devotion-gold font-black">
                                {user.name ? user.name[0].toUpperCase() : '?'}
                             </div>
                             <div>
                                <h5 className="font-bold text-white">{user.name}</h5>
                                <p className="text-xs text-gray-500">{user.email}</p>
                             </div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                             {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                       </div>
                     ))}
                  </div>
                </div>
              )}

                 <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl mt-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                           <h3 className="text-2xl font-serif font-black text-white uppercase tracking-widest flex items-center gap-4">
                              <Database className="text-devotion-gold" /> System Health & Performance
                           </h3>
                           <p className="text-gray-400 text-sm mt-2">Manage the platform's in-memory API caching system.</p>
                        </div>
                        <button
                          onClick={handleClearCache}
                          disabled={loading}
                          className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white transition-all px-8 py-4 rounded-2xl font-black tracking-widest uppercase text-xs flex items-center gap-2"
                        >
                          <Flame className="w-4 h-4" /> Clear API Cache
                        </button>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'users' && (
               <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                  <div className="flex justify-between items-center mb-12">
                     <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter">Registered <span className="text-devotion-gold">Seekers</span></h3>
                     <span className="bg-devotion-gold/10 text-devotion-gold px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border border-devotion-gold/30">Total: {data.users.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {data.users.map(u => (
                       <div key={u._id || u.id || u.email} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 hover:border-devotion-gold/30 transition-all shadow-xl group">
                          <div className="flex items-center gap-6 mb-6">
                             <div className="w-16 h-16 rounded-2xl overflow-hidden bg-devotion-maroon flex items-center justify-center border-2 border-devotion-gold/20">
                                {u.profilePicture ? <img src={u.profilePicture} className="w-full h-full object-cover" /> : <span className="text-2xl font-black text-devotion-gold">{u.name[0]}</span>}
                             </div>
                             <div>
                                <h4 className="font-serif font-bold text-xl text-white group-hover:text-devotion-gold transition-colors">{u.name}</h4>
                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{u.email}</p>
                             </div>
                          </div>
                        <div className="space-y-2 text-xs mb-5 bg-black/20 rounded-2xl p-4 border border-white/5">
                          <p className="text-gray-300"><span className="text-gray-500">Username:</span> {u.name || 'N/A'}</p>
                          <p className="text-gray-300 truncate"><span className="text-gray-500">Email:</span> {u.email || 'N/A'}</p>
                          <p className="text-gray-300"><span className="text-gray-500">Password:</span> Stored securely (not viewable)</p>
                          <p className="text-gray-300"><span className="text-gray-500">Joined:</span> {u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A'}</p>
                        </div>
                          <div className="flex items-center justify-between pt-6 border-t border-white/5">
                             <div className="flex items-center gap-2">
                                <Flame className="w-4 h-4 text-orange-500" />
                                <span className="font-black text-xs text-white">{u.streak} Days</span>
                             </div>
                             <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-devotion-gold text-devotion-darkBlue' : 'bg-white/10 text-gray-400'}`}>
                                {u.role}
                             </span>
                          </div>
                            <button
                             onClick={() => handleDeleteUser(u._id || u.id, u.name, u.role)}
                             disabled={u.role === 'admin' || !(u._id || u.id)}
                             className={`mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' || !(u._id || u.id) ? 'border-white/10 text-gray-500 cursor-not-allowed' : 'border-red-500/30 text-red-300 hover:text-red-200 hover:bg-red-500/10'}`}
                            >
                             <Trash2 className="w-4 h-4" /> Delete User
                            </button>
                       </div>
                     ))}
                  </div>
               </div>
            )}

            {activeTab === 'movies' && (
               <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                  <div className="flex justify-between items-center mb-10">
                     <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter">Movie <span className="text-devotion-gold">Library</span></h3>
                     <span className="bg-devotion-gold/10 text-devotion-gold px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border border-devotion-gold/30">Total: {data.movies.length}</span>
                  </div>
                  {data.movies.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No movies uploaded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-x-auto">
                      {data.movies.map((movie) => (
                        <div key={movie._id || movie.id} className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col">
                          {movie.videoUrl && (
                            <div className="mb-4 rounded-xl overflow-hidden border border-devotion-gold/20 aspect-video bg-black">
                              <MediaPlayerHLS
                                url={movie.videoUrl}
                                hlsUrl={movie.hlsUrl}
                                title={movie.title}
                                className="w-full h-full object-cover"
                                youtubeParams="autoplay=0&rel=0&modestbranding=1"
                                controls
                              />
                            </div>
                          )}
                          <h4 className="text-white font-bold text-lg mb-2">{movie.title}</h4>
                          <p className="text-xs text-gray-400 mb-3">{movie.releaseYear || 'N/A'} • {(movie.tags || []).join(', ') || 'No tags'} • <span className="text-devotion-gold inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {movie.views || 0}</span></p>
                          <p className="text-sm text-gray-300 line-clamp-2 mb-4">{movie.description || 'No description'}</p>
                          <div className="mt-auto flex gap-2">
                            <button
                              onClick={() => handleEditMovie(movie)}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-devotion-gold/30 text-devotion-gold hover:text-white hover:bg-devotion-gold/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteContent('movies', movie._id || movie.id, movie.title || 'Untitled')}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            )}

            {activeTab === 'stories' && (
               <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                  <div className="flex justify-between items-center mb-10">
                     <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter">Story <span className="text-devotion-gold">Library</span></h3>
                     <span className="bg-devotion-gold/10 text-devotion-gold px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border border-devotion-gold/30">Total: {filteredStories.length}/{data.stories.length}</span>
                  </div>

                  <div className="mb-6 flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'missing-any', label: 'Any Missing' },
                      { key: 'missing-te', label: 'Missing TE' },
                      { key: 'missing-hi', label: 'Missing HI' },
                      { key: 'missing-en', label: 'Missing EN' },
                    ].map((filterOption) => (
                      <button
                        key={filterOption.key}
                        type="button"
                        onClick={() => setStoryLanguageFilter(filterOption.key)}
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${storyLanguageFilter === filterOption.key ? 'border-devotion-gold/50 bg-devotion-gold/20 text-devotion-gold' : 'border-white/15 text-gray-300 hover:border-devotion-gold/30 hover:text-white'}`}
                      >
                        {filterOption.label}
                      </button>
                    ))}
                  </div>

                  {filteredStories.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No stories uploaded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredStories.map((story) => (
                        <div key={story._id || story.id} className="p-6 rounded-2xl border border-white/10 bg-white/5">
                          <h4 className="text-white font-bold text-lg mb-2">{story.title}</h4>
                          <p className="text-xs text-gray-400 mb-3">
                            {story.seriesTitle || 'Bhagavad Gita'} • Chapter {story.chapter || 1} • {(story.language || 'english')}
                            <br/><span className="text-devotion-gold/60 mt-1 inline-block">Updated: {story.updatedAt ? new Date(story.updatedAt).toLocaleDateString() : 'N/A'}</span>
                          </p>
                          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
                            <div className="mb-2 flex flex-wrap gap-2">
                              <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${story.titleTelugu ? 'border-devotion-gold/40 text-devotion-gold' : 'border-white/10 text-white/35'}`}>TE</span>
                              <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${story.titleHindi ? 'border-devotion-gold/40 text-devotion-gold' : 'border-white/10 text-white/35'}`}>HI</span>
                              <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${story.titleEnglish ? 'border-devotion-gold/40 text-devotion-gold' : 'border-white/10 text-white/35'}`}>EN</span>
                            </div>
                            <div className="space-y-1 text-[11px] text-gray-300">
                              <p className="line-clamp-1"><span className="text-devotion-gold">TE:</span> {story.titleTelugu || '-'}</p>
                              <p className="line-clamp-1"><span className="text-devotion-gold">HI:</span> {story.titleHindi || '-'}</p>
                              <p className="line-clamp-1"><span className="text-devotion-gold">EN:</span> {story.titleEnglish || '-'}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-3">{story.summary || story.description || 'No summary'}</p>
                          <div className="mt-5 flex flex-wrap gap-2">
                            {!hasLocalizedTitle(story.titleTelugu) && (
                              <button
                                onClick={() => handleQuickFillStoryTitle(story, 'te')}
                                disabled={quickFillStoryId === (story._id || story.id)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${quickFillStoryId === (story._id || story.id) ? 'border-white/15 text-white/45 cursor-not-allowed' : 'border-[#9FD9F0]/30 text-[#9FD9F0] hover:text-white hover:bg-[#9FD9F0]/10'}`}
                              >
                                {quickFillStoryId === (story._id || story.id) ? 'Saving...' : 'Fill TE'}
                              </button>
                            )}
                            {!hasLocalizedTitle(story.titleHindi) && (
                              <button
                                onClick={() => handleQuickFillStoryTitle(story, 'hi')}
                                disabled={quickFillStoryId === (story._id || story.id)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${quickFillStoryId === (story._id || story.id) ? 'border-white/15 text-white/45 cursor-not-allowed' : 'border-[#9FD9F0]/30 text-[#9FD9F0] hover:text-white hover:bg-[#9FD9F0]/10'}`}
                              >
                                {quickFillStoryId === (story._id || story.id) ? 'Saving...' : 'Fill HI'}
                              </button>
                            )}
                            {!hasLocalizedTitle(story.titleEnglish) && (
                              <button
                                onClick={() => handleQuickFillStoryTitle(story, 'en')}
                                disabled={quickFillStoryId === (story._id || story.id)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${quickFillStoryId === (story._id || story.id) ? 'border-white/15 text-white/45 cursor-not-allowed' : 'border-[#9FD9F0]/30 text-[#9FD9F0] hover:text-white hover:bg-[#9FD9F0]/10'}`}
                              >
                                {quickFillStoryId === (story._id || story.id) ? 'Saving...' : 'Fill EN'}
                              </button>
                            )}
                            <button
                              onClick={() => handleEditStory(story)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-devotion-gold/30 text-devotion-gold hover:text-white hover:bg-devotion-gold/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteContent('stories', story._id || story.id, story.title || 'Untitled')}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            )}

            {activeTab === 'videos' && (
               <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                  <div className="flex justify-between items-center mb-10">
                     <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter">Video <span className="text-devotion-gold">Library</span></h3>
                     <span className="bg-devotion-gold/10 text-devotion-gold px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border border-devotion-gold/30">Total: {filteredAdminVideos.length}/{data.videos.length}</span>
                  </div>

                  {data.videos.length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-2">
                      {videoCollectionOptions.map((collection) => (
                        <button
                          key={collection}
                          onClick={() => setVideoCollectionFilter(collection)}
                          className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${videoCollectionFilter === collection ? 'border-devotion-gold/50 bg-devotion-gold/20 text-devotion-gold' : 'border-white/15 text-gray-300 hover:border-devotion-gold/30 hover:text-white'}`}
                        >
                          {collection === 'all' ? 'All Collections' : collection}
                        </button>
                      ))}
                    </div>
                  )}

                  {pendingUserReels.length > 0 && (
                    <div className="mb-10 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                        <h4 className="text-yellow-300 font-black text-xs uppercase tracking-widest">Pending User Reels For Review</h4>
                        <div className="flex gap-2">
                          {['all', 'spiritual', 'other'].map((type) => (
                            <button
                              key={type}
                              onClick={() => setPendingContentFilter(type)}
                              className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${pendingContentFilter === type ? 'border-devotion-gold/50 bg-devotion-gold/20 text-devotion-gold' : 'border-white/15 text-gray-300 hover:bg-white/10'}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingUserReels.map((reel) => (
                          <div key={reel._id || reel.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 flex flex-col">
                            {reel.videoUrl && (
                              <div className="mb-4 rounded-xl overflow-hidden border border-devotion-gold/20 aspect-[9/16] bg-black max-h-[300px] mx-auto">
                                <MediaPlayerHLS
                                  url={reel.videoUrl}
                                  hlsUrl={reel.hlsUrl}
                                  title={reel.title}
                                  className="w-full h-full object-cover"
                                  controls
                                />
                              </div>
                            )}
                            <p className="text-white font-bold mb-1 line-clamp-1">{reel.title}</p>
                            <p className="text-xs text-gray-300 mb-2 line-clamp-2">{reel.description || 'No description'}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                              Type: {reel.contentType || 'other'}
                            </p>
                            <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
                              Uploader: {reel.uploaderName || 'Unknown User'}
                              {reel.uploaderEmail && <span className="text-gray-400 font-normal lowercase ml-1">({reel.uploaderEmail})</span>}
                            </p>
                            <textarea
                              rows="2"
                              value={moderationNotes[reel._id || reel.id] || ''}
                              onChange={(e) => setModerationNotes((prev) => ({ ...prev, [reel._id || reel.id]: e.target.value }))}
                              placeholder="Required when rejecting: reason/note"
                              className="w-full mb-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-devotion-gold/40"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleModerateUserReel(reel._id || reel.id, 'approved')}
                                className="flex-1 px-3 py-2 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-[10px] font-black uppercase tracking-widest"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleModerateUserReel(reel._id || reel.id, 'rejected')}
                                className="flex-1 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-black uppercase tracking-widest"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleDeleteContent('videos', reel._id || reel.id, reel.title || 'Untitled')}
                                className="flex-1 px-3 py-2 rounded-xl bg-red-900/20 border border-red-700/40 text-red-200 text-[10px] font-black uppercase tracking-widest"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.videos.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No videos uploaded yet.</p>
                  ) : filteredAdminVideos.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No videos found for this collection.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredAdminVideos.map((video) => (
                        <div key={video._id || video.id} className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col">
                          {video.videoUrl && (
                            <div className="mb-4 rounded-xl overflow-hidden border border-devotion-gold/20 aspect-video bg-black">
                              <MediaPlayerHLS
                                url={video.videoUrl}
                                hlsUrl={video.hlsUrl}
                                title={video.title}
                                className="w-full h-full object-cover"
                                youtubeParams="autoplay=0&rel=0&modestbranding=1"
                                controls
                              />
                            </div>
                          )}
                          <h4 className="text-white font-bold text-lg mb-2">{video.title}</h4>
                          <p className="text-xs text-gray-400 mb-3">{video.collectionTitle || 'Bhagavad Gita'} • {video.category || 'General'} • {video.isKids ? 'Kids' : 'All Ages'} • <span className="text-devotion-gold inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {video.views || 0}</span></p>
                          <p className="text-sm text-gray-300 line-clamp-2 mb-4">{video.description || 'No description'}</p>
                          <div className="mt-auto flex gap-2">
                            <button
                              onClick={() => handleEditVideo(video)}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-devotion-gold/30 text-devotion-gold hover:text-white hover:bg-devotion-gold/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteContent('videos', video._id || video.id, video.title || 'Untitled')}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-12 border-t border-white/10 pt-10">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl font-serif font-black text-white uppercase tracking-tighter">Quiz <span className="text-devotion-gold">Library</span></h3>
                      <div className="flex items-center gap-3">
                        <span className="bg-devotion-gold/10 text-devotion-gold px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border border-devotion-gold/30">Total: {data.quizQuestions.length}</span>
                        <button
                          onClick={() => {
                            resetForms();
                            setVideosUploadType('quiz');
                            setShowAddModal(true);
                          }}
                          className="bg-white/10 border border-white/20 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/15 transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Add Quiz
                        </button>
                      </div>
                    </div>

                    {data.quizQuestions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No quiz questions uploaded yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-x-auto">
                        {data.quizQuestions.map((question) => (
                          <div key={question._id || question.id} className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col">
                            <p className="text-[10px] uppercase tracking-widest text-devotion-gold mb-2">{question.category || 'Gita Challenge'}</p>
                            <h4 className="text-white font-bold text-lg mb-4">{question.questionText || question.question}</h4>
                            <ul className="space-y-2 mb-5">
                              {(question.options || []).map((option, idx) => {
                                const isCorrect = typeof option === 'string' ? option === question.correct_answer : option.isCorrect;
                                const answerText = typeof option === 'string' ? option : option.answerText;
                                return (
                                  <li key={`${question._id || question.id}-${idx}`} className={`text-sm px-3 py-2 rounded-lg border ${isCorrect ? 'border-green-500/40 bg-green-500/10 text-green-300' : 'border-white/10 text-gray-300'}`}>
                                    {answerText}
                                  </li>
                                );
                              })}
                            </ul>
                            <button
                              onClick={() => handleDeleteContent('quiz/questions', question._id || question.id, question.questionText || question.question || 'Question')}
                              className="mt-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
               </div>
            )}

            {activeTab === 'reels' && (
               <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                  <div className="flex justify-between items-center mb-10">
                     <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter">Reels <span className="text-devotion-gold">Moderation</span></h3>
                     <div className="flex bg-black/40 p-1 rounded-xl">
                        {['pending', 'approved', 'rejected'].map(status => (
                           <button
                             key={status}
                             onClick={() => setPendingContentFilter(status)}
                             className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${pendingContentFilter === status ? 'bg-devotion-gold text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                           >
                              {status}
                           </button>
                        ))}
                     </div>
                  </div>
                  {pendingUserReels.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No {pendingContentFilter} reels found.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto">
                      {pendingUserReels.map((reel) => (
                        <div key={reel._id || reel.id} className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col">
                          {reel.videoUrl && (
                            <div className="mb-4 rounded-xl overflow-hidden border border-devotion-gold/20 aspect-[9/16] bg-black relative max-h-[400px]">
                              <MediaPlayerHLS
                                url={reel.videoUrl}
                                hlsUrl={reel.hlsUrl}
                                title={reel.title}
                                className="w-full h-full object-cover"
                                youtubeParams="autoplay=0&rel=0&modestbranding=1"
                                controls
                              />
                            </div>
                          )}
                          <h4 className="text-white font-bold text-lg mb-2">{reel.title}</h4>
                          <div className="flex items-center gap-2 mb-3 bg-black/30 p-2 rounded-lg border border-white/5">
                             <div className="w-6 h-6 rounded-full bg-devotion-gold flex items-center justify-center text-black font-black text-[10px]">
                                {(reel.uploadedBy?.name?.[0] || reel.uploaderName?.[0] || reel.uploader?.name?.[0] || 'U').toUpperCase()}
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-devotion-gold uppercase tracking-widest">{reel.uploadedBy?.name || reel.uploaderName || reel.uploader?.name || 'Unknown Seeker'}</p>
                                <p className="text-[9px] text-gray-500 uppercase">{reel.uploadedBy?.email || reel.uploaderEmail || reel.uploader?.email || 'No email'} • <span className="text-devotion-gold inline-flex items-center gap-1"><Eye className="w-2 h-2" /> {reel.views || 0}</span></p>
                             </div>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-2 mb-4">{reel.description || 'No description provided'}</p>
                          
                          {pendingContentFilter === 'pending' && (
                             <div className="mt-auto space-y-3 pt-4 border-t border-white/10">
                               <input 
                                 placeholder="Optional rejection note..."
                                 className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-devotion-gold outline-none"
                                 value={moderationNotes[reel._id || reel.id] || ''}
                                 onChange={e => setModerationNotes({...moderationNotes, [reel._id || reel.id]: e.target.value})}
                               />
                               <div className="flex gap-2">
                                  <button
                                    onClick={() => handleModerateUserReel(reel._id || reel.id, 'approved')}
                                    className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleModerateUserReel(reel._id || reel.id, 'rejected')}
                                    className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                  >
                                    Reject
                                  </button>
                               </div>
                             </div>
                          )}
                          
                          {pendingContentFilter !== 'pending' && (
                             <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/10">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${reel.moderationStatus === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                   {reel.moderationStatus}
                                </span>
                                <button
                                  onClick={() => handleDeleteContent('videos', reel._id || reel.id, reel.title || 'Untitled Reel')}
                                  className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-red-500/30 text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all text-[9px] font-black uppercase tracking-widest"
                                >
                                  <Trash2 className="w-3 h-3" /> Dump
                                </button>
                             </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            )}

            {activeTab === 'quizzes' && (
               <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                  <div className="flex justify-between items-center mb-10">
                     <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter">Quiz <span className="text-devotion-gold">Manager</span></h3>
                     <span className="bg-devotion-gold/10 text-devotion-gold px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border border-devotion-gold/30">Total: {data.quizSets?.length || 0}</span>
                  </div>

                  {(!data.quizSets || data.quizSets.length === 0) ? (
                    <p className="text-gray-500 text-center py-12">No Quiz Sets created yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {data.quizSets.map((quizSet) => (
                        <div key={quizSet._id} className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col relative overflow-hidden">
                          {quizSet.isPublished ? (
                             <span className="absolute top-4 right-4 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-500/30">Published</span>
                          ) : (
                             <span className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-yellow-500/30">Draft</span>
                          )}
                          <h4 className="text-white font-bold text-lg mb-2 w-3/4">{quizSet.title}</h4>
                          <p className="text-xs text-gray-400 mb-3">{quizSet.category} • {quizSet.difficulty} • {quizSet.timeLimit > 0 ? `${quizSet.timeLimit}s timer` : 'No timer'}</p>
                          <p className="text-sm text-gray-300 line-clamp-2 mb-4">{quizSet.description || 'No description'}</p>
                          <div className="text-[10px] text-devotion-gold mb-4 font-black uppercase tracking-widest">
                            {quizSet.questionCount || 0} Questions
                          </div>
                          <div className="mt-auto flex gap-2">
                            <button
                              onClick={async () => {
                                try {
                                   setLoading(true);
                                   const token = localStorage.getItem('token');
                                   const res = await axios.get(`/api/quiz/sets/${quizSet._id}`, { headers: { Authorization: `Bearer ${token}` } });
                                   setQuizSetForm({
                                      title: quizSet.title,
                                      description: quizSet.description || '',
                                      category: quizSet.category || 'General',
                                      difficulty: quizSet.difficulty || 'medium',
                                      timeLimit: quizSet.timeLimit || 0,
                                      thumbnail: quizSet.thumbnail || '',
                                      tags: quizSet.tags?.join(', ') || '',
                                      isPublished: quizSet.isPublished || false,
                                      questions: res.data.questions || []
                                   });
                                   setEditingQuizSetId(quizSet._id);
                                   setShowAddModal(true);
                                } catch(e) {
                                   setMessage({ type: 'error', text: 'Failed to load quiz details' });
                                } finally { setLoading(false); }
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-devotion-gold/30 text-devotion-gold hover:text-white hover:bg-devotion-gold/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteContent('quiz/admin/sets', quizSet._id, quizSet.title)}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            )}
            
            {activeTab === 'notifications' && (
               <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                  <div className="flex justify-between items-center mb-10">
                     <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter">Global <span className="text-devotion-gold">Broadcast</span></h3>
                  </div>
                  
                  <div className="max-w-3xl mx-auto bg-black/20 p-8 rounded-3xl border border-devotion-gold/20">
                     <p className="text-gray-400 mb-8 text-sm">Send an instant notification to all active users. This will appear in their in-app notifications menu and as a native push notification if enabled.</p>
                     
                     <form onSubmit={handleBroadcast} className="space-y-6">
                        <div>
                           <label className="block text-[10px] font-black text-devotion-gold uppercase tracking-[0.2em] mb-2">Notification Title</label>
                           <input 
                             required
                             value={broadcastForm.title}
                             onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})}
                             placeholder="E.g., Special Weekend Gita Class"
                             className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-devotion-gold outline-none transition-all"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-devotion-gold uppercase tracking-[0.2em] mb-2">Message Body</label>
                           <textarea 
                             required
                             rows="4"
                             value={broadcastForm.body}
                             onChange={e => setBroadcastForm({...broadcastForm, body: e.target.value})}
                             placeholder="E.g., Join us this Sunday at 10 AM for a special decoding of Chapter 2..."
                             className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-devotion-gold outline-none transition-all resize-none"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-devotion-gold uppercase tracking-[0.2em] mb-2">Notification Type</label>
                           <div className="flex gap-4">
                              {['system', 'content', 'custom'].map(type => (
                                 <label key={type} className={`flex-1 flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${broadcastForm.type === type ? 'border-devotion-gold bg-devotion-gold/10 text-devotion-gold' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                                    <input 
                                      type="radio" 
                                      name="notifType" 
                                      value={type}
                                      checked={broadcastForm.type === type}
                                      onChange={() => setBroadcastForm({...broadcastForm, type})}
                                      className="hidden"
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                                 </label>
                              ))}
                           </div>
                        </div>
                        
                        <button 
                          type="submit"
                          disabled={!broadcastForm.title || !broadcastForm.body}
                          className="w-full bg-gradient-to-r from-devotion-gold to-[#FFB800] text-devotion-darkBlue py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,215,0,0.2)] hover:shadow-[0_0_50px_rgba(255,215,0,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <AlertCircle className="w-4 h-4" /> Broadcast Notification
                        </button>
                     </form>
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* Universal Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-xl">
           <div className="bg-[#0B1F3A] w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] md:rounded-[3.5rem] border border-devotion-gold/30 p-4 sm:p-10 md:p-20 relative shadow-[0_0_150px_rgba(255,215,0,0.2)]">
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  resetForms();
                }}
                className="absolute top-10 right-10 text-gray-500 hover:text-white p-3 rounded-full hover:bg-white/5 transition-all"
              >
                <X className="w-8 h-8" />
              </button>

              <h2 className="text-5xl font-serif font-black text-white mb-12 text-center uppercase tracking-tighter">
                {(editingStoryId || editingMovieId || editingVideoId) ? 'Edit' : 'Publish'} <span className="text-devotion-gold">{activeTab === 'stories' ? 'Story' : activeTab === 'movies' ? 'Movie' : (activeTab === 'videos' && videosUploadType === 'quiz' ? 'Quiz Question' : currentContentLabel)}</span>
              </h2>

              <form onSubmit={handleAddContent} className="space-y-10">
                 
                 {/* MOVIE FORM */}
                 {activeTab === 'movies' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10 overflow-x-auto">
                      <div className="space-y-4">
                         <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2"><FileText className="w-3 h-3"/> Movie Title</label>
                         <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="e.g. Shri Krishna" value={movieForm.title} onChange={e => setMovieForm({...movieForm, title: e.target.value})} />
                      </div>
                      <div className="space-y-4">
                         <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2"><LinkIcon className="w-3 h-3"/> Direct File Upload (HQ Netflix/Hotstar Range)</label>
                         <div className="flex flex-col gap-3">
                           <input type="file" accept="video/*" onChange={handleVideoFileChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white file:mr-4 file:rounded-xl file:border-0 file:bg-devotion-gold file:px-4 file:py-2 file:text-xs file:font-black file:text-devotion-darkBlue" />
                           {videoUploadProgress > 0 && (
                             <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                               <div className="bg-devotion-gold h-2 rounded-full transition-all" style={{ width: `${videoUploadProgress}%` }}></div>
                             </div>
                           )}
                           <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-white text-xs mt-2 opacity-50" placeholder="Or paste link directly..." value={movieForm.videoUrl} onChange={e => setMovieForm({...movieForm, videoUrl: e.target.value})} />
                         </div>
                      </div>
                      <div className="space-y-4">
                         <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2"><ImageIcon className="w-3 h-3"/> Thumbnail Link</label>
                         <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="https://image..." value={movieForm.thumbnail} onChange={e => setMovieForm({...movieForm, thumbnail: e.target.value})} />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Release Year</label>
                         <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={movieForm.releaseYear} onChange={e => setMovieForm({...movieForm, releaseYear: e.target.value})} />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Initial Views (Promotion)</label>
                         <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="e.g. 5000" value={movieForm.views} onChange={e => setMovieForm({...movieForm, views: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="md:col-span-2 space-y-4">
                          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2"><LinkIcon className="w-3 h-3"/> Trailer / Teaser (Plays in Hero Section)</label>
                          <div className="flex flex-col gap-3">
                             <div className="flex gap-2">
                               <input className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="YouTube or Direct Video URL" value={movieForm.trailerUrl} onChange={e => setMovieForm({...movieForm, trailerUrl: e.target.value})} />
                               <label className="cursor-pointer bg-devotion-gold/10 border border-devotion-gold/30 text-devotion-gold px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-devotion-gold/20 transition-all flex items-center gap-2">
                                  <Upload className="w-4 h-4" /> Upload
                                  <input type="file" accept="video/*" className="hidden" onChange={e => handleVideoFileChange(e, true)} />
                               </label>
                             </div>
                             {trailerUploadProgress > 0 && (
                               <div className="w-full bg-white/10 rounded-full h-2">
                                 <div className="bg-devotion-gold h-2 rounded-full transition-all" style={{ width: `${trailerUploadProgress}%` }}></div>
                               </div>
                             )}
                          </div>
                       </div>
                      <div className="md:col-span-2 flex items-center gap-4 bg-white/5 p-5 rounded-[2rem] border border-white/10 mb-6">
                         <input type="checkbox" id="isComingSoon" className="w-6 h-6 accent-devotion-gold" checked={movieForm.isComingSoon} onChange={e => setMovieForm({...movieForm, isComingSoon: e.target.checked})} />
                         <label htmlFor="isComingSoon" className="text-sm font-black uppercase tracking-widest text-white cursor-pointer">Mark as "Coming Soon" (Upcoming Movie)</label>
                      </div>
                      <div className="md:col-span-2 space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Owner's Selection Insight</label>
                         <textarea rows="3" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="Why this movie?" value={movieForm.ownerHistory} onChange={e => setMovieForm({...movieForm, ownerHistory: e.target.value})} />
                      </div>
                   </div>
                 )}

                 {/* STORY FORM */}
                 {activeTab === 'stories' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10 overflow-x-auto">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Story Title</label>
                         <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.title} onChange={e => setStoryForm({...storyForm, title: e.target.value})} />
                      </div>
                     <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Title Telugu</label>
                       <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.titleTelugu} onChange={e => setStoryForm({...storyForm, titleTelugu: e.target.value})} />
                     </div>
                     <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Title Hindi</label>
                       <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.titleHindi} onChange={e => setStoryForm({...storyForm, titleHindi: e.target.value})} />
                     </div>
                     <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Title English</label>
                       <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.titleEnglish} onChange={e => setStoryForm({...storyForm, titleEnglish: e.target.value})} />
                     </div>
                       <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Collection Title</label>
                         <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="Bhagavad Gita or Ramayana" value={storyForm.seriesTitle} onChange={e => setStoryForm({...storyForm, seriesTitle: e.target.value})} />
                       </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Chapter Number</label>
                         <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.chapter} onChange={e => setStoryForm({...storyForm, chapter: e.target.value})} />
                      </div>
                      <div className="md:col-span-2 space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Primary Language</label>
                         <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.language} onChange={e => setStoryForm({...storyForm, language: e.target.value})}>
                          <option value="telugu" className="bg-[#0B1F3A]">Telugu</option>
                          <option value="hindi" className="bg-[#0B1F3A]">Hindi</option>
                          <option value="english" className="bg-[#0B1F3A]">English</option>
                         </select>
                       </div>
                       <div className="md:col-span-2 space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Summary</label>
                         <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.summary} onChange={e => setStoryForm({...storyForm, summary: e.target.value})} />
                      </div>
                      <div className="md:col-span-2 space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Full Content</label>
                         <textarea rows="6" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.content} onChange={e => setStoryForm({...storyForm, content: e.target.value})} />
                      </div>
                       <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Summary Telugu</label>
                         <textarea rows="3" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.summaryTelugu} onChange={e => setStoryForm({...storyForm, summaryTelugu: e.target.value})} />
                       </div>
                       <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Summary Hindi</label>
                         <textarea rows="3" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.summaryHindi} onChange={e => setStoryForm({...storyForm, summaryHindi: e.target.value})} />
                       </div>
                       <div className="md:col-span-2 space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Summary English</label>
                         <textarea rows="3" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.summaryEnglish} onChange={e => setStoryForm({...storyForm, summaryEnglish: e.target.value})} />
                       </div>
                       <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Content Telugu</label>
                         <textarea rows="4" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.contentTelugu} onChange={e => setStoryForm({...storyForm, contentTelugu: e.target.value})} />
                       </div>
                       <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Content Hindi</label>
                         <textarea rows="4" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.contentHindi} onChange={e => setStoryForm({...storyForm, contentHindi: e.target.value})} />
                       </div>
                       <div className="md:col-span-2 space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Content English</label>
                         <textarea rows="4" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.contentEnglish} onChange={e => setStoryForm({...storyForm, contentEnglish: e.target.value})} />
                       </div>
                   </div>
                 )}

                 {/* QUIZ SET FORM */}
                 {activeTab === 'quizzes' && (
                   <div className="grid grid-cols-1 gap-10 overflow-x-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Quiz Title</label>
                           <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizSetForm.title} onChange={e => setQuizSetForm({...quizSetForm, title: e.target.value})} />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Category</label>
                           <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizSetForm.category} onChange={e => setQuizSetForm({...quizSetForm, category: e.target.value})} />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Difficulty</label>
                           <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizSetForm.difficulty} onChange={e => setQuizSetForm({...quizSetForm, difficulty: e.target.value})}>
                             <option value="easy" className="bg-[#0B1F3A]">Easy</option>
                             <option value="medium" className="bg-[#0B1F3A]">Medium</option>
                             <option value="hard" className="bg-[#0B1F3A]">Hard</option>
                           </select>
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Time Limit (seconds, 0 for no limit)</label>
                           <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizSetForm.timeLimit} onChange={e => setQuizSetForm({...quizSetForm, timeLimit: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Thumbnail URL</label>
                           <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizSetForm.thumbnail} onChange={e => setQuizSetForm({...quizSetForm, thumbnail: e.target.value})} />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Tags (comma separated)</label>
                           <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizSetForm.tags} onChange={e => setQuizSetForm({...quizSetForm, tags: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Description</label>
                           <textarea rows="3" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizSetForm.description} onChange={e => setQuizSetForm({...quizSetForm, description: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                           <input type="checkbox" id="isPublished" className="w-5 h-5 accent-devotion-gold" checked={quizSetForm.isPublished} onChange={e => setQuizSetForm({...quizSetForm, isPublished: e.target.checked})} />
                           <label htmlFor="isPublished" className="text-white font-bold">Publish Quiz Set</label>
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-8">
                         <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-bold text-white uppercase tracking-widest">Questions ({quizSetForm.questions.length})</h4>
                            <button type="button" onClick={() => {
                               const newQuestion = { questionText: '', options: [{answerText: ''}, {answerText: ''}, {answerText: ''}, {answerText: ''}], correct_answer: '', explanation: '' };
                               setQuizSetForm({...quizSetForm, questions: [...quizSetForm.questions, newQuestion]});
                            }} className="bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/20">
                               + Add Question
                            </button>
                         </div>
                         <div className="space-y-6">
                           {quizSetForm.questions.map((q, idx) => (
                              <div key={idx} className="bg-black/30 p-6 rounded-2xl border border-white/5 relative">
                                 <button type="button" onClick={() => {
                                    const updated = [...quizSetForm.questions];
                                    updated.splice(idx, 1);
                                    setQuizSetForm({...quizSetForm, questions: updated});
                                 }} className="absolute top-4 right-4 p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                                 <div className="space-y-4 mt-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold">Question {idx + 1}</label>
                                    <input placeholder="Enter question..." required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-devotion-gold outline-none" value={q.questionText || q.question || ''} onChange={e => {
                                       const updated = [...quizSetForm.questions];
                                       updated[idx].questionText = e.target.value;
                                       updated[idx].question = e.target.value;
                                       setQuizSetForm({...quizSetForm, questions: updated});
                                    }} />
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                       {q.options.map((opt, oIdx) => {
                                          const optText = typeof opt === 'string' ? opt : opt.answerText;
                                          return (
                                          <div key={oIdx} className="flex items-center gap-3">
                                             <input type="radio" name={`correct_${idx}`} checked={q.correct_answer === optText && optText !== ''} onChange={() => {
                                                const updated = [...quizSetForm.questions];
                                                updated[idx].correct_answer = optText;
                                                setQuizSetForm({...quizSetForm, questions: updated});
                                             }} className="w-5 h-5 accent-devotion-gold" />
                                             <input placeholder={`Option ${oIdx + 1}`} required className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-devotion-gold outline-none" value={optText} onChange={e => {
                                                const updated = [...quizSetForm.questions];
                                                if (typeof updated[idx].options[oIdx] === 'string') {
                                                   updated[idx].options[oIdx] = e.target.value;
                                                } else {
                                                   updated[idx].options[oIdx].answerText = e.target.value;
                                                }
                                                if (q.correct_answer === optText) updated[idx].correct_answer = e.target.value;
                                                setQuizSetForm({...quizSetForm, questions: updated});
                                             }} />
                                          </div>
                                       )})}
                                    </div>
                                    <input placeholder="Explanation (Optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-devotion-gold outline-none mt-2" value={q.explanation || ''} onChange={e => {
                                       const updated = [...quizSetForm.questions];
                                       updated[idx].explanation = e.target.value;
                                       setQuizSetForm({...quizSetForm, questions: updated});
                                    }} />
                                 </div>
                              </div>
                           ))}
                         </div>
                      </div>
                   </div>
                 )}

                 {/* VIDEO FORM */}
                 {activeTab === 'videos' && videosUploadType === 'video' && (
                   <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10 overflow-x-auto">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Video Title</label>
                         <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">High Quality File Upload</label>
                         <div className="flex flex-col gap-3">
                           <input type="file" accept="video/*" onChange={handleVideoFileChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white file:mr-4 file:rounded-xl file:border-0 file:bg-devotion-gold file:px-4 file:py-2 file:text-xs file:font-black file:text-devotion-darkBlue" />
                           {videoUploadProgress > 0 && (
                             <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                               <div className="bg-devotion-gold h-2 rounded-full transition-all" style={{ width: `${videoUploadProgress}%` }}></div>
                             </div>
                           )}
                           <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-white text-xs mt-2 opacity-50" placeholder="Or paste link directly..." value={videoForm.videoUrl} onChange={e => setVideoForm({...videoForm, videoUrl: e.target.value})} />
                         </div>
                         {videoForm.videoUrl && (
                           <div className="mt-3 rounded-xl overflow-hidden border border-devotion-gold/30 aspect-video bg-black">
                             <MediaPlayerHLS
                               url={videoForm.videoUrl}
                               hlsUrl={videoForm.hlsUrl}
                               title={videoForm.title}
                               className="w-full h-full object-cover"
                               youtubeParams="autoplay=0&rel=0&modestbranding=1"
                               controls
                             />
                           </div>
                         )}
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Description</label>
                         <textarea rows="3" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="What's this video about?" value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Category</label>
                         <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={videoForm.category} onChange={e => {
                           const selectedCategory = e.target.value;
                           setVideoForm((prev) => ({
                             ...prev,
                             category: selectedCategory,
                             isKids: selectedCategory === 'animated' ? true : false,
                           }));
                         }}>
                            <option value="reels" className="bg-[#0B1F3A]">Wisdom Reel</option>
                           <option value="animated" className="bg-[#0B1F3A]">Kids Animated</option>
                            <option value="lectures" className="bg-[#0B1F3A]">Full Lecture</option>
                            <option value="bhajans" className="bg-[#0B1F3A]">Bhajans</option>
                         </select>
                      </div>
                       <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Collection Title</label>
                         <select
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none"
                           value={VIDEO_COLLECTION_PRESETS.includes(videoForm.collectionTitle) ? videoForm.collectionTitle : 'custom'}
                           onChange={e => {
                             if (e.target.value === 'custom') {
                               setVideoForm((prev) => ({ ...prev, collectionTitle: '' }));
                             } else {
                               setVideoForm((prev) => ({ ...prev, collectionTitle: e.target.value }));
                             }
                           }}
                         >
                           {VIDEO_COLLECTION_PRESETS.map((item) => (
                             <option key={item} value={item} className="bg-[#0B1F3A]">{item}</option>
                           ))}
                           <option value="custom" className="bg-[#0B1F3A]">Custom</option>
                         </select>
                         {!VIDEO_COLLECTION_PRESETS.includes(videoForm.collectionTitle) && (
                           <input
                             required
                             className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none"
                             placeholder="Type custom collection name"
                             value={videoForm.collectionTitle}
                             onChange={e => setVideoForm({...videoForm, collectionTitle: e.target.value})}
                           />
                         )}
                       </div>
                       <div className="flex items-center gap-4 pt-10">
                          <div className="flex-1 space-y-4">
                             <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Initial Views (Promotion)</label>
                             <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="e.g. 5000" value={videoForm.views} onChange={e => setVideoForm({...videoForm, views: parseInt(e.target.value) || 0})} />
                          </div>
                          <div className="flex items-center gap-4">
                             <input type="checkbox" className="w-6 h-6 rounded bg-white/5 border-white/10 text-devotion-gold" checked={videoForm.isKids} onChange={e => setVideoForm({...videoForm, isKids: e.target.checked})} />
                             <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold">Show in Kids Mode?</label>
                          </div>
                       </div>
                    </div>
                   {/* Embedded Quiz Linker for Video */}
                   <div className="mt-10 bg-[#0B1F3A] rounded-2xl p-6 border border-devotion-gold/30">
                     <h3 className="text-lg font-black text-devotion-gold mb-2">Link a Quiz Set (Optional)</h3>
                     <p className="text-sm text-white/70 mb-4">Select a quiz set to automatically trigger after this video ends (specifically for Kids Mode).</p>
                     <select 
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none"
                       value={videoForm.quizSetId || ''} 
                       onChange={e => setVideoForm({...videoForm, quizSetId: e.target.value})}
                     >
                        <option value="" className="bg-[#0B1F3A]">-- No Quiz Linked --</option>
                        {data.quizSets && data.quizSets.map(quiz => (
                          <option key={quiz._id} value={quiz._id} className="bg-[#0B1F3A]">{quiz.title} ({quiz.questionCount} questions)</option>
                        ))}
                     </select>
                   </div>
                   </>
                 )}

                  {/* QUIZ FORM */}
                  {activeTab === 'videos' && videosUploadType === 'quiz' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10 overflow-x-auto">
                     <div className="md:col-span-2 space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Question</label>
                       <textarea required rows="3" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizForm.questionText} onChange={e => setQuizForm({...quizForm, questionText: e.target.value})} />
                     </div>
                     <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Category</label>
                       <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizForm.category} onChange={e => setQuizForm({...quizForm, category: e.target.value})} />
                     </div>
                     <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Optional Video URL</label>
                       <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizForm.videoUrl} onChange={e => setQuizForm({...quizForm, videoUrl: e.target.value})} />
                     </div>
                     <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Option A</label>
                       <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizForm.optionA} onChange={e => setQuizForm({...quizForm, optionA: e.target.value})} />
                     </div>
                     <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Option B</label>
                       <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizForm.optionB} onChange={e => setQuizForm({...quizForm, optionB: e.target.value})} />
                     </div>
                     <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Option C</label>
                       <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizForm.optionC} onChange={e => setQuizForm({...quizForm, optionC: e.target.value})} />
                     </div>
                     <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Option D</label>
                       <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizForm.optionD} onChange={e => setQuizForm({...quizForm, optionD: e.target.value})} />
                     </div>
                     <div className="md:col-span-2 space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Correct Option</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={quizForm.correctOption} onChange={e => setQuizForm({...quizForm, correctOption: e.target.value})}>
                        <option value="A" className="bg-[#0B1F3A]">Option A</option>
                        <option value="B" className="bg-[#0B1F3A]">Option B</option>
                        <option value="C" className="bg-[#0B1F3A]">Option C</option>
                        <option value="D" className="bg-[#0B1F3A]">Option D</option>
                      </select>
                     </div>
                   </div>
                  )}

                 {['movies', 'stories'].includes(activeTab) || (activeTab === 'videos' && videosUploadType === 'video') ? (
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Tags (comma separated)</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="Motivation, Karma, Peace" 
                      value={activeTab === 'movies' ? movieForm.tags : (activeTab === 'stories' ? storyForm.tags : videoForm.tags)} 
                      onChange={e => {
                        if (activeTab === 'movies') setMovieForm({...movieForm, tags: e.target.value});
                        else if (activeTab === 'stories') setStoryForm({...storyForm, tags: e.target.value});
                        else if (activeTab === 'videos') setVideoForm({...videoForm, tags: e.target.value});
                      }} 
                    />
                 </div>
                 ) : null}

                 <button 
                   type="submit"
                   disabled={loading}
                   className="w-full bg-devotion-gold text-devotion-darkBlue py-8 rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-4 group"
                 >
                    {loading ? <div className="w-6 h-6 border-2 border-devotion-darkBlue border-t-transparent rounded-full animate-spin"></div> : (
                      <>
                        <Upload className="w-6 h-6 group-hover:scale-125 transition-transform" />
                        {(editingStoryId || editingMovieId || editingVideoId) ? `UPDATE ${activeTab === 'stories' ? 'STORY' : activeTab === 'movies' ? 'MOVIE' : 'VIDEO'}` : (activeTab === 'videos' && videosUploadType === 'quiz' ? 'PUBLISH QUIZ QUESTION' : 'PUBLISH TO DIVINE LIBRARY')}
                      </>
                    )}
                 </button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ErrorBoundary>
      <AdminDashboardContent />
    </ErrorBoundary>
  );
}
