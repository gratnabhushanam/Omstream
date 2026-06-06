const { User, AccessRequest, Notification } = require('../models');
const { sendRealtimeEvent } = require('../services/socketService');

// Retrieve all active devices for the authenticated user
exports.getDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ devices: user.devices || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remotely disconnect/remove a device
exports.removeDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = await User.findById(req.user.id);

    // Remove the device from the list
    const originalLength = user.devices.length;
    user.devices = user.devices.filter(d => d.deviceId !== deviceId);

    if (user.devices.length === originalLength) {
      return res.status(404).json({ message: 'Device not found' });
    }

    await user.save();

    // Create system notification
    const notification = await Notification.create({
      userId: String(user._id),
      type: 'system',
      title: 'Device Removed',
      message: `A device was removed from your account remotely.`
    });

    // Notify all active sessions via socket
    sendRealtimeEvent(user._id, 'notification', notification);
    sendRealtimeEvent(user._id, 'device_removed', { deviceId });

    res.json({ message: 'Device removed successfully', devices: user.devices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve pending device access requests for the logged-in owner
exports.getDeviceRequests = async (req, res) => {
  try {
    const requests = await AccessRequest.find({ 
      userId: req.user.id, 
      status: 'pending' 
    }).sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve access request
exports.approveDeviceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await AccessRequest.findById(id);

    if (!request || String(request.userId) !== String(req.user.id)) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    const user = await User.findById(req.user.id);

    // If still limit reached, reject approval (must replace instead)
    if (user.devices.length >= 3) {
      return res.status(400).json({ 
        message: 'Maximum device limit reached. Choose a device to replace.' 
      });
    }

    // Mark request as approved
    request.status = 'approved';
    await request.save();

    // Push new device details
    user.devices.push({
      deviceId: request.deviceId,
      deviceName: request.deviceName,
      osVersion: request.osVersion,
      browserVersion: request.browserVersion,
      ipAddress: request.ipAddress,
      lastLogin: new Date()
    });
    await user.save();

    // Log Notification
    await Notification.create({
      userId: String(user._id),
      type: 'system',
      title: 'New Device Approved',
      message: `New device "${request.deviceName}" was approved to access your account.`
    });

    // Notify requesting device
    sendRealtimeEvent(user._id, 'device_request_update', {
      deviceId: request.deviceId,
      status: 'approved',
      message: 'Access approved!'
    });

    res.json({ message: 'Request approved successfully', devices: user.devices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deny access request
exports.denyDeviceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await AccessRequest.findById(id);

    if (!request || String(request.userId) !== String(req.user.id)) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    request.status = 'denied';
    await request.save();

    // Notify requesting device
    sendRealtimeEvent(req.user.id, 'device_request_update', {
      deviceId: request.deviceId,
      status: 'denied',
      message: 'Access denied by account owner.'
    });

    res.json({ message: 'Request denied successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Replace device with requesting one
exports.replaceDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { replaceDeviceId } = req.body; // deviceId to remove
    
    if (!replaceDeviceId) {
      return res.status(400).json({ message: 'Device to replace is required' });
    }

    const request = await AccessRequest.findById(id);
    if (!request || String(request.userId) !== String(req.user.id)) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    const user = await User.findById(req.user.id);

    // Remove old device
    user.devices = user.devices.filter(d => d.deviceId !== replaceDeviceId);

    // Add new device
    user.devices.push({
      deviceId: request.deviceId,
      deviceName: request.deviceName,
      osVersion: request.osVersion,
      browserVersion: request.browserVersion,
      ipAddress: request.ipAddress,
      lastLogin: new Date()
    });

    // Save request status
    request.status = 'replaced';
    request.replaceDeviceId = replaceDeviceId;
    await request.save();
    await user.save();

    // Log notification
    await Notification.create({
      userId: String(user._id),
      type: 'system',
      title: 'Device Replaced',
      message: `Device "${request.deviceName}" replaced an older device.`
    });

    // Notify old device that it has been disconnected
    sendRealtimeEvent(user._id, 'device_removed', { deviceId: replaceDeviceId });

    // Notify new device that it is approved
    sendRealtimeEvent(user._id, 'device_request_update', {
      deviceId: request.deviceId,
      status: 'approved',
      message: 'Access approved (replaced old device)!'
    });

    res.json({ message: 'Device replaced successfully', devices: user.devices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check status of device request (public polling endpoint)
exports.checkRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await AccessRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status === 'approved' || request.status === 'replaced') {
      const user = await User.findById(request.userId);
      const jwt = require('jsonwebtoken');
      
      const generateToken = (userId) => {
        const secret = String(process.env.JWT_SECRET || 'gita_wisdom_super_secret_key').trim();
        return jwt.sign({ id: userId }, secret, { expiresIn: '30d' });
      };

      const sanitizeUserForResponse = (u) => {
        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          subscriptionStatus: u.subscriptionStatus,
          trialEndDate: u.trialEndDate,
          devices: u.devices || [],
          profiles: u.profiles || []
        };
      };

      return res.json({
        status: request.status,
        token: generateToken(user._id),
        user: sanitizeUserForResponse(user)
      });
    }

    res.json({ status: request.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
