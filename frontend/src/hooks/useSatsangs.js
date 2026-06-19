import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ENV } from '../config/env';

export const useSatsangs = () => {
  const { user, setUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [activeGroupPosts, setActiveGroupPosts] = useState([]);
  const [postContent, setPostContent] = useState('');
  const [newGroupForm, setNewGroupForm] = useState({ name: '', description: '', category: 'General' });
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data } = await axios.get(`${ENV.API_BASE_URL}/api/forum/groups`, { headers: { 'x-api-key': ENV.API_KEY } });
        setGroups(data);
        if (data.length > 0 && !activeGroupId) {
          setActiveGroupId(data[0]._id);
        }
      } catch (error) {
        console.error('Failed to fetch groups', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    if (activeGroupId) fetchPosts(activeGroupId);
  }, [activeGroupId]);

  const fetchPosts = async (groupId) => {
    try {
      const { data } = await axios.get(`${ENV.API_BASE_URL}/api/forum/groups/${groupId}/posts`, { headers: { 'x-api-key': ENV.API_KEY } });
      setActiveGroupPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts', error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${ENV.API_BASE_URL}/api/forum/groups`, newGroupForm, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'x-api-key': ENV.API_KEY
        }
      });
      setGroups([data, ...groups]);
      setShowCreateModal(false);
      setActiveGroupId(data._id);
      setNewGroupForm({ name: '', description: '', category: 'General' });
    } catch (error) {
      console.error('Group creation error:', error);
      alert('Failed to create group');
    }
  };

  const handleDeleteGroup = async (e, groupId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this community?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${ENV.API_BASE_URL}/api/forum/groups/${groupId}`, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'x-api-key': ENV.API_KEY
        }
      });
      setGroups(groups.filter(g => g._id !== groupId));
      if (activeGroupId === groupId) {
        setActiveGroupId(groups.find(g => g._id !== groupId)?._id || null);
      }
    } catch (error) {
      console.error('Group deletion error:', error);
      alert('Failed to delete group');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim() || !activeGroupId) return;
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${ENV.API_BASE_URL}/api/forum/groups/${activeGroupId}/posts`, {
        content: postContent
      }, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'x-api-key': ENV.API_KEY
        }
      });
      setActiveGroupPosts([data, ...activeGroupPosts]);
      setPostContent('');
    } catch (error) {
      console.error('Post creation error:', error);
      alert('Failed to post');
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.patch(`${ENV.API_BASE_URL}/api/forum/posts/${postId}/like`, {}, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'x-api-key': ENV.API_KEY
        }
      });
      setActiveGroupPosts((prev) => prev.map((p) => p._id === postId ? data : p));
    } catch (error) {
      console.error('Like error:', error);
      alert('Must be logged in to like');
    }
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${ENV.API_BASE_URL}/api/forum/posts/${postId}/comment`, { text }, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'x-api-key': ENV.API_KEY
        }
      });
      setActiveGroupPosts((prev) => prev.map((p) => p._id === postId ? data : p));
      setCommentInputs({ ...commentInputs, [postId]: '' });
      try {
        const pointsRes = await axios.post(`${ENV.API_BASE_URL}/api/auth/profile/points`, { points: 5 }, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'x-api-key': ENV.API_KEY
          }
        });
        if (pointsRes.data.user) {
          setUser(pointsRes.data.user);
        }
      } catch (err) {}
    } catch (error) {
      console.error('Comment error', error);
      alert('Failed to post comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Delete comment?')) return;
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.delete(`${ENV.API_BASE_URL}/api/forum/posts/${postId}/comment/${commentId}`, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'x-api-key': ENV.API_KEY
        }
      });
      setActiveGroupPosts((prev) => prev.map((p) => p._id === postId ? data : p));
    } catch (error) {
      console.error('Delete comment error', error);
      alert('Failed to delete comment');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${ENV.API_BASE_URL}/api/forum/posts/${postId}`, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'x-api-key': ENV.API_KEY
        }
      });
      setActiveGroupPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (error) {
      console.error('Delete post error', error);
      alert('Failed to delete post');
    }
  };

  const activeGroup = groups.find(g => g._id === activeGroupId);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  };

  return {
    user,
    groups,
    loading,
    showCreateModal,
    setShowCreateModal,
    activeGroupId,
    setActiveGroupId,
    activeGroupPosts,
    postContent,
    setPostContent,
    newGroupForm,
    setNewGroupForm,
    activeCommentsPostId,
    setActiveCommentsPostId,
    commentInputs,
    setCommentInputs,
    handleCreateGroup,
    handleDeleteGroup,
    handleCreatePost,
    handleLike,
    handleCommentSubmit,
    handleDeleteComment,
    handleDeletePost,
    activeGroup,
    getInitials
  };
};
