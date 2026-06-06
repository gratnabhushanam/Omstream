const User = require('../models/User');

// Update profile parameters (PIN, name, kids mode, avatar)
exports.updateProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { name, avatar, pin, isKids } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const profile = user.profiles.id(profileId);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    if (name) profile.name = name;
    if (avatar !== undefined) profile.avatar = avatar;
    if (pin !== undefined) profile.pin = pin || null; // 4-digit code or null to disable
    if (isKids !== undefined) profile.isKids = !!isKids;

    user.markModified('profiles');
    await user.save();

    res.json({ message: 'Profile updated successfully', profiles: user.profiles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle favorites for a specific profile
exports.toggleFavorite = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { mediaId } = req.body;

    if (!mediaId) return res.status(400).json({ message: 'mediaId is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profile = user.profiles.id(profileId);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const index = profile.favorites.indexOf(mediaId);
    if (index > -1) {
      profile.favorites.splice(index, 1); // Remove
    } else {
      profile.favorites.push(mediaId); // Add
    }

    user.markModified('profiles');
    await user.save();

    res.json({ favorites: profile.favorites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update watch history and continue watching
exports.updateWatchHistory = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { mediaId, mediaType, progress, completed } = req.body;

    if (!mediaId || !mediaType) {
      return res.status(400).json({ message: 'mediaId and mediaType are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profile = user.profiles.id(profileId);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Update Watch History (Max 50 items)
    profile.watchHistory = profile.watchHistory.filter(h => h.mediaId !== mediaId);
    profile.watchHistory.unshift({
      mediaId,
      mediaType,
      progress: progress || 0,
      watchedAt: new Date()
    });

    if (profile.watchHistory.length > 50) {
      profile.watchHistory.pop();
    }

    // Update Continue Watching
    if (completed || progress >= 95) {
      // If completed or near completion, remove from continue watching
      profile.continueWatching = profile.continueWatching.filter(cw => cw.mediaId !== mediaId);
    } else {
      profile.continueWatching = profile.continueWatching.filter(cw => cw.mediaId !== mediaId);
      profile.continueWatching.unshift({
        mediaId,
        mediaType,
        progress: progress || 0,
        updatedAt: new Date()
      });

      if (profile.continueWatching.length > 20) {
        profile.continueWatching.pop();
      }
    }

    user.markModified('profiles');
    await user.save();

    res.json({ 
      watchHistory: profile.watchHistory, 
      continueWatching: profile.continueWatching 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify profile PIN
exports.verifyProfilePin = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { pin } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profile = user.profiles.id(profileId);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    if (!profile.pin) {
      return res.json({ success: true, message: 'Profile has no PIN configured' });
    }

    if (profile.pin === pin) {
      res.json({ success: true, message: 'PIN verification successful' });
    } else {
      res.status(401).json({ success: false, message: 'Incorrect PIN' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
