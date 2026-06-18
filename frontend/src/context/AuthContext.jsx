/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { authApiClient } from '../api/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('gita_wisdom_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const savedProfile = localStorage.getItem('gita_wisdom_profile');
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          axios.defaults.headers.common['x-profile-id'] = profile._id;
          authApiClient.defaults.headers.common['x-profile-id'] = profile._id;
        } catch {}
      }
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const { data } = await authApiClient.get('/api/auth/profile');
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to fetch user', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('gita_wisdom_profile');
      setUser(null);
      setSelectedProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    const userData = data.user || data;
    localStorage.setItem('token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(userData);
    return data;
  };

  const register = async (name, email, phoneNumber, password) => {
    const { data } = await axios.post('/api/auth/register', { name, email, phoneNumber, password });
    return data;
  };

  const verifyRegisterOtp = async (email, otp) => {
    const { data } = await axios.post('/api/auth/register/verify-otp', { email, otp });
    const { token, ...rest } = data;
    const userData = rest.user || rest;
    localStorage.setItem('token', token);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    return data;
  };

  const resendRegisterOtp = async (email) => {
    const { data } = await axios.post('/api/auth/register/resend-otp', { email });
    return data;
  };

  const sendOtpLogin = async (payload) => {
    const { data } = await axios.post('/api/auth/send-otp', payload);
    return data;
  };

  const verifyOtpLogin = async (payload) => {
    const { data } = await axios.post('/api/auth/verify-otp', payload);
    const userData = data.user || data;
    localStorage.setItem('token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(userData);
    return data;
  };

  const selectProfile = (profile) => {
    setSelectedProfile(profile);
    if (profile) {
      localStorage.setItem('gita_wisdom_profile', JSON.stringify(profile));
      axios.defaults.headers.common['x-profile-id'] = profile._id;
      authApiClient.defaults.headers.common['x-profile-id'] = profile._id;
    } else {
      localStorage.removeItem('gita_wisdom_profile');
      delete axios.defaults.headers.common['x-profile-id'];
      delete authApiClient.defaults.headers.common['x-profile-id'];
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('gita_wisdom_profile');
    setUser(null);
    setSelectedProfile(null);
  };

  const logoutAll = async () => {
    try {
      await axios.post('/api/auth/logout-all');
    } catch (error) {
      console.error('Logout all devices error', error);
    }
    logout();
  };

  const value = {
    user,
    loading,
    selectedProfile,
    selectProfile,
    login,
    register,
    verifyRegisterOtp,
    resendRegisterOtp,
    sendOtpLogin,
    verifyOtpLogin,
    logout,
    logoutAll,
    setUser,
    fetchUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
