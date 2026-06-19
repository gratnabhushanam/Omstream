import { io } from 'socket.io-client';
import { ENV } from '../config/env';

// Create a single shared connection for the entire application
const BACKEND_URL = ENV.API_BASE_URL || window.location.origin;

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  withCredentials: true
});
