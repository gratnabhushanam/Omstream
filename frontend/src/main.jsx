import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import './styles/mobile.css'

const isProd = import.meta.env.MODE === 'production';
// In dev, use '' so requests go through Vite proxy → localhost:8888
// In prod, use the deployed backend URL
axios.defaults.baseURL = isProd 
  ? (import.meta.env.VITE_API_BASE_URL || 'https://gita-wisdom-1.onrender.com') 
  : '';

const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem('gita_wisdom_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('gita_wisdom_device_id', deviceId);
  }
  return deviceId;
};

const getDeviceName = () => {
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  if (ua.indexOf('Win') !== -1) os = 'Windows';
  else if (ua.indexOf('Mac') !== -1) os = 'macOS';
  else if (ua.indexOf('Linux') !== -1) os = 'Linux';
  else if (ua.indexOf('Android') !== -1) os = 'Android';
  else if (ua.indexOf('like Mac') !== -1) os = 'iOS';

  let browser = 'Unknown Browser';
  if (ua.indexOf('Chrome') !== -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') !== -1) browser = 'Safari';
  else if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (ua.indexOf('Edge') !== -1) browser = 'Edge';
  
  return `${os} - ${browser}`;
};

// Interceptor to ensure app api key and auth token are set natively
axios.interceptors.request.use((config) => {
  const apiKey = import.meta.env.VITE_APP_API_KEY || 'Gita@2026';
  config.headers['x-api-key'] = apiKey;
  config.headers['x-device-id'] = getOrCreateDeviceId();
  config.headers['x-device-name'] = getDeviceName();
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Global Shield: Intercept and destroy sneaky HTML responses from Vercel
axios.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.toLowerCase().includes('<!doctype html>')) {
      return Promise.reject(new Error("API returned HTML instead of JSON. Backend might be unreachable."));
    }
    return response;
  },
  (error) => Promise.reject(error)
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
