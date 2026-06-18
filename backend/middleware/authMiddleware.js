const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
const { User } = require('../models');

const resolveJwtSecret = () => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (secret) {
    return secret;
  }
  return 'gita_wisdom_super_secret_key';
};

const checkAndRegisterDevice = async (user, headers, ipAddress = '127.0.0.1') => {
  if (user.role === 'admin') return { allowed: true, limit: 99 };
  const deviceId = headers['x-device-id'];
  const deviceName = headers['x-device-name'] || 'Unknown Device';
  const osVersion = headers['x-os-version'] || 'Unknown OS';
  const browserVersion = headers['x-browser-version'] || 'Unknown Browser';

  if (!deviceId) return { allowed: true, limit: 1 };

  const Subscription = require('../models/Subscription');
  const subscription = await Subscription.findOne({ userId: user._id });
  const maxDevices = (subscription && subscription.features && subscription.features.maxDevices) ? subscription.features.maxDevices : 1;

  const isDeviceRegistered = user.devices.some(d => d.deviceId === deviceId);
  if (!isDeviceRegistered) {
    if (user.devices.length >= maxDevices) {
      const { AccessRequest, Notification } = require('../models');
      const { sendRealtimeEvent } = require('../services/socketService');

      // Create or locate a pending access request
      let request = await AccessRequest.findOne({ userId: user._id, deviceId, status: 'pending' });
      if (!request) {
        request = await AccessRequest.create({
          userId: user._id,
          deviceId,
          deviceName,
          osVersion,
          browserVersion,
          ipAddress,
          location: headers['x-device-location'] || 'India',
          status: 'pending'
        });
      }

      // Notify owner via system notifications list
      await Notification.create({
        userId: String(user._id),
        type: 'system',
        title: 'New Device Request',
        message: `Device "${deviceName}" is requesting access to your account.`
      });

      // Emit real-time owner socket event
      sendRealtimeEvent(user._id, 'new_device_request', {
        deviceRequestId: request._id,
        deviceName,
        osVersion,
        browserVersion,
        ipAddress,
        location: request.location,
        createdAt: request.createdAt
      });

      return { allowed: false, deviceRequestId: request._id, limit: maxDevices };
    }

    // Push new device details
    user.devices.push({
      deviceId,
      deviceName,
      osVersion,
      browserVersion,
      ipAddress,
      lastLogin: new Date()
    });
    await user.save();
  } else {
    // Update last login details asynchronously
    User.updateOne(
      { _id: user._id, "devices.deviceId": deviceId },
      { 
        $set: { 
          "devices.$.lastLogin": new Date(),
          "devices.$.osVersion": osVersion,
          "devices.$.browserVersion": browserVersion,
          "devices.$.ipAddress": ipAddress
        } 
      }
    ).catch(err => console.error('Device lastLogin update failed:', err.message));
  }
  return { allowed: true, limit: maxDevices };
};

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const jwtSecret = resolveJwtSecret();
      if (!jwtSecret) {
        return res.status(500).json({ message: 'Server auth configuration error' });
      }

      const decoded = jwt.verify(token, jwtSecret);
      req.user = await authController.getUserByIdForAuth(decoded.id);

      if (!req.user) {
         return res.status(401).json({ message: 'User not found' });
      }

      // Load subscription
      const Subscription = require('../models/Subscription');
      let subscription = await Subscription.findOne({ userId: req.user._id });
      if (!subscription) {
        // Create free trial sub on the fly
        const { PLANS } = require('../controllers/subscriptionController');
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + PLANS.free.trialDays);
        subscription = await Subscription.create({
          userId: req.user._id,
          tier: 'free',
          billingCycle: 'none',
          status: 'trial',
          trialStartDate: new Date(),
          trialEndDate,
          features: PLANS.free.features
        });
      }
      req.subscription = subscription;

      // Check trial expiration automatically on request
      if (req.user.subscriptionStatus === 'Trial Active' && req.user.trialEndDate && new Date() > req.user.trialEndDate) {
        req.user.subscriptionStatus = 'Trial Expired';
        await req.user.save();
      }

      // Enforce device limit
      const checkResult = await checkAndRegisterDevice(req.user, req.headers, req.ip || req.connection.remoteAddress);
      if (!checkResult.allowed) {
        return res.status(403).json({ 
          status: 'device_limit_reached',
          deviceRequestId: checkResult.deviceRequestId,
          message: `Maximum device limit reached. Your plan allows up to ${checkResult.limit} device(s).` 
        });
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
