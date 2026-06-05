/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

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
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const { data } = await axios.get('/api/auth/profile');
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to fetch user', error);
      localStorage.removeItem('token');
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
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return data;
  };

  const register = async (name, email, phoneNumber, password) => {
    const { data } = await axios.post('/api/auth/register', { name, email, phoneNumber, password });
    return data;
  };

  const verifyRegisterOtp = async (email, otp) => {
    const { data } = await axios.post('/api/auth/register/verify-otp', { email, otp });
    const userData = data.user || data;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userData));
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
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user)); // Note: unified payload
    setUser(data.user);
    return data;
  };

  const selectProfile = (profile) => {
    setSelectedProfile(profile);
    if (profile) {
      localStorage.setItem('gita_wisdom_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('gita_wisdom_profile');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('gita_wisdom_profile');
    setUser(null);
    setSelectedProfile(null);
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
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
