import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const { user, fetchUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      const res = await axios.get('/api/subscription/plans');
      setPlans(res.data);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (token) {
        const res = await axios.get('/api/subscription/current', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubscription(res.data.subscription);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSubscription();
      if (!plans) {
        fetchPlans();
      }
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const tier = subscription?.tier || 'free';
  const features = subscription?.features || {};
  const status = subscription?.status || 'trial';

  const hasTier = (minTier) => {
    const hierarchy = { free: 0, basic: 1, premium: 2 };
    const currentRank = hierarchy[tier] || 0;
    const requiredRank = hierarchy[minTier] || 0;
    return currentRank >= requiredRank;
  };

  const hasFeature = (name) => {
    if (!features) return false;
    return !!features[name];
  };

  const refreshSubscription = async () => {
    const token = localStorage.getItem('token');
    if (token && fetchUser) {
      try {
        await fetchUser(token);
      } catch (err) {
        console.error('Error refreshing user profiles during sub sync:', err);
      }
    }
    await fetchSubscription();
    await fetchPlans();
  };

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      tier,
      features,
      status,
      plans,
      loading,
      hasTier,
      hasFeature,
      refreshSubscription
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
