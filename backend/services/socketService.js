const { Server } = require('socket.io');

let io = null;
const userSockets = new Map(); // Maps userId -> Set of socketIds

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Simple bypass or matching server.js origins
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    // Join room or authenticate user
    socket.on('authenticate', (userId) => {
      if (userId) {
        socket.userId = String(userId);
        if (!userSockets.has(socket.userId)) {
          userSockets.set(socket.userId, new Set());
        }
        userSockets.get(socket.userId).add(socket.id);
        socket.join(socket.userId);
        console.log(`[SOCKET] Authenticated user ${userId} on socket ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
      if (socket.userId && userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id);
        if (userSockets.get(socket.userId).size === 0) {
          userSockets.delete(socket.userId);
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

/**
 * Sends a real-time notification to a specific user
 * @param {string} userId - The user ID
 * @param {string} event - Event name (e.g. 'notification', 'device_request_update')
 * @param {Object} data - Payload
 */
const sendRealtimeEvent = (userId, event, data) => {
  if (io && userId) {
    io.to(String(userId)).emit(event, data);
    console.log(`[SOCKET] Emitted event "${event}" to user ${userId}`);
  }
};

/**
 * Broadcasts an event to ALL connected clients
 * @param {string} event - Event name (e.g. 'content_updated')
 * @param {Object} data - Payload
 */
const broadcastEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
    console.log(`[SOCKET] Broadcasted global event "${event}"`);
  }
};

module.exports = {
  initSocket,
  getIO,
  sendRealtimeEvent,
  broadcastEvent
};
