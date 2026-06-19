export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://gitawisdom.onrender.com',
  API_KEY: String(import.meta.env.VITE_APP_API_KEY || import.meta.env.VITE_PERMANENT_API_KEY || 'spiritual-wisdom-permanent-key-2025').trim(),
};

export const API_ORIGIN = ENV.API_BASE_URL;
