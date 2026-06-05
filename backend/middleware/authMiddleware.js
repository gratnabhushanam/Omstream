const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');

const resolveJwtSecret = () => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (secret) {
    return secret;
  }

  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
    return null;
  }

  return 'gita_wisdom_super_secret_key';
};

const checkAndRegisterDevice = async (user, headers) => {
  if (user.role === 'admin') return true;
  const deviceId = headers['x-device-id'];
  const deviceName = headers['x-device-name'] || 'Unknown Device';

  if (!deviceId) return true;

  const isDeviceRegistered = user.devices.some(d => d.deviceId === deviceId);
  if (!isDeviceRegistered) {
    if (user.devices.length >= 3) {
      return false;
    }
    user.devices.push({ deviceId, deviceName, lastLogin: new Date() });
    await user.save();
  } else {
    // Update last login asynchronously (fire-and-forget) to prevent blocking the API response
    user.constructor.updateOne(
      { _id: user._id, "devices.deviceId": deviceId },
      { $set: { "devices.$.lastLogin": new Date() } }
    ).catch(err => console.error('Device lastLogin update failed:', err.message));
  }
  return true;
};

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const jwtSecret = resolveJwtSecret();
      if (!jwtSecret) {
        return res.status(500).json({ message: 'Server auth configuration error' });
      }

      const decoded = jwt.verify(token, jwtSecret);
      req.user = await authController.getUserByIdForAuth(decoded.id);

      if (!req.user) {
         return res.status(401).json({ message: 'User not found' });
      }

      // Check trial expiration automatically on request
      if (req.user.subscriptionStatus === 'Trial Active' && req.user.trialEndDate && new Date() > req.user.trialEndDate) {
        req.user.subscriptionStatus = 'Trial Expired';
        await req.user.save();
      }

      // Enforce device limit
      const allowed = await checkAndRegisterDevice(req.user, req.headers);
      if (!allowed) {
        return res.status(403).json({ message: "Maximum device limit reached. This account can be used on up to 3 devices only." });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin, checkAndRegisterDevice };
