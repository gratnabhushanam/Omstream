import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import axios from 'axios';
import { Database, Upload, Users, BookOpen, Video, LogOut, Settings, Film, Plus, X, Check, AlertCircle, Image as ImageIcon, Link as LinkIcon, FileText, Flame, Trash2, Pencil, Menu, Eye, Sparkles, RefreshCw, Cpu, Bell, BarChart3, Layers, Zap, Folder, FolderPlus, ArrowLeft, GripVertical, Music } from 'lucide-react';
import { resumableUpload } from '../utils/resumableUpload';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import MediaPlayerHLS from '../components/MediaPlayerHLS';
import JobTracker from '../components/JobTracker';

const VIDEO_COLLECTION_PRESETS = ['Bhagavad Gita', 'Ramayanam', 'Mahabharat', 'Puranas'];
const STORY_CATEGORIES = [
  'Bhagavad Gita', 'Ramayana', 'Mahabharata', 'Shiva Puranas', 'Vishnu Puranas', 
  'Garuda Purana', 'Hanuman Stories', 'Krishna Stories', 'Indian Folklore', 
  'Panchatantra Stories', 'Tenali Raman Stories', 'Akbar Birbal Stories', 
  'Ancient Indian History', 'Freedom Fighter Stories', 'Spiritual Stories', 
  'Motivational Stories', 'Kids Mythological Stories', 'Animated Educational Chapters', 
  'Temple Histories', 'Devotional Stories', 'Moral Stories', 'Indian Culture & Traditions', 
  'Regional Indian Stories', 'Festival Stories', 'Saints & Guru Stories', 
  'Yoga & Meditation Lessons', 'Ancient Science Stories', 'Ayurveda Knowledge', 
  'Historical Kingdom Stories', 'Indian Warrior Stories', 'Epic Battles & Legends'
];

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'sa', name: 'Sanskrit (संस्कृतम्)' },
  { code: 'ur', name: 'Urdu (اردو)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'pt', name: 'Portuguese (Português)' },
];

