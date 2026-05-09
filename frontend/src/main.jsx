import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import './styles/mobile.css'

const isProd = import.meta.env.MODE === 'production';
axios.defaults.baseURL = isProd 
  ? 'https://gitawisdom.onrender.com' 
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888');

// Interceptor to ensure app api key is set natively if missing in env
axios.interceptors.request.use((config) => {
  const apiKey = import.meta.env.VITE_APP_API_KEY || 'Gita@2026';
  config.headers['x-api-key'] = apiKey;
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
