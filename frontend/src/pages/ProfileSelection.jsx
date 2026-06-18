import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Check, Lock, Settings } from 'lucide-react';
import { authApiClient } from '../api/client';

export default function ProfileSelection() {
  const { user, selectedProfile, selectProfile, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState(user?.profiles || []);
  const [isEditing, setIsEditing] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetProfile, setTargetProfile] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (selectedProfile && !isEditing && !showPinModal) {
      // If a profile is already selected and we just came to this page manually, 
      // let them stay here to switch profiles. But if they just logged in, they hit this.
    }
  }, [user, navigate, selectedProfile]);

  useEffect(() => {
    if (user && user.profiles) {
      setProfiles(user.profiles);
    }
  }, [user]);

  const handleProfileClick = (profile) => {
    if (isEditing) {
      navigate(`/manage-profiles/${profile._id}`);
      return;
    }

    if (profile.pin) {
      setTargetProfile(profile);
      setShowPinModal(true);
      setPinInput('');
      setPinError('');
    } else {
      selectProfile(profile);
      navigate(profile.isKids ? '/kids' : '/home');
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!targetProfile || !pinInput) return;
    
    setIsLoading(true);
    setPinError('');
    try {
      const { data } = await authApiClient.post(`/api/auth/profiles/${targetProfile._id}/verify-pin`, { pin: pinInput });
      if (data.success) {
        setShowPinModal(false);
        selectProfile(targetProfile);
        navigate(targetProfile.isKids ? '/kids' : '/home');
      } else {
        setPinError('Incorrect PIN');
      }
    } catch (err) {
      setPinError(err.response?.data?.message || 'Incorrect PIN');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col items-center justify-center font-inter relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-devotion-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="z-10 text-center w-full max-w-4xl px-4"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-white">
          Who's watching?
        </h1>

        <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-16">
          {profiles.map((profile, idx) => (
            <motion.div 
              key={profile._id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="group relative flex flex-col items-center cursor-pointer w-28 md:w-36"
              onClick={() => handleProfileClick(profile)}
            >
              <div className="relative w-28 h-28 md:w-36 md:h-36 mb-4">
                <img 
                  src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} 
                  alt={profile.name} 
                  className={`w-full h-full rounded-2xl object-cover transition-all duration-300 ${isEditing ? 'opacity-50 blur-[2px]' : 'group-hover:ring-4 group-hover:ring-devotion-gold group-hover:scale-105'}`}
                />
                
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Edit2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}

                {profile.pin && !isEditing && (
                  <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/80 flex items-center justify-center backdrop-blur-sm shadow-lg border border-white/10">
                    <Lock className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </div>
              <h3 className={`text-lg font-medium transition-colors ${isEditing ? 'text-gray-400' : 'text-gray-300 group-hover:text-white'}`}>
                {profile.name}
              </h3>
            </motion.div>
          ))}

          {/* Add Profile Button */}
          {profiles.length < 5 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: profiles.length * 0.1, duration: 0.4 }}
              className="group flex flex-col items-center cursor-pointer w-28 md:w-36"
              onClick={() => navigate('/manage-profiles/new')}
            >
              <div className="w-28 h-28 md:w-36 md:h-36 mb-4 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center transition-all duration-300 group-hover:border-white group-hover:bg-white/5">
                <Plus className="w-12 h-12 text-gray-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-medium text-gray-500 group-hover:text-white transition-colors">
                Add Profile
              </h3>
            </motion.div>
          )}
        </div>

        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="px-8 py-3 rounded-full border border-gray-600 text-gray-300 hover:text-white hover:border-white transition-all font-medium tracking-wide flex items-center gap-2 mx-auto"
        >
          {isEditing ? <Check className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
          {isEditing ? 'Done' : 'Manage Profiles'}
        </button>
      </motion.div>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#151A27] rounded-3xl p-8 max-w-sm w-full border border-white/10 shadow-2xl text-center"
            >
              <Lock className="w-12 h-12 text-devotion-gold mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Profile Lock</h3>
              <p className="text-gray-400 text-sm mb-6">Enter your 4-digit PIN to access {targetProfile?.name}'s profile.</p>
              
              <form onSubmit={handlePinSubmit}>
                <input 
                  type="password"
                  maxLength="4"
                  autoFocus
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-center text-3xl tracking-[1em] text-white focus:outline-none focus:border-devotion-gold transition-colors mb-4"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                />
                
                {pinError && <p className="text-red-500 text-sm mb-4">{pinError}</p>}

                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowPinModal(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={pinInput.length < 4 || isLoading}
                    className="flex-1 py-3 rounded-xl bg-devotion-gold text-black font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '...' : 'Enter'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