function LanguageSelector({ value, onChange }) {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Original Language</label>
      <select 
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" 
        value={value || 'en'} 
        onChange={e => onChange(e.target.value)}
      >
        {SUPPORTED_LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code} className="bg-[#0B1F3A]">{lang.name}</option>
        ))}
      </select>
    </div>
  );
}

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
  const [data, setData] = useState({ users: [], stats: null, movies: [], stories: [], videos: [], quizQuestions: [], quizSets: [], aiJobs: [], songs: [] });
  const [translationJobs, setTranslationJobs] = useState([]);
  const [pendingUserReels, setPendingUserReels] = useState([]);
  const [pendingContentFilter, setPendingContentFilter] = useState('all');
  const [videoCollectionFilter, setVideoCollectionFilter] = useState('all');
  const [storyLanguageFilter, setStoryLanguageFilter] = useState('all');
  const [quickFillStoryId, setQuickFillStoryId] = useState(null);
  const [moderationNotes, setModerationNotes] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [movieForm, setMovieForm] = useState({ title: '', description: '', videoUrl: '', hlsUrl: '', trailerUrl: '', thumbnail: '', releaseYear: 2025, ownerHistory: '', tags: '', views: 0, isComingSoon: false, isKids: false, genre: 'Divine', duration: 0 });
  const [storyForm, setStoryForm] = useState({
    title: '',
    description: '',
    content: '',
    category: 'Bhagavad Gita',
    status: 'published',
    thumbnail: '',
    tags: '',
    isKids: false,
    chapters: [],
    translations: {},
    selectedLang: 'en',
    parentFolderId: '',
    rootTitle: '',
    rootDescription: '',
    rootContent: '',
    rootChapters: []
  });
  const [selectedStoryForChapters, setSelectedStoryForChapters] = useState(null);
  const [chapterEditIndex, setChapterEditIndex] = useState(-1);
  const [chapterEditForm, setChapterEditForm] = useState({ title: '', content: '', summary: '', takeaways: '', sequence: 1 });
  const [newChapterForm, setNewChapterForm] = useState({ title: '', summary: '', takeaways: '', content: '' });
  const [newChapterTargetFolderId, setNewChapterTargetFolderId] = useState('');
  const [showMultiUpload, setShowMultiUpload] = useState(false);
  const [multiChaptersText, setMultiChaptersText] = useState('');
  const [selectedTargetStoryId, setSelectedTargetStoryId] = useState('');
  const [songForm, setSongForm] = useState({ title: '', artist: '', url: '', cover: '', duration: '' });
  const [videoForm, setVideoForm] = useState({ title: '', description: '', videoUrl: '', trailerUrl: '', category: 'reels', collectionTitle: 'Bhagavad Gita', isKids: false, isComingSoon: false, tags: '', quizSetId: '', views: 0 });
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
  const [draggedChapterIndex, setDraggedChapterIndex] = useState(null);

  const handleDragStart = (e, idx) => {
    setDraggedChapterIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedChapterIndex === null || draggedChapterIndex === targetIdx) {
      setDraggedChapterIndex(null);
      return;
    }
    if (!selectedStoryForChapters) return;

    const chapters = [...(selectedStoryForChapters.chapters || [])];
    const [moved] = chapters.splice(draggedChapterIndex, 1);
    chapters.splice(targetIdx, 0, moved);
    // Re-assign sequence numbers
    const resequenced = chapters.map((ch, i) => ({ ...ch, sequence: i + 1 }));

    setDraggedChapterIndex(null);
    handleSaveStoryChapters(selectedStoryForChapters._id || selectedStoryForChapters.id, resequenced);
  };


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
    stories: 'Folder / Story',
    videos: 'Video',
  };

  const currentContentLabel = contentLabels[activeTab] || 'Content';
  // eslint-disable-next-line no-unused-vars
  const publishLabel = contentLabels[activeTab] || 'Content';
  const collectionSet = new Set((data.videos || []).map((item) => String(item.collectionTitle || 'Bhagavad Gita').trim()).filter(Boolean));
  const prioritizedCollections = VIDEO_COLLECTION_PRESETS.filter((item) => collectionSet.has(item));
  const customCollections = Array.from(collectionSet)
    .filter((item) => !VIDEO_COLLECTION_PRESETS.includes(item))
    .sort((a, b) => a.localeCompare(b));
  const videoCollectionOptions = ['all', ...prioritizedCollections, ...customCollections];
  const filteredAdminVideos = videoCollectionFilter === 'all'
    ? (data.videos || [])
    : (data.videos || []).filter((item) => String(item.collectionTitle || 'Bhagavad Gita').trim() === videoCollectionFilter);
  
  const fetchAdminData = React.useCallback(async () => {
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
        const { data: stories } = await axios.get('/api/stories?all=true&_t=' + Date.now(), { headers });
        setData(prev => ({ ...prev, stories: Array.isArray(stories) ? stories : [] }));
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
      } else if (activeTab === 'ai-jobs') {
        const { data: jobs } = await axios.get('/api/ai/jobs', { headers });
        setData(prev => ({ ...prev, aiJobs: Array.isArray(jobs) ? jobs : [] }));
      } else if (activeTab === 'translations') {
        const { data: jobs } = await axios.get('/api/ai/jobs', { headers });
        const tJobs = Array.isArray(jobs) ? jobs.filter(j => j.type === 'translation' || j.type === 'all') : [];
        setTranslationJobs(tJobs);
      } else if (activeTab === 'songs') {
        const { data: songs } = await axios.get('/api/songs', { headers });
        setData(prev => ({ ...prev, songs: Array.isArray(songs) ? songs : [] }));
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
  }, [activeTab, navigate, pendingContentFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      console.warn('Unauthorized access to admin dashboard');
      navigate('/');
    } else if (user?.role === 'admin') {
      fetchAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, activeTab, pendingContentFilter, navigate]);

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
       // no confirm needed, user already clicked Save
    }

    setLoading(true);
    let endpoint = '';
    let payload = {};
    const publishLabel = activeTab === 'videos' && videosUploadType === 'quiz' ? 'Quiz Question' : currentContentLabel;

    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'movies') {
        endpoint = editingMovieId ? `/api/movies/${editingMovieId}` : '/api/movies';
        payload = { ...movieForm, tags: (typeof movieForm.tags === 'string' ? movieForm.tags : '').split(',').map(tag => tag.trim()).filter(Boolean) };
      } else if (activeTab === 'stories') {
        endpoint = editingStoryId ? `/api/stories/${editingStoryId}` : '/api/stories';
        
        // Merge current form fields into the translations map for the selectedLang
        const updatedTranslations = { ...(storyForm.translations || {}) };
        if (storyForm.selectedLang !== 'en') {
          updatedTranslations[storyForm.selectedLang] = {
            title: storyForm.title,
            description: storyForm.description,
            content: storyForm.content,
            chapters: storyForm.chapters
          };
        }

        payload = {
          ...storyForm,
          tags: (storyForm.tags || '').split(',').map(tag => tag.trim()).filter(Boolean),
          translations: updatedTranslations
        };

        // If we are saving the 'en' version, also update root fields
        if (storyForm.selectedLang === 'en') {
          payload.title = storyForm.title;
          payload.description = storyForm.description;
          payload.content = storyForm.content;
          payload.chapters = storyForm.chapters;
        } else {
          // Keep root fields unchanged if editing a translation
          const originalStory = data.stories.find(s => String(s._id || s.id) === String(editingStoryId));
          if (originalStory) {
             payload.title = originalStory.title;
             payload.description = originalStory.description;
             payload.content = originalStory.content;
             payload.chapters = originalStory.chapters;
          } else {
             // For new stories being created in non-english
             payload.title = storyForm.rootTitle || storyForm.title;
             payload.description = storyForm.rootDescription || storyForm.description;
             payload.content = storyForm.rootContent || storyForm.content;
             payload.chapters = storyForm.rootChapters || storyForm.chapters;
          }
        }
      } else if (activeTab === 'songs') {
        endpoint = '/api/songs';
        payload = songForm;
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
            tags: (typeof videoForm.tags === 'string' ? videoForm.tags : '').split(',').map(tag => tag.trim()).filter(Boolean),
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
      } else if (activeTab === 'songs') {
        const { data: newlyCreated } = await axios.post(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });
        setData(prev => ({ ...prev, songs: [newlyCreated, ...prev.songs] }));
        await fetchAdminData();
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
        
        const newlyCreatedId = newlyCreated?._id || newlyCreated?.id || newlyCreated?.videoId;
        if (newlyCreatedId && !editingStoryId && !editingMovieId && !editingVideoId) {
           // Auto-trigger AI Globalization for new content
           handleAIProcess(newlyCreatedId, activeTab === 'stories' ? 'Story' : activeTab === 'movies' ? 'Movie' : 'Video', 'all');
        }

        if (activeTab === 'stories') {
           setData(prev => ({ ...prev, stories: [newlyCreated, ...prev.stories] }));
        } else if (activeTab === 'movies') {
           setData(prev => ({ ...prev, movies: [newlyCreated, ...prev.movies] }));
        } else if (activeTab === 'videos' && videosUploadType === 'video') {
           await fetchAdminData();
        }
      }

      setMessage({ type: 'success', text: (editingStoryId || editingMovieId || editingVideoId) ? 'Updated successfully!' : `${publishLabel} published successfully! AI processing started.` });
      setShowAddModal(false);
      resetForms();
      setVideoQuizList([]);
      
      if (activeTab === 'videos' || activeTab === 'quiz' || activeTab === 'reels' || activeTab === 'users' || activeTab === 'dashboard' || activeTab === 'stories') {
         await fetchAdminData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to publish content' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleAIProcess = async (contentId, contentType, processType = 'all') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/ai/process', {
        contentId,
        contentType,
        type: processType,
        languages: [
          'en', 'hi', 'te', 'ta', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa', 'sa', 'ur', 'es', 'fr', 'de', 'ja', 'ko', 'ar', 'zh', 'ru', 'pt'
        ]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: response.data.message });
      await fetchAdminData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to start AI processing' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleSaveStoryChapters = async (storyId, updatedChapters) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.patch(`/api/stories/${storyId}`, { chapters: updatedChapters }, { headers });
      
      setData(prev => ({
        ...prev,
        stories: prev.stories.map(st => (String(st._id || st.id) === String(storyId)) ? response.data : st)
      }));
      
      if (selectedStoryForChapters && String(selectedStoryForChapters._id || selectedStoryForChapters.id) === String(storyId)) {
        setSelectedStoryForChapters(response.data);
      }
      
      setMessage({ type: 'success', text: 'Chapters saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleMoveChapter = async (fromStoryId, chapterIndex, toStoryId) => {
    if (!toStoryId) return;
    const fromStory = data.stories.find(s => String(s._id || s.id) === String(fromStoryId));
    const toStory = data.stories.find(s => String(s._id || s.id) === String(toStoryId));
    if (!fromStory || !toStory) return;

    const chapterToMove = { 
      ...fromStory.chapters[chapterIndex],
      folderId: toStory._id || toStory.id,
      parentFolder: toStory.title
    };
    
    const hasDuplicate = toStory.chapters?.some(c => (c.title || '').toLowerCase() === (chapterToMove.title || '').toLowerCase());
    if (hasDuplicate) {
      alert(`A chapter with the title "${chapterToMove.title}" already exists in the folder "${toStory.title}".`);
      return;
    }

    const updatedFromChapters = [...fromStory.chapters];
    updatedFromChapters.splice(chapterIndex, 1);
    
    const updatedToChapters = [...(toStory.chapters || []), chapterToMove];

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.patch(`/api/stories/${fromStoryId}`, { chapters: updatedFromChapters }, { headers });
      const resTo = await axios.patch(`/api/stories/${toStoryId}`, { chapters: updatedToChapters }, { headers });

      setData(prev => ({
        ...prev,
        stories: prev.stories.map(st => {
          if (String(st._id || st.id) === String(fromStoryId)) {
            return { ...st, chapters: updatedFromChapters };
          }
          if (String(st._id || st.id) === String(toStoryId)) {
            return resTo.data;
          }
          return st;
        })
      }));

      if (selectedStoryForChapters) {
        const updatedSelected = String(selectedStoryForChapters._id || selectedStoryForChapters.id) === String(fromStoryId)
          ? { ...selectedStoryForChapters, chapters: updatedFromChapters }
          : selectedStoryForChapters;
        setSelectedStoryForChapters(updatedSelected);
      }

      setMessage({ type: 'success', text: `Successfully moved chapter to "${toStory.title}"!` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleImportMultipleChapters = (storyId, text) => {
    let parsedChapters = [];
    try {
      const trimmedText = text.trim();
      if (trimmedText.startsWith('[')) {
        parsedChapters = JSON.parse(trimmedText);
      } else {
        const sections = trimmedText.split(/===|CHAPTER/i).filter(Boolean);
        parsedChapters = sections.map((sec, idx) => {
          const lines = sec.split('\n').filter(l => l.trim());
          const title = lines[0] || `Chapter ${idx + 1}`;
          const content = lines.slice(1).join('\n');
          return { title: title.trim(), content: content.trim(), summary: '', takeaways: [], sequence: idx + 1 };
        });
      }
    } catch (err) {
      alert('Failed to parse chapters. Please ensure valid JSON format or split with ===.');
      return;
    }

    if (parsedChapters.length === 0) return;

    const story = data.stories.find(s => String(s._id || s.id) === String(storyId));
    if (!story) return;

    const existingChapters = story.chapters || [];
    const newChapters = [];
    const duplicates = [];

    parsedChapters.forEach(ch => {
      const title = ch.title || `Chapter ${existingChapters.length + newChapters.length + 1}`;
      const hasDuplicate = existingChapters.some(c => c.title.toLowerCase() === title.toLowerCase()) || newChapters.some(c => c.title.toLowerCase() === title.toLowerCase());
      if (hasDuplicate) {
        duplicates.push(title);
      } else {
        newChapters.push({
          title,
          content: ch.content || '',
          summary: ch.summary || '',
          takeaways: Array.isArray(ch.takeaways) ? ch.takeaways : (ch.takeaways ? [ch.takeaways] : []),
          sequence: ch.sequence || (existingChapters.length + newChapters.length + 1),
          folderId: story._id || story.id,
          parentFolder: story.title
        });
      }
    });

    if (duplicates.length > 0) {
      alert(`The following duplicate chapters were skipped: ${duplicates.join(', ')}`);
    }

    if (newChapters.length === 0) return;

    const updatedChapters = [...existingChapters, ...newChapters];
    handleSaveStoryChapters(storyId, updatedChapters);
    setMultiChaptersText('');
    setShowMultiUpload(false);
  };

  const handlePublishStory = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(`/api/stories/${id}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Story published successfully!' });
      await fetchAdminData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to publish story' });
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
    setSongForm({ title: '', artist: '', url: '', cover: '', duration: '' });
    setMovieForm({ title: '', description: '', videoUrl: '', hlsUrl: '', trailerUrl: '', thumbnail: '', releaseYear: 2025, ownerHistory: '', tags: '', views: 0, isComingSoon: false, isKids: false, genre: 'Divine', duration: 0, originalLanguage: 'en' });
    setStoryForm({
      title: '',
      description: '',
      content: '',
      category: 'Bhagavad Gita',
      status: 'published',
      thumbnail: '',
      tags: '',
      isKids: false,
      chapters: [],
      translations: {},
      selectedLang: 'en',
      language: 'en',
      parentFolderId: '',
      rootTitle: '',
      rootDescription: '',
      rootContent: '',
      rootChapters: []
    });
    setVideoForm({ title: '', description: '', videoUrl: '', trailerUrl: '', category: 'reels', collectionTitle: 'Bhagavad Gita', isKids: false, isComingSoon: false, tags: '', quizSetId: '', views: 0, language: 'en' });
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
      description: story.description || story.summary || '',
      content: story.content || '',
      category: story.category || story.seriesTitle || 'Bhagavad Gita',
      status: story.status || 'published',
      thumbnail: story.thumbnail || '',
      tags: Array.isArray(story.tags) ? story.tags.join(', ') : (story.tags || ''),
      isKids: story.isKids || false,
      chapters: story.chapters || [],
      translations: story.translations || {},
      selectedLang: 'en',
      parentFolderId: story.parentFolderId || '',
      rootTitle: story.title || '',
      rootDescription: story.description || story.summary || '',
      rootContent: story.content || '',
      rootChapters: story.chapters || []
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
      hlsUrl: movie.hlsUrl || '',
      thumbnail: movie.thumbnail || '',
      releaseYear: movie.releaseYear || 2025,
      ownerHistory: movie.ownerHistory || '',
      tags: Array.isArray(movie.tags) ? movie.tags.join(', ') : (movie.tags || ''),
      views: movie.views || 0,
      isComingSoon: movie.isComingSoon || false,
      isKids: movie.isKids || false,
      genre: movie.genre || 'Divine',
      duration: movie.duration || 0,
      originalLanguage: movie.originalLanguage || 'en',
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
      isComingSoon: video.isComingSoon || false,
      trailerUrl: video.trailerUrl || '',
      tags: Array.isArray(video.tags) ? video.tags.join(', ') : (video.tags || ''),
      views: video.views || 0,
      language: video.language || 'en',
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
    <div className="min-h-screen md:h-screen bg-[#06101E] text-white flex flex-col md:flex-row md:overflow-hidden">
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
      <div className="w-72 flex-shrink-0 bg-devotion-darkBlue/80 backdrop-blur-2xl border-r border-white/5 hidden md:flex flex-col shadow-2xl h-full">
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
            { id: 'ai-jobs', name: 'AI Jobs', icon: <Cpu className="w-5 h-5 text-blue-400" /> },
            { id: 'notifications', name: 'Notifications', icon: <AlertCircle className="w-5 h-5 text-purple-400" /> },
            { id: 'translations', name: 'Translations', icon: <Sparkles className="w-5 h-5 text-devotion-gold" /> },
            { id: 'songs', name: 'Songs', icon: <Music className="w-5 h-5 text-pink-400" /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === item.id ? 'bg-devotion-gold text-devotion-darkBlue shadow-2xl neon-gold-glow' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
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
                { id: 'ai-jobs', name: 'AI Jobs', icon: <Cpu className="w-4 h-4 text-blue-400" /> },
                { id: 'notifications', name: 'Notifications', icon: <AlertCircle className="w-4 h-4 text-purple-400" /> },
                { id: 'translations', name: 'Translations', icon: <Sparkles className="w-4 h-4 text-devotion-gold" /> },
                { id: 'songs', name: 'Songs', icon: <Music className="w-4 h-4 text-pink-400" /> },
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
      <div className="flex-1 flex flex-col pt-20 md:pt-10 sm:pt-24 tv:pt-20 px-4 md:px-10 tv:px-20 pb-10 overflow-y-auto h-full">
         
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
            
            {['movies', 'stories', 'videos', 'quizzes', 'songs'].includes(activeTab) && (
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
                <Plus className="w-5 h-5" /> Add New {activeTab === 'videos' ? 'Video' : activeTab === 'quizzes' ? 'Quiz Set' : activeTab === 'songs' ? 'Song' : currentContentLabel}
              </button>
            )}
         </div>

          <div className="grid grid-cols-1 gap-6">
            {activeTab === 'dashboard' && !data.stats && (
               <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="w-16 h-16 border-4 border-devotion-gold/20 border-t-devotion-gold rounded-full animate-spin"></div>
                  <p className="text-devotion-gold/60 font-serif italic animate-pulse">Syncing spiritual analytics...</p>
               </div>
            )}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
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

                    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                       <JobTracker />
                    </div>
                  </>
                )}
              </div>

              {data.stats && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10 mb-10">
                   {/* Subscription & Trial */}
                   <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                      <h3 className="text-xl font-serif font-black text-white mb-6 uppercase tracking-widest text-center">Subscription & Trial Mix</h3>
                      <div className="h-[300px] w-full flex items-center justify-center">
                         <ResponsiveContainer width="99%" height="100%">
                           <PieChart>
                             <Pie
                               data={[
                                 { name: 'Active Trials', value: data.stats.activeTrials || 0 },
                                 { name: 'Expired Trials', value: data.stats.expiredTrials || 0 },
                                 { name: 'Active Subscribers', value: data.stats.activeSubscribers || 0 },
                                 { name: 'Free Users', value: Math.max(0, data.stats.totalUsers - (data.stats.activeTrials || 0) - (data.stats.expiredTrials || 0) - (data.stats.activeSubscribers || 0)) }
                               ]}
                               innerRadius={80}
                               outerRadius={110}
                               paddingAngle={8}
                               dataKey="value"
                             >
                               <Cell fill="#fbbf24" />
                               <Cell fill="#ef4444" />
                               <Cell fill="#10b981" />
                               <Cell fill="#6b7280" />
                             </Pie>
                             <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                           </PieChart>
                         </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-4 text-xs font-bold mt-4">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]"></span> Trial: {data.stats.activeTrials || 0}</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span> Expired: {data.stats.expiredTrials || 0}</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> Active: {data.stats.activeSubscribers || 0}</span>
                      </div>
                   </div>

                   {/* Device Saturation */}
                   <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                      <h3 className="text-xl font-serif font-black text-white mb-6 uppercase tracking-widest text-center">Device Distribution</h3>
                      <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="99%" height="100%">
                          <BarChart
                            data={[
                              { name: '0 Dev', count: data.stats.deviceUsageStats?.breakdown?.['0'] || 0 },
                              { name: '1 Dev', count: data.stats.deviceUsageStats?.breakdown?.['1'] || 0 },
                              { name: '2 Dev', count: data.stats.deviceUsageStats?.breakdown?.['2'] || 0 },
                              { name: '3 Dev', count: data.stats.deviceUsageStats?.breakdown?.['3'] || 0 },
                            ]}
                          >
                            <XAxis dataKey="name" stroke="#64748b" />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Bar dataKey="count" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center text-xs font-bold text-gray-400 mt-4">
                        Total Devices: {data.stats.deviceUsageStats?.totalDevices || 0} (Avg: {data.stats.deviceUsageStats?.avgDevices || 0}/user)
                      </div>
                   </div>

                   {/* Seeker Profiles */}
                   <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                      <h3 className="text-xl font-serif font-black text-white mb-6 uppercase tracking-widest text-center">Seeker Profiles</h3>
                      <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="99%" height="100%">
                          <BarChart
                            data={[
                              { name: '0 Prof', count: data.stats.memberProfileStats?.breakdown?.['0'] || 0 },
                              { name: '1 Prof', count: data.stats.memberProfileStats?.breakdown?.['1'] || 0 },
                              { name: '2 Prof', count: data.stats.memberProfileStats?.breakdown?.['2'] || 0 },
                              { name: '3 Prof', count: data.stats.memberProfileStats?.breakdown?.['3'] || 0 },
                            ]}
                          >
                            <XAxis dataKey="name" stroke="#64748b" />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Bar dataKey="count" fill="#a78bfa" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center text-xs font-bold text-gray-400 mt-4">
                        Total Profiles: {data.stats.memberProfileStats?.totalProfiles || 0} (Avg: {data.stats.memberProfileStats?.avgProfiles || 0}/user)
                      </div>
                   </div>
                </div>
              )}

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

            {activeTab === 'songs' && (
              <div className="space-y-6">
                <div className="bg-glass-premium backdrop-blur-3xl rounded-[2.5rem] border border-devotion-gold/20 p-8 shadow-2xl">
                  <h2 className="text-xl font-black uppercase tracking-widest text-devotion-gold mb-8">Manage Devotional Songs</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-gray-400">
                          <th className="pb-4 pr-4 font-black">Song</th>
                          <th className="pb-4 pr-4 font-black">Artist</th>
                          <th className="pb-4 pr-4 font-black">Duration</th>
                          <th className="pb-4 font-black text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {(data.songs || []).map((song) => (
                          <tr key={song._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-4">
                                <img src={song.cover} alt={song.title} className="w-12 h-12 rounded-xl object-cover" />
                                <div>
                                  <p className="font-bold text-white">{song.title}</p>
                                  <a href={song.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate w-32 block">URL</a>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 pr-4 text-gray-300 font-medium">{song.artist}</td>
                            <td className="py-4 pr-4 text-gray-300">{song.duration}</td>
                            <td className="py-4 text-right">
                              <button onClick={() => handleDeleteContent('songs', song._id, song.title)} className="text-red-400 hover:text-red-300 p-2 rounded-xl hover:bg-red-400/10 transition-colors">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(!data.songs || data.songs.length === 0) && (
                          <tr><td colSpan="4" className="py-8 text-center text-gray-500">No songs found.</td></tr>
                        )}
                      </tbody>
                    </table>
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
                                {u.profilePicture ? <img src={u.profilePicture} loading="lazy" className="w-full h-full object-cover" /> : <span className="text-2xl font-black text-devotion-gold">{u.name[0]}</span>}
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
                      <div className="flex flex-col">
                         <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter">Movie <span className="text-devotion-gold">Library</span></h3>
                         <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Premium Cinema Management</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <button 
                           onClick={() => {
                             if (window.confirm(`Globalize ${data.movies.length} movies? This will queue AI translation jobs for all content.`)) {
                               data.movies.forEach(m => handleAIProcess(m._id || m.id, 'Movie', 'all'));
                               setMessage({ type: 'success', text: `Queued ${data.movies.length} movies for globalization.` });
                             }
                           }}
                           className="hidden md:flex items-center gap-2 px-6 py-2 rounded-xl bg-devotion-gold/10 border border-devotion-gold/30 text-devotion-gold font-black text-[10px] uppercase tracking-widest hover:bg-devotion-gold/20 transition-all"
                         >
                            <Sparkles className="w-4 h-4" /> Globalize All Movies
                         </button>
                         <span className="bg-devotion-gold/10 text-devotion-gold px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border border-devotion-gold/30">Total: {data.movies.length}</span>
                      </div>
                   </div>
                  {data.movies.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No movies uploaded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {data.movies.map((movie) => (
                        <div key={movie._id || movie.id} className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col min-w-0">
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
                          <h4 className="text-white font-bold text-lg mb-2 flex items-center justify-between">
                            {movie.title}
                            <div className="flex gap-2">
                              {movie.isKids && <span className="bg-blue-500/20 text-blue-400 text-[8px] px-2 py-0.5 rounded border border-blue-500/30">KIDS</span>}
                              {movie.isComingSoon && <span className="bg-yellow-500/20 text-yellow-400 text-[8px] px-2 py-0.5 rounded border border-yellow-500/30">SOON</span>}
                            </div>
                          </h4>
                          <p className="text-xs text-gray-400 mb-3">{movie.releaseYear || 'N/A'} • {(movie.tags || []).join(', ') || 'No tags'} • <span className="text-devotion-gold inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {movie.views || 0}</span></p>
                          <p className="text-sm text-gray-300 line-clamp-2 mb-4">{movie.description || 'No description'}</p>
                          <div className="mt-auto space-y-2">
                            <div className="flex flex-wrap gap-2">
                               <button
                                 onClick={() => handleAIProcess(movie._id || movie.id, 'Movie', 'all')}
                                 className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#00A8FF]/30 text-[#00A8FF] hover:bg-[#00A8FF]/10 transition-all text-[9px] font-black uppercase tracking-widest"
                               >
                                  <Sparkles className="w-3 h-3" /> AI Globalization
                               </button>
                               <button
                                 onClick={() => handleAIProcess(movie._id || movie.id, 'Movie', 'reels_snippet')}
                                 className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-all text-[9px] font-black uppercase tracking-widest"
                               >
                                  <Layers className="w-3 h-3" /> Gen Reels
                               </button>
                               <button
                                 onClick={() => handleAIProcess(movie._id || movie.id, 'Movie', 'quiz')}
                                 className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all text-[9px] font-black uppercase tracking-widest"
                               >
                                  <Check className="w-3 h-3" /> Gen Quiz
                               </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                               <button
                                 onClick={() => handleAIProcess(movie._id || movie.id, 'movie', 'subtitles')}
                                 className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-blue-500/30 text-blue-400 hover:text-white hover:bg-blue-500/10 transition-all text-[9px] font-black uppercase tracking-widest"
                               >
                                 <Cpu className="w-3 h-3" /> AI Subtitles
                               </button>
                               <button
                                 onClick={() => handleEditMovie(movie)}
                                 className="flex-1 min-w-[80px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-devotion-gold/30 text-devotion-gold hover:text-white hover:bg-devotion-gold/10 transition-all text-[9px] font-black uppercase tracking-widest"
                               >
                                 <Pencil className="w-3 h-3" /> Edit
                               </button>
                               <button
                                 onClick={() => handleDeleteContent('movies', movie._id || movie.id, movie.title || 'Untitled')}
                                 className="flex-1 min-w-[80px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-red-500/30 text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all text-[9px] font-black uppercase tracking-widest"
                               >
                                 <Trash2 className="w-3 h-3" /> Delete
                               </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            )}

            {activeTab === 'stories' && (
               <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl space-y-8">
                  {/* FOLDER CHAPTER EDITOR SWITCH/VIEW */}
                  {!selectedStoryForChapters ? (
                    <>
                       <div className="flex justify-between items-center mb-10">
                          <div className="flex flex-col">
                             <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter">Divine Folder <span className="text-devotion-gold">Library</span></h3>
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Hierarchical Stories & Chapters</span>
                          </div>
                          <div className="flex items-center gap-4">
                             <button 
                               onClick={() => {
                                 if (window.confirm(`Globalize all ${data.stories.length} story folders? This will queue AI translation and chaptering jobs.`)) {
                                   data.stories.forEach(s => handleAIProcess(s._id || s.id, 'Story', 'all'));
                                   setMessage({ type: 'success', text: `Queued ${data.stories.length} folders for globalization.` });
                                 }
                               }}
                               className="hidden md:flex items-center gap-2 px-6 py-2 rounded-xl bg-[#00A8FF]/10 border border-[#00A8FF]/30 text-[#00A8FF] font-black text-[10px] uppercase tracking-widest hover:bg-[#00A8FF]/20 transition-all"
                             >
                                <Sparkles className="w-4 h-4" /> Globalize All Folders
                             </button>
                             <span className="bg-devotion-gold/10 text-devotion-gold px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border border-devotion-gold/30">Total: {data.stories.length} Folders</span>
                          </div>
                       </div>

                      {data.stories.length === 0 ? (
                        <p className="text-gray-500 text-center py-12">No folders uploaded yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {data.stories.map((story) => (
                            <div key={story._id || story.id} className="p-6 rounded-3xl border border-white/10 bg-white/5 group relative overflow-hidden flex flex-col justify-between pt-10">
                              {/* Stylized Folder Badge */}
                              <div className="absolute top-0 left-0 w-28 h-6 bg-devotion-gold/20 rounded-tr-lg border-r border-t border-white/10 flex items-center px-3">
                                <Folder className="w-3 h-3 text-devotion-gold mr-1" />
                                <span className="text-[8px] font-black uppercase tracking-wider text-devotion-gold">Folder</span>
                              </div>

                              <div>
                                {story.thumbnail && (
                                  <div className="mb-4 aspect-video rounded-xl overflow-hidden border border-white/10">
                                    <img src={story.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                  </div>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                   <h4 className="text-white font-bold text-lg">{story.title}</h4>
                                   <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${story.status === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                                      {story.status || 'Draft'}
                                   </span>
                                </div>
                                <p className="text-xs text-devotion-gold mb-3 font-black uppercase tracking-widest">
                                  {story.category || 'General'} • {story.chapters?.length || 0} Chapters
                                </p>
                                <p className="text-sm text-gray-300 line-clamp-2 mb-6">{story.description || 'No description provided.'}</p>
                              </div>
                              
                              <div className="space-y-4 mt-auto">
                                <button
                                  onClick={() => setSelectedStoryForChapters(story)}
                                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-devotion-gold text-devotion-darkBlue font-black text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                                >
                                  <BookOpen className="w-4 h-4" /> Manage Chapters
                                </button>

                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                     <button
                                       onClick={() => handleAIProcess(story._id || story.id, 'Story', 'chaptering')}
                                       className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-all text-[8px] font-black uppercase tracking-widest"
                                     >
                                        <BookOpen className="w-2.5 h-2.5" /> Gen Chapters
                                     </button>
                                     <button
                                       onClick={() => handleAIProcess(story._id || story.id, 'Story', 'translation')}
                                       className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border border-[#00A8FF]/30 text-[#00A8FF] hover:bg-[#00A8FF]/10 transition-all text-[8px] font-black uppercase tracking-widest"
                                     >
                                        <Sparkles className="w-2.5 h-2.5" /> Globalize
                                     </button>
                                     <button
                                       onClick={() => handleAIProcess(story._id || story.id, 'Story', 'quiz')}
                                       className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all text-[8px] font-black uppercase tracking-widest"
                                     >
                                        <Check className="w-2.5 h-2.5" /> Gen Quiz
                                     </button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() => handleEditStory(story)}
                                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-devotion-gold/30 text-devotion-gold hover:text-white hover:bg-devotion-gold/10 transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                      <Pencil className="w-3.5 h-3.5" /> Edit Folder
                                    </button>
                                    <button
                                      onClick={() => handleDeleteContent('stories', story._id || story.id, story.title || 'Untitled')}
                                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Delete Folder
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-350">
                       {/* BACK BUTTON & HEADER */}
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                          <div className="flex items-center gap-4">
                             <button
                               onClick={() => {
                                 setSelectedStoryForChapters(null);
                                 setChapterEditIndex(-1);
                               }}
                               className="p-3 bg-white/5 border border-white/10 hover:border-devotion-gold/50 rounded-2xl text-devotion-gold hover:text-white transition-all"
                             >
                                <ArrowLeft className="w-5 h-5" />
                             </button>
                             <div>
                                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                   <Folder className="w-6 h-6 text-devotion-gold" /> {selectedStoryForChapters.title}
                                </h3>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                   Folder Category: {selectedStoryForChapters.category || 'General'} • {selectedStoryForChapters.chapters?.length || 0} Chapters
                                </span>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <button
                               onClick={() => setShowMultiUpload(prev => !prev)}
                               className="px-5 py-3 rounded-2xl border border-devotion-gold/30 text-devotion-gold hover:bg-devotion-gold/10 font-black text-[10px] uppercase tracking-widest transition-all"
                             >
                                {showMultiUpload ? 'Hide Multi Upload' : 'Upload Multiple Chapters'}
                             </button>
                          </div>
                       </div>

                       {/* SPLIT LAYOUT FOR CHAPTER MANAGEMENT */}
                       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          {/* Left Column: Create Chapter / Multi Upload */}
                          <div className="lg:col-span-5 space-y-6">
                             {showMultiUpload ? (
                               <div className="bg-[#0B1F3A]/40 border border-white/10 p-6 rounded-3xl space-y-4">
                                  <div className="flex flex-col">
                                     <h4 className="text-white font-bold text-sm uppercase tracking-wider">Upload Multiple Chapters</h4>
                                     <span className="text-[9px] text-gray-400">Paste your structured text below. Support JSON array or text split by "===" delimiter.</span>
                                  </div>
                                  <div className="space-y-1.5">
                                     <label className="text-[9px] font-black uppercase tracking-widest text-devotion-gold">Select Target Folder/Story</label>
                                     <select
                                       className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-devotion-gold outline-none"
                                       value={newChapterTargetFolderId || (selectedStoryForChapters._id || selectedStoryForChapters.id)}
                                       onChange={e => setNewChapterTargetFolderId(e.target.value)}
                                     >
                                       {data.stories.map(s => (
                                         <option key={s._id || s.id} value={s._id || s.id} className="bg-[#0B1F3A] text-white">
                                           {s.title}
                                         </option>
                                       ))}
                                     </select>
                                  </div>
                                  
                                  <textarea
                                    rows="14"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-xs text-white placeholder-gray-600 focus:border-devotion-gold outline-none"
                                    placeholder={`Example delimiters:\n=== Chapter 1 – Title\nContent goes here...\n\nExample JSON:\n[\n  {"title": "Chapter 1", "content": "..."}\n]`}
                                    value={multiChaptersText}
                                    onChange={e => setMultiChaptersText(e.target.value)}
                                  />

                                  <button
                                    onClick={() => {
                                      const targetFolderId = newChapterTargetFolderId || (selectedStoryForChapters._id || selectedStoryForChapters.id);
                                      handleImportMultipleChapters(targetFolderId, multiChaptersText);
                                    }}
                                    className="w-full py-4 bg-devotion-gold hover:bg-yellow-400 text-devotion-darkBlue font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                                  >
                                     Import Chapters
                                  </button>
                               </div>
                             ) : (
                               <div className="bg-[#0B1F3A]/40 border border-white/10 p-6 rounded-3xl space-y-4">
                                  <h4 className="text-white font-bold text-sm uppercase tracking-wider">Add Single Chapter</h4>
                                  
                                  <div className="space-y-1.5">
                                     <label className="text-[9px] font-black uppercase tracking-widest text-devotion-gold">Select Target Folder/Story</label>
                                     <select
                                       className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-devotion-gold outline-none"
                                       value={newChapterTargetFolderId || (selectedStoryForChapters._id || selectedStoryForChapters.id)}
                                       onChange={e => setNewChapterTargetFolderId(e.target.value)}
                                     >
                                       {data.stories.map(s => (
                                         <option key={s._id || s.id} value={s._id || s.id} className="bg-[#0B1F3A] text-white">
                                           {s.title}
                                         </option>
                                       ))}
                                     </select>
                                  </div>
                                  
                                  <div className="space-y-3">
                                     <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-devotion-gold">Chapter Title *</label>
                                        <input
                                          placeholder="Chapter 1 – The Beginning"
                                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-devotion-gold outline-none"
                                          value={newChapterForm.title}
                                          onChange={e => setNewChapterForm(f => ({ ...f, title: e.target.value }))}
                                        />
                                     </div>
                                     <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-devotion-gold">Spiritual Summary</label>
                                        <input
                                          placeholder="A brief spiritual overview..."
                                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-devotion-gold outline-none"
                                          value={newChapterForm.summary}
                                          onChange={e => setNewChapterForm(f => ({ ...f, summary: e.target.value }))}
                                        />
                                     </div>
                                     <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-devotion-gold">Spiritual Takeaways (comma separated)</label>
                                        <input
                                          placeholder="Faith, Devotion, Service"
                                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-devotion-gold outline-none"
                                          value={newChapterForm.takeaways}
                                          onChange={e => setNewChapterForm(f => ({ ...f, takeaways: e.target.value }))}
                                        />
                                     </div>
                                     <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-devotion-gold">Chapter Content</label>
                                        <textarea
                                          rows="6"
                                          placeholder="Full scripture or chapter description..."
                                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-devotion-gold outline-none"
                                          value={newChapterForm.content}
                                          onChange={e => setNewChapterForm(f => ({ ...f, content: e.target.value }))}
                                        />
                                     </div>

                                     <button
                                       onClick={() => {
                                         const title = newChapterForm.title.trim();
                                         if (!title) {
                                           alert('Please enter a chapter title.');
                                           return;
                                         }

                                         const targetFolderId = newChapterTargetFolderId || (selectedStoryForChapters._id || selectedStoryForChapters.id);
                                         const targetStory = data.stories.find(s => String(s._id || s.id) === String(targetFolderId)) || selectedStoryForChapters;
                                         
                                         const isDuplicate = (targetStory.chapters || []).some(
                                           c => (c.title || '').toLowerCase() === title.toLowerCase()
                                         );
                                         if (isDuplicate) {
                                           alert(`A chapter with the title "${title}" already exists in this folder.`);
                                           return;
                                         }

                                         const newCh = {
                                           title,
                                           content: newChapterForm.content.trim(),
                                           summary: newChapterForm.summary.trim(),
                                           takeaways: newChapterForm.takeaways.split(',').map(s => s.trim()).filter(Boolean),
                                           sequence: (targetStory.chapters?.length || 0) + 1,
                                           folderId: targetStory._id || targetStory.id,
                                           parentFolder: targetStory.title
                                         };

                                         const updated = [...(targetStory.chapters || []), newCh];
                                         handleSaveStoryChapters(targetFolderId, updated);
                                         
                                         setNewChapterForm({ title: '', summary: '', takeaways: '', content: '' });
                                       }}
                                       className="w-full py-4 bg-devotion-gold hover:bg-yellow-400 text-devotion-darkBlue font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                                     >
                                        + Add Chapter
                                     </button>
                                  </div>
                               </div>
                             )}
                          </div>

                          {/* Right Column: Draggable Chapters List */}
                          <div className="lg:col-span-7 space-y-4">
                             <div className="flex justify-between items-center bg-white/5 border border-white/10 px-6 py-4 rounded-2xl">
                                <span className="text-[10px] font-black uppercase tracking-wider text-devotion-gold">Drag cards to reorder</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">{selectedStoryForChapters.chapters?.length || 0} Total</span>
                             </div>

                             {(!selectedStoryForChapters.chapters || selectedStoryForChapters.chapters.length === 0) ? (
                               <div className="text-center py-20 bg-white/5 border-2 border-dashed border-white/10 rounded-3xl text-gray-500">
                                  No chapters inside this folder yet.
                               </div>
                             ) : (
                               <div className="space-y-3">
                                  {selectedStoryForChapters.chapters.map((chapter, idx) => (
                                    <div
                                      key={chapter._id || idx}
                                      draggable={chapterEditIndex !== idx}
                                      onDragStart={(e) => handleDragStart(e, idx)}
                                      onDragOver={(e) => handleDragOver(e, idx)}
                                      onDrop={(e) => handleDrop(e, idx)}
                                      className={`p-5 rounded-3xl border transition-all bg-[#0B1F3A]/30 flex flex-col gap-4 ${draggedChapterIndex === idx ? 'border-dashed border-devotion-gold bg-[#0B1F3A]/70 opacity-50' : 'border-white/10 hover:border-white/20'}`}
                                    >
                                       <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                          <div className="flex items-center gap-3">
                                             <div className="cursor-grab hover:text-devotion-gold text-gray-500">
                                                <GripVertical className="w-4 h-4" />
                                             </div>
                                             <span className="w-6 h-6 rounded-full bg-devotion-gold/10 text-devotion-gold border border-devotion-gold/20 flex items-center justify-center text-[10px] font-black">
                                                {idx + 1}
                                             </span>
                                             <span className="font-bold text-white text-sm">{chapter.title}</span>
                                          </div>
                                          
                                          {chapterEditIndex !== idx && (
                                            <div className="flex items-center gap-2">
                                               <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2 py-1.5 rounded-xl">
                                                 <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Move:</span>
                                                 <select
                                                   value=""
                                                   onChange={(e) => {
                                                     const targetId = e.target.value;
                                                     if (targetId) {
                                                       handleMoveChapter(selectedStoryForChapters._id || selectedStoryForChapters.id, idx, targetId);
                                                     }
                                                   }}
                                                   className="bg-transparent text-[8px] font-black uppercase tracking-wider text-devotion-gold outline-none border-none cursor-pointer max-w-[80px]"
                                                 >
                                                    <option value="" className="bg-[#0B1F3A] text-gray-400">Select Folder</option>
                                                    {data.stories
                                                      .filter(s => String(s._id || s.id) !== String(selectedStoryForChapters._id || selectedStoryForChapters.id))
                                                      .map(s => <option key={s._id || s.id} value={s._id || s.id} className="bg-[#0B1F3A] text-white">{s.title}</option>)
                                                    }
                                                 </select>
                                               </div>

                                               <button
                                                 onClick={() => {
                                                   setChapterEditIndex(idx);
                                                   setChapterEditForm({
                                                     title: chapter.title || '',
                                                     content: chapter.content || '',
                                                     summary: chapter.summary || '',
                                                     takeaways: chapter.takeaways ? chapter.takeaways.join(', ') : '',
                                                     sequence: chapter.sequence || idx + 1
                                                   });
                                                 }}
                                                 className="p-2 hover:bg-white/5 rounded-lg text-devotion-gold hover:text-white"
                                               >
                                                  <Pencil className="w-3.5 h-3.5" />
                                               </button>
                                               <button
                                                 onClick={() => {
                                                   if (window.confirm(`Delete chapter "${chapter.title}"?`)) {
                                                     const updated = [...selectedStoryForChapters.chapters];
                                                     updated.splice(idx, 1);
                                                     handleSaveStoryChapters(selectedStoryForChapters._id || selectedStoryForChapters.id, updated);
                                                   }
                                                 }}
                                                 className="p-2 hover:bg-white/5 rounded-lg text-red-400 hover:text-red-300"
                                               >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                               </button>
                                            </div>
                                          )}
                                       </div>

                                       {chapterEditIndex === idx ? (
                                         <div className="space-y-4 pt-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                               <div className="space-y-1">
                                                 <label className="text-[8px] font-black uppercase text-devotion-gold tracking-widest">Edit Title</label>
                                                 <input
                                                   className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-devotion-gold"
                                                   value={chapterEditForm.title}
                                                   onChange={e => setChapterEditForm({...chapterEditForm, title: e.target.value})}
                                                 />
                                               </div>
                                               <div className="space-y-1">
                                                 <label className="text-[8px] font-black uppercase text-devotion-gold tracking-widest">Edit Takeaways</label>
                                                 <input
                                                   className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-devotion-gold"
                                                   value={chapterEditForm.takeaways}
                                                   onChange={e => setChapterEditForm({...chapterEditForm, takeaways: e.target.value})}
                                                 />
                                               </div>
                                            </div>

                                            <div className="space-y-1">
                                              <label className="text-[8px] font-black uppercase text-devotion-gold tracking-widest">Edit Summary</label>
                                              <input
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-devotion-gold"
                                                value={chapterEditForm.summary}
                                                onChange={e => setChapterEditForm({...chapterEditForm, summary: e.target.value})}
                                              />
                                            </div>

                                            <div className="space-y-1">
                                              <label className="text-[8px] font-black uppercase text-devotion-gold tracking-widest">Edit Content</label>
                                              <textarea
                                                rows="5"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-devotion-gold"
                                                value={chapterEditForm.content}
                                                onChange={e => setChapterEditForm({...chapterEditForm, content: e.target.value})}
                                              />
                                            </div>

                                            <div className="flex gap-2 justify-end">
                                               <button
                                                 onClick={() => {
                                                   if (chapterEditForm.title.trim().toLowerCase() !== chapter.title.toLowerCase()) {
                                                     const isDuplicate = selectedStoryForChapters.chapters.some(
                                                       (c, cIdx) => cIdx !== idx && c.title.toLowerCase() === chapterEditForm.title.trim().toLowerCase()
                                                     );
                                                     if (isDuplicate) {
                                                       alert(`A chapter with the title "${chapterEditForm.title.trim()}" already exists in this folder.`);
                                                       return;
                                                     }
                                                   }

                                                   const updated = [...selectedStoryForChapters.chapters];
                                                   updated[idx] = {
                                                     ...chapter,
                                                     title: chapterEditForm.title.trim(),
                                                     content: chapterEditForm.content.trim(),
                                                     summary: chapterEditForm.summary.trim(),
                                                     takeaways: chapterEditForm.takeaways.split(',').map(s => s.trim()).filter(Boolean),
                                                     sequence: chapterEditForm.sequence
                                                   };
                                                   handleSaveStoryChapters(selectedStoryForChapters._id || selectedStoryForChapters.id, updated);
                                                   setChapterEditIndex(-1);
                                                 }}
                                                 className="px-4 py-2 bg-devotion-gold text-devotion-darkBlue text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-yellow-400"
                                               >
                                                  Save
                                               </button>
                                               <button
                                                 onClick={() => setChapterEditIndex(-1)}
                                                 className="px-4 py-2 bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-white/10"
                                               >
                                                  Cancel
                                               </button>
                                            </div>
                                         </div>
                                       ) : (
                                         <div className="space-y-2">
                                            {chapter.summary && (
                                              <p className="text-[11px] text-devotion-gold italic font-serif leading-relaxed">"{chapter.summary}"</p>
                                            )}
                                            <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{chapter.content}</p>
                                         </div>
                                       )}
                                    </div>
                                  ))}
                               </div>
                             )}
                          </div>
                       </div>
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
                          <h4 className="text-white font-bold text-lg mb-2 flex items-center justify-between">
                            {video.title}
                            {video.isKids && <span className="bg-blue-500/20 text-blue-400 text-[8px] px-2 py-0.5 rounded border border-blue-500/30">KIDS</span>}
                          </h4>
                          <p className="text-xs text-gray-400 mb-3">{video.collectionTitle || 'Bhagavad Gita'} • {video.category || 'General'} • {video.isKids ? 'Kids' : 'All Ages'} • <span className="text-devotion-gold inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {video.views || 0}</span></p>
                          <p className="text-sm text-gray-300 line-clamp-2 mb-4">{video.description || 'No description'}</p>
                          <div className="mt-auto flex flex-wrap gap-2">
                            <button
                              onClick={() => handleAIProcess(video._id || video.id, 'Video')}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#00A8FF]/30 text-[#00A8FF] hover:bg-[#00A8FF]/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                               <Sparkles className="w-4 h-4" /> AI Voice
                            </button>
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

             {activeTab === 'ai-jobs' && (
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 backdrop-blur-3xl">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                      <div>
                        <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter">AI Processing <span className="text-devotion-gold">Monitor</span></h3>
                        <p className="text-gray-400 text-sm mt-2 font-medium">Real-time status of all divine content processing tasks.</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="bg-blue-500/10 text-blue-400 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border border-blue-500/30">Active Jobs: {data.aiJobs.filter(j => j.status === 'processing').length}</span>
                        <button 
                          onClick={fetchAdminData} 
                          className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white"
                        >
                          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                   </div>

                   <div className="bg-black/20 rounded-[2rem] border border-white/5 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Job Type</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Content</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Progress</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Last Update</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {data.aiJobs.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="px-8 py-20 text-center text-gray-500 italic">No AI processing jobs found in history.</td>
                              </tr>
                            ) : (
                              data.aiJobs.map((job) => (
                                <tr key={job._id} className="hover:bg-white/[0.02] transition-colors group">
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${job.status === 'completed' ? 'bg-green-500/10 text-green-400' : job.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                          <Cpu className="w-4 h-4" />
                                       </div>
                                       <span className="text-xs font-bold text-white uppercase">{job.type} {job.contentType}</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <span className="text-[10px] text-gray-400 font-mono">ID: {String(job.contentId).slice(-8)}</span>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="flex flex-col gap-2 min-w-[120px]">
                                      <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                         <span>{job.status === 'completed' ? '100%' : `${job.progress || 0}%`}</span>
                                         <span>{job.status}</span>
                                      </div>
                                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                         <div 
                                           className={`h-full transition-all duration-1000 ${job.status === 'completed' ? 'bg-green-500' : job.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}`}
                                           style={{ width: job.status === 'completed' ? '100%' : `${job.progress || 5}%` }}
                                         />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                      job.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 
                                      job.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 
                                      'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                    }`}>
                                      {job.status}
                                    </span>
                                  </td>
                                  <td className="px-8 py-6 text-gray-500 text-[10px] font-medium">
                                    {new Date(job.updatedAt || job.createdAt).toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'translations' && (
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                      <div>
                        <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter">Regional <span className="text-devotion-gold">Translations</span></h3>
                        <p className="text-gray-400 text-sm mt-2 font-medium">Manage localized titles and meanings across all divine languages.</p>
                      </div>
                      <div className="flex bg-black/40 p-1 rounded-xl">
                        <button className="px-6 py-2 rounded-lg bg-devotion-gold text-black font-black text-[10px] uppercase tracking-widest shadow-lg">Pending AI</button>
                        <button className="px-6 py-2 rounded-lg text-gray-400 hover:text-white font-black text-[10px] uppercase tracking-widest">Completed</button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-black/20 p-8 rounded-[2.5rem] border border-white/5">
                        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-3">
                           <Sparkles className="w-4 h-4 text-devotion-gold" /> Active Translation Queue
                        </h4>
                        <div className="space-y-4">
                           {translationJobs.length === 0 ? (
                             <div className="py-12 text-center">
                                <RefreshCw className="w-8 h-8 text-white/10 mx-auto mb-4" />
                                <p className="text-gray-500 text-xs italic">No active translation jobs detected.</p>
                             </div>
                           ) : (
                             translationJobs.map(job => (
                               <div key={job._id} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-devotion-gold/20 transition-all">
                                  <div className="flex justify-between items-start mb-3">
                                     <div>
                                        <p className="text-xs font-bold text-white uppercase">{job.contentType} Translation</p>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Targets: {job.targetLanguages?.join(', ') || 'All'}</p>
                                     </div>
                                     <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded uppercase tracking-widest border border-blue-500/20">{job.status}</span>
                                  </div>
                                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                     <div className="h-full bg-blue-500 animate-pulse" style={{ width: `${job.progress || 30}%` }} />
                                  </div>
                               </div>
                             ))
                           )}
                        </div>
                      </div>

                      <div className="bg-black/20 p-8 rounded-[2.5rem] border border-white/5">
                        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-3">
                           <Layers className="w-4 h-4 text-devotion-gold" /> Global Status
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                           {[
                             { label: 'Hindi', count: '98%', color: 'text-orange-400' },
                             { label: 'Telugu', count: '94%', color: 'text-yellow-400' },
                             { label: 'Tamil', count: '89%', color: 'text-green-400' },
                             { label: 'Kannada', count: '82%', color: 'text-red-400' },
                             { label: 'Sanskrit', count: '100%', color: 'text-purple-400' },
                             { label: 'English', count: '100%', color: 'text-blue-400' }
                           ].map(lang => (
                             <div key={lang.label} className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{lang.label}</p>
                                <div className="flex items-end justify-between">
                                   <span className={`text-2xl font-black ${lang.color}`}>{lang.count}</span>
                                   <span className="text-[9px] text-gray-600 mb-1">Ready</span>
                                </div>
                             </div>
                           ))}
                        </div>
                        <div className="mt-8 p-4 bg-devotion-gold/5 border border-devotion-gold/20 rounded-2xl">
                           <p className="text-[10px] text-devotion-gold font-black uppercase tracking-widest mb-2 flex items-center gap-2"><Cpu className="w-3 h-3" /> AI Automation</p>
                           <p className="text-xs text-gray-400">System is automatically scanning for missing translations every 24h or on manual publish.</p>
                        </div>
                      </div>
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
                  {activeTab === 'songs' && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Song Title</label>
                      <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={songForm.title} onChange={e => setSongForm({...songForm, title: e.target.value})} placeholder="Hare Krishna Maha Mantra" required />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Artist / Singer</label>
                      <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={songForm.artist} onChange={e => setSongForm({...songForm, artist: e.target.value})} placeholder="Srila Prabhupada" required />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Audio/YouTube URL</label>
                      <input type="url" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={songForm.url} onChange={e => setSongForm({...songForm, url: e.target.value})} placeholder="https://youtube.com/..." required />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Cover Image URL</label>
                      <input type="url" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={songForm.cover} onChange={e => setSongForm({...songForm, cover: e.target.value})} placeholder="https://..." required />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Duration (e.g. 5:30)</label>
                      <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={songForm.duration} onChange={e => setSongForm({...songForm, duration: e.target.value})} placeholder="5:30" />
                    </div>
                  </div>
                )}
                {activeTab === 'movies' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       {/* Quick Guide Banner */}
                       <div className="md:col-span-2 bg-devotion-gold/5 border border-devotion-gold/20 rounded-2xl p-5 mb-2">
                         <p className="text-[10px] font-black uppercase tracking-widest text-devotion-gold mb-3">📋 Upload Guide</p>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-300">
                           <div className="flex items-start gap-2">
                             <span className="text-devotion-gold font-black mt-0.5">1.</span>
                             <div><strong className="text-white">Main Movie File</strong><br/>Upload via file upload or paste a YouTube/MP4 URL. This is the full movie viewers watch.</div>
                           </div>
                           <div className="flex items-start gap-2">
                             <span className="text-devotion-gold font-black mt-0.5">2.</span>
                             <div><strong className="text-white">Trailer / Teaser</strong><br/>Short 1-3 min clip. Auto-plays as the hero background. Use YouTube short URL or upload.</div>
                           </div>
                           <div className="flex items-start gap-2">
                             <span className="text-red-400 font-black mt-0.5">⚠️</span>
                             <div><strong className="text-white">Jio/Hotstar/Netflix</strong><br/>Cannot be embedded. Paste the link as Video URL — users will see a 'Watch on Platform' button.</div>
                           </div>
                         </div>
                       </div>
                      <div className="space-y-4">
                         <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2"><FileText className="w-3 h-3"/> Movie Title</label>
                         <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="e.g. Shri Krishna" value={movieForm.title} onChange={e => setMovieForm({...movieForm, title: e.target.value})} />
                      </div>
                      <LanguageSelector value={movieForm.originalLanguage} onChange={val => setMovieForm({...movieForm, originalLanguage: val})} />
                      <div className="space-y-4">
                          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2"><LinkIcon className="w-3 h-3"/> Direct File Upload (HQ Netflix/Hotstar Range)</label>
                          <div className="flex flex-col gap-3">
                            <input type="file" accept="video/*" onChange={handleVideoFileChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white file:mr-4 file:rounded-xl file:border-0 file:bg-devotion-gold file:px-4 file:py-2 file:text-xs file:font-black file:text-devotion-darkBlue" />
                            {videoUploadProgress > 0 && (
                              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                                <div className="bg-devotion-gold h-2 rounded-full transition-all" style={{ width: `${videoUploadProgress}%` }}></div>
                              </div>
                            )}
                          </div>
                       </div>
                       <div className="space-y-4">
                          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2"><LinkIcon className="w-3 h-3"/> Video URL (YouTube, Direct MP4, or HLS)</label>
                          <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="https://youtu.be/... or https://...mp4" value={movieForm.videoUrl} onChange={e => setMovieForm({...movieForm, videoUrl: e.target.value})} />
                          <p className="text-[10px] text-gray-500 ml-2">⚠️ Jio/Hotstar/Netflix links cannot be embedded — use YouTube, direct MP4, or upload a file instead.</p>
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
                      <div className="md:col-span-2 flex flex-wrap items-center gap-8 bg-white/5 p-5 rounded-[2rem] border border-white/10 mb-6">
                         <div className="flex items-center gap-4">
                           <input type="checkbox" id="isComingSoon" className="w-6 h-6 accent-devotion-gold" checked={movieForm.isComingSoon} onChange={e => setMovieForm({...movieForm, isComingSoon: e.target.checked})} />
                           <label htmlFor="isComingSoon" className="text-sm font-black uppercase tracking-widest text-white cursor-pointer">Mark as "Coming Soon" (Upcoming Movie)</label>
                         </div>
                         <div className="flex items-center gap-4">
                           <input type="checkbox" id="isKidsMovie" className="w-6 h-6 accent-devotion-gold" checked={movieForm.isKids} onChange={e => setMovieForm({...movieForm, isKids: e.target.checked})} />
                           <label htmlFor="isKidsMovie" className="text-sm font-black uppercase tracking-widest text-white cursor-pointer">Show on Kids Page</label>
                         </div>
                      </div>
                      <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Genre</label>
                          <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={movieForm.genre} onChange={e => setMovieForm({...movieForm, genre: e.target.value})}>
                            <option value="Divine" className="bg-[#0B1F3A]">Divine</option>
                            <option value="Epic" className="bg-[#0B1F3A]">Epic</option>
                            <option value="Educational" className="bg-[#0B1F3A]">Educational</option>
                            <option value="Animation" className="bg-[#0B1F3A]">Animation</option>
                            <option value="Documentary" className="bg-[#0B1F3A]">Documentary</option>
                          </select>
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Duration (minutes)</label>
                          <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={movieForm.duration} onChange={e => setMovieForm({...movieForm, duration: parseInt(e.target.value) || 0})} />
                       </div>
                       <div className="md:col-span-2 space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Owner's Selection Insight</label>
                          <textarea rows="3" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="Why this movie?" value={movieForm.ownerHistory} onChange={e => setMovieForm({...movieForm, ownerHistory: e.target.value})} />
                       </div>

                       <div className="md:col-span-2 rounded-[2rem] border border-white/10 bg-black/25 p-6 sm:p-8 shadow-2xl shadow-black/20">
                         <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
                           <div>
                             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-devotion-gold mb-2">Live Movie Preview</p>
                             <h3 className="text-2xl font-serif font-black text-white uppercase tracking-tight line-clamp-2">{movieForm.title || 'Movie title preview'}</h3>
                           </div>
                           <div className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                             {movieForm.trailerUrl || movieForm.videoUrl ? 'Trailer / Video Source Ready' : 'Add source to preview'}
                           </div>
                         </div>

                         <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)] gap-6">
                           <div className="rounded-[1.75rem] overflow-hidden border border-devotion-gold/20 bg-black aspect-video relative">
                             {movieForm.trailerUrl || movieForm.videoUrl ? (
                               <MediaPlayerHLS
                                 url={movieForm.trailerUrl || movieForm.videoUrl}
                                 hlsUrl={movieForm.hlsUrl}
                                 title={movieForm.title || 'Movie Preview'}
                                 className="w-full h-full object-cover transform-gpu"
                                 autoPlay={true}
                                 muted={true}
                                 loop={true}
                                 controls={false}
                                 playsInline={true}
                                 instagramMode={true}
                               />
                             ) : movieForm.thumbnail ? (
                               <img src={movieForm.thumbnail} alt={movieForm.title || 'Movie preview'} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,215,0,0.12),_transparent_60%)] text-center px-6">
                                 <div>
                                   <Film className="w-12 h-12 text-devotion-gold mx-auto mb-3" />
                                   <p className="text-sm font-bold text-white">Add a trailer, video URL, or thumbnail to activate preview.</p>
                                 </div>
                               </div>
                             )}
                             <div className="absolute inset-0 bg-gradient-to-t from-[#06101E]/85 via-[#06101E]/20 to-transparent pointer-events-none" />
                           </div>

                           <div className="grid grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 content-start">
                             <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                               <p className="text-gray-500 mb-1">Genre</p>
                               <p className="text-white">{movieForm.genre || 'Divine'}</p>
                             </div>
                             <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                               <p className="text-gray-500 mb-1">Release</p>
                               <p className="text-white">{movieForm.releaseYear || '2025'}</p>
                             </div>
                             <div className="rounded-2xl bg-white/5 border border-white/5 p-4 col-span-2">
                               <p className="text-gray-500 mb-1">Trailer / Video Source</p>
                               <p className="text-white break-all leading-relaxed">{movieForm.trailerUrl || movieForm.videoUrl || 'Not set yet'}</p>
                             </div>
                           </div>
                         </div>
                       </div>
                   </div>
                 )}

                 {/* STORY FORM */}
                 {activeTab === 'stories' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10 overflow-x-auto">
                      <div className="space-y-6">
                         <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Story Title</label>
                           <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="The Legend of Hanuman" value={storyForm.title} onChange={e => setStoryForm({...storyForm, title: e.target.value})} />
                         </div>
                         <LanguageSelector value={storyForm.language} onChange={val => setStoryForm({...storyForm, language: val})} />
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Library Folder / Parent Collection</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.parentFolderId} onChange={e => setStoryForm({...storyForm, parentFolderId: e.target.value})}>
                              <option value="" className="bg-[#0B1F3A]">None (Root Folder / Main Category)</option>
                              <option value="Ramayanam" className="bg-[#0B1F3A]">Ramayanam</option>
                              <option value="Mahabharatam" className="bg-[#0B1F3A]">Mahabharatam</option>
                              <option value="Bhagavad Gita" className="bg-[#0B1F3A]">Bhagavad Gita</option>
                              <option value="Krishna Leela" className="bg-[#0B1F3A]">Krishna Leela</option>
                              <option value="Hanuman Charitra" className="bg-[#0B1F3A]">Hanuman Charitra</option>
                              <option value="Shiva Purana" className="bg-[#0B1F3A]">Shiva Purana</option>
                            </select>
                         </div>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Category / Series</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.category} onChange={e => setStoryForm({...storyForm, category: e.target.value})}>
                              {STORY_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#0B1F3A]">{cat}</option>)}
                            </select>
                         </div>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Thumbnail URL</label>
                            <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.thumbnail} onChange={e => setStoryForm({...storyForm, thumbnail: e.target.value})} />
                         </div>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Brief Description</label>
                            <textarea rows="4" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" value={storyForm.description} onChange={e => setStoryForm({...storyForm, description: e.target.value})} />
                         </div>
                         <div className="flex items-center gap-4 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                               <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                               <h5 className="text-white font-bold text-xs uppercase tracking-widest">AI Chaptering Available</h5>
                               <p className="text-[10px] text-gray-400">Upload the full content below, then use "AI Chapters" to auto-segment.</p>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-6">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Full Story / Script Content</label>
                            <textarea rows="16" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none text-sm leading-relaxed" placeholder="Paste the entire story or scripture here..." value={storyForm.content} onChange={e => setStoryForm({...storyForm, content: e.target.value})} />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Target Audience</label>
                             <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-devotion-gold outline-none" value={storyForm.isKids ? 'kids' : 'all'} onChange={e => setStoryForm({...storyForm, isKids: e.target.value === 'kids'})}>
                               <option value="all" className="bg-[#0B1F3A]">General (All Ages)</option>
                               <option value="kids" className="bg-[#0B1F3A]">Kids Mode</option>
                             </select>
                           </div>
                           <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">Status</label>
                             <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-devotion-gold outline-none" value={storyForm.status} onChange={e => setStoryForm({...storyForm, status: e.target.value})}>
                               <option value="draft" className="bg-[#0B1F3A]">Draft</option>
                               <option value="published" className="bg-[#0B1F3A]">Published</option>
                             </select>
                           </div>
                         </div>

                         {/* Chapters Editor */}
                         <div className="md:col-span-2 mt-8 space-y-6">
                            <div className="flex justify-between items-center">
                               <h4 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-devotion-gold" /> Manual Chapter Editor
                               </h4>
                               <button type="button" onClick={() => {
                                  const newChapter = { title: `Chapter ${storyForm.chapters.length + 1}`, content: '', summary: '', takeaways: [''], sequence: storyForm.chapters.length + 1 };
                                  setStoryForm({...storyForm, chapters: [...(storyForm.chapters || []), newChapter]});
                               }} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-devotion-gold/10 text-devotion-gold border border-devotion-gold/20 rounded-xl hover:bg-devotion-gold/20 transition-all">
                                  + Add Chapter
                               </button>
                            </div>

                            {(!storyForm.chapters || storyForm.chapters.length === 0) ? (
                              <div className="p-8 rounded-[2rem] border-2 border-dashed border-white/5 bg-white/5 text-center">
                                 <p className="text-xs text-gray-500 italic">No chapters created. Use "AI Chapters" on a saved story or add manually.</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                 {storyForm.chapters.map((ch, idx) => (
                                   <div key={idx} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-6">
                                      <div className="flex justify-between items-center">
                                         <span className="text-[10px] font-black text-devotion-gold uppercase tracking-widest bg-devotion-gold/10 px-3 py-1 rounded-lg border border-devotion-gold/20">Ch {idx + 1}</span>
                                         <button type="button" onClick={() => {
                                            const updated = [...storyForm.chapters];
                                            updated.splice(idx, 1);
                                            setStoryForm({...storyForm, chapters: updated});
                                         }} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div className="space-y-4">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Chapter Title</label>
                                            <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-devotion-gold outline-none" value={ch.title} onChange={e => {
                                               const updated = [...storyForm.chapters];
                                               updated[idx].title = e.target.value;
                                               setStoryForm({...storyForm, chapters: updated});
                                            }} />
                                         </div>
                                         <div className="space-y-4">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Spiritual Summary</label>
                                            <textarea rows="2" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-devotion-gold outline-none" value={ch.summary} onChange={e => {
                                               const updated = [...storyForm.chapters];
                                               updated[idx].summary = e.target.value;
                                               setStoryForm({...storyForm, chapters: updated});
                                            }} />
                                         </div>
                                         <div className="md:col-span-2 space-y-4">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Chapter Content</label>
                                            <textarea rows="6" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-devotion-gold outline-none leading-relaxed" value={ch.content} onChange={e => {
                                               const updated = [...storyForm.chapters];
                                               updated[idx].content = e.target.value;
                                               setStoryForm({...storyForm, chapters: updated});
                                            }} />
                                         </div>
                                         <div className="md:col-span-2 space-y-4">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Spiritual Takeaways</label>
                                            <div className="space-y-2">
                                               {(ch.takeaways || ['']).map((tk, tIdx) => (
                                                 <div key={tIdx} className="flex gap-2">
                                                    <input className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-white focus:border-devotion-gold outline-none" value={tk} onChange={e => {
                                                       const updated = [...storyForm.chapters];
                                                       updated[idx].takeaways[tIdx] = e.target.value;
                                                       setStoryForm({...storyForm, chapters: updated});
                                                    }} />
                                                    {tIdx === ch.takeaways.length - 1 && (
                                                      <button type="button" onClick={() => {
                                                         const updated = [...storyForm.chapters];
                                                         updated[idx].takeaways.push('');
                                                         setStoryForm({...storyForm, chapters: updated});
                                                      }} className="p-2 text-devotion-gold bg-devotion-gold/10 rounded-xl border border-devotion-gold/20"><Plus className="w-4 h-4" /></button>
                                                    )}
                                                 </div>
                                               ))}
                                            </div>
                                         </div>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                            )}
                         </div>
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
                      <LanguageSelector value={videoForm.language} onChange={val => setVideoForm({...videoForm, language: val})} />
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
                        <div className="md:col-span-2 space-y-4">
                           <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-devotion-gold ml-2">?? Trailer / Teaser URL (Kids Hero Preview)</label>
                           <div className="flex gap-2">
                             <input className="flex-1 bg-white/5 border border-devotion-gold/30 rounded-2xl px-6 py-5 text-white focus:border-devotion-gold outline-none" placeholder="YouTube teaser or direct video link" value={videoForm.trailerUrl || ''} onChange={e => setVideoForm({...videoForm, trailerUrl: e.target.value})} />
                             <label className="cursor-pointer bg-devotion-gold/10 border border-devotion-gold/30 text-devotion-gold px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-devotion-gold/20 transition-all flex items-center gap-2 flex-shrink-0"><Upload className="w-4 h-4" /> Upload<input type="file" accept="video/*" className="hidden" onChange={e => handleVideoFileChange(e, true)} /></label>
                           </div>
                           <p className="text-[10px] text-gray-500 ml-2">Optional: Teaser for upcoming Kids episodes shown in Kids hero section.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-8 bg-white/5 p-6 rounded-[2rem] border border-white/10 mt-10">
                          <div className="flex items-center gap-4">
                            <input type="checkbox" id="videoIsComingSoon" className="w-6 h-6 accent-devotion-gold" checked={videoForm.isComingSoon} onChange={e => setVideoForm({...videoForm, isComingSoon: e.target.checked})} />
                            <label htmlFor="videoIsComingSoon" className="text-sm font-black uppercase tracking-widest text-white cursor-pointer">Mark as "Coming Soon" (Upcoming Episode/Reel)</label>
                          </div>
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
                        {(editingStoryId || editingMovieId || editingVideoId) ? `UPDATE \${activeTab === 'stories' ? 'STORY' : activeTab === 'movies' ? 'MOVIE' : 'VIDEO'}` : (activeTab === 'videos' && videosUploadType === 'quiz' ? 'PUBLISH QUIZ QUESTION' : activeTab === 'songs' ? 'PUBLISH SONG' : 'PUBLISH TO DIVINE LIBRARY')}
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
