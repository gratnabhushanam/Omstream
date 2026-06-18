import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApiClient } from '../api/client';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function ManageProfile() {
  const { id } = useParams();
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotifications();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [pin, setPin] = useState('');
  const [isKids, setIsKids] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isNew && user) {
      const existing = user.profiles?.find(p => p._id === id);
      if (existing) {
        setName(existing.name || '');
        setAvatar(existing.avatar || '');
        setPin(existing.pin || '');
        setIsKids(existing.isKids || false);
      } else {
        navigate('/profiles');
      }
    }
  }, [id, isNew, user, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      if (isNew) {
        await authApiClient.post('/api/auth/profiles', {
          name, avatar, pin, isKids
        });
        showNotification('Profile created!', 'success');
      } else {
        await authApiClient.put(`/api/auth/profiles/${id}`, {
          name, avatar, pin, isKids
        });
        showNotification('Profile updated!', 'success');
      }
      
      const token = localStorage.getItem('token');
      await fetchUser(token); // Refresh user data to get new profiles
      navigate('/profiles');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;
    
    setIsLoading(true);
    try {
      await authApiClient.delete(`/api/auth/profiles/${id}`);
      showNotification('Profile deleted', 'success');
      const token = localStorage.getItem('token');
      await fetchUser(token);
      navigate('/profiles');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error deleting profile', 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white pt-24 px-6 md:px-12 font-inter">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/profiles')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Profiles
        </button>

        <h1 className="text-3xl md:text-4xl font-bold mb-10">{isNew ? 'Add Profile' : 'Edit Profile'}</h1>

        <form onSubmit={handleSave} className="space-y-8 bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <img 
                src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'New'}`} 
                alt="Avatar" 
                className="w-32 h-32 rounded-2xl object-cover border-4 border-devotion-gold/30"
              />
            </div>

            <div className="flex-1 w-full space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider font-bold">Profile Name</label>
                <input 
                  type="text" 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-devotion-gold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider font-bold">Avatar URL (Optional)</label>
                <input 
                  type="text" 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-devotion-gold"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider font-bold">Profile PIN (Optional)</label>
                <input 
                  type="password" 
                  maxLength="4"
                  className="w-full md:w-1/2 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-devotion-gold tracking-widest font-mono"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="4-digit PIN"
                />
                <p className="text-xs text-gray-500 mt-2">Enter a 4-digit PIN to lock this profile.</p>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input 
                  type="checkbox" 
                  id="isKids" 
                  className="w-5 h-5 accent-devotion-gold"
                  checked={isKids}
                  onChange={(e) => setIsKids(e.target.checked)}
                />
                <label htmlFor="isKids" className="text-white font-medium cursor-pointer">
                  Kids Mode (Restricts access to adult content)
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-8 border-t border-white/10">
            {!isNew ? (
              <button 
                type="button" 
                onClick={handleDelete}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-400/10 transition-colors"
              >
                <Trash2 className="w-5 h-5" /> Delete Profile
              </button>
            ) : <div></div>}

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => navigate('/profiles')}
                className="px-6 py-3 rounded-xl text-gray-300 border border-white/10 hover:bg-white/5 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isLoading || !name.trim()}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-devotion-gold text-black hover:bg-yellow-400 transition-colors font-bold disabled:opacity-50"
              >
                <Save className="w-5 h-5" /> {isLoading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
