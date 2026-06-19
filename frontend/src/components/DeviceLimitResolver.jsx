import React, { useEffect, useState } from 'react';
import { Shield, Sparkles, Monitor, KeyRound, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { socket } from '../services/socket';

export default function DeviceLimitResolver({ deviceRequestId, onSuccess, onCancel }) {
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('A login request has been sent to your active devices. Please check notifications on your other logged-in screens.');

  useEffect(() => {
    if (!deviceRequestId) return;

    // 1. Setup real-time Socket.IO listener for instantaneous approval
    // 1. Use the shared singleton socket for instantaneous approval
    
    socket.on('connect', () => {
      // Connect requesting device to the global namespace or specific room
      socket.emit('join_device_request', deviceRequestId);
    });

    socket.on('device_request_update', (data) => {
      if (data.status === 'approved' || data.status === 'replaced') {
        // Fetch token details using polling endpoint for security
        checkStatus();
      } else if (data.status === 'denied') {
        setStatus('denied');
        setMessage('Your access request was denied by the account owner.');
      }
    });

    // 2. Setup periodic polling fallback (every 3 seconds)
    const checkStatus = async () => {
      try {
        const { data } = await axios.get(`/api/auth/device-requests/status/${deviceRequestId}`);
        if (data.status === 'approved' || data.status === 'replaced') {
          setStatus('approved');
          // Store token and user
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          // Invoke success callback
          if (onSuccess) {
            onSuccess(data);
          }
        } else if (data.status === 'denied') {
          setStatus('denied');
          setMessage('Your access request was denied by the account owner.');
        }
      } catch (err) {
        console.error('Error checking device request status:', err);
      }
    };

    const interval = setInterval(checkStatus, 3000);

    return () => {
      clearInterval(interval);
      socket.off('connect');
      socket.off('device_request_update');
    };
  }, [deviceRequestId, onSuccess]);

  return (
    <div className="bg-glass-premium backdrop-blur-3xl rounded-[2.5rem] border border-devotion-gold/30 p-8 sm:p-12 shadow-2xl max-w-lg mx-auto text-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.05),transparent_40%)]"></div>
      
      <div className="relative z-10 space-y-6">
        <div className="w-16 h-16 bg-devotion-gold/15 border border-devotion-gold/40 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
          <Shield className="w-8 h-8 text-devotion-gold" />
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-devotion-gold to-yellow-300">
            Device Limit Exceeded
          </h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-black">
            Concurrent limit: 3/3 active
          </p>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-5 text-left space-y-3">
          <p className="text-sm text-gray-200 leading-relaxed font-light">
            {message}
          </p>
          <div className="flex items-center gap-2.5 text-xs text-devotion-gold/80 font-medium pt-2 border-t border-white/5">
            <Monitor className="w-4 h-4" />
            <span>Waiting for approval...</span>
          </div>
        </div>

        {status === 'denied' && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold rounded-xl p-3">
            Login Request Denied. Please contact the owner or try logging in again.
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-wider text-gray-300 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
