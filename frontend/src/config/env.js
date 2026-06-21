const configuredUrl = import.meta.env.VITE_API_BASE_URL;
const isProd = import.meta.env.MODE === 'production';
const finalBaseUrl = (isProd && configuredUrl && configuredUrl.includes('localhost')) 
  ? 'https://gitawisdom.onrender.com' 
  : (configuredUrl || (isProd ? 'https://gitawisdom.onrender.com' : 'http://localhost:8888'));

export const ENV = {
  API_BASE_URL: finalBaseUrl,
  API_KEY: String(import.meta.env.VITE_APP_API_KEY || import.meta.env.VITE_PERMANENT_API_KEY || 'spiritual-wisdom-permanent-key-2025').trim(),
};

export const API_ORIGIN = ENV.API_BASE_URL;
