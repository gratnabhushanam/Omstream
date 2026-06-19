import { io } from 'socket.io-client';
import { ENV } from '../config/env';

// Use the explicit Render backend URL as fallback so Vercel does not try to proxy WebSockets
const BACKEND_URL = ENV.API_BASE_URL || 'https://gitawisdom.onrender.com';

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  withCredentials: true
});
