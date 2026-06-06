import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Check, ArrowRight, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const PLANS = [
  { id: 'free', name: 'Free Seeker Plan', price: 0, duration: 'Free / Trial', highlight: false, type: 'trial' },
  { id: 'monthly', name: 'Monthly Devotional', price: 99, duration: '1 Month', highlight: false, type: 'paid' },
  { id: 'quarterly', name: 'Quarterly Wisdom', price: 249, duration: '3 Months', highlight: false, type: 'paid' },
  { id: 'annual', name: 'Divine Annual', price: 899, duration: '1 Year', highlight: true, type: 'paid' },
  { id: 'family_premium', name: 'Premium Family Plan', price: 1499, duration: '1 Year (3 Profiles)', highlight: false, type: 'paid' },
];

export default function Subscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Default to Annual plan, unless unauthenticated (then default to Trial)
  const [selectedPlanId, setSelectedPlanId] = useState(user ? 'annual' : 'free');

  // If user is already logged in and has an active trial/subscription, they shouldn't be here
  React.useEffect(() => {
    if (user && (user.subscriptionStatus === 'Trial Active' || user.subscriptionStatus === 'Subscription Active' || user.role === 'admin')) {
      navigate('/kids');
    }
  }, [user, navigate]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAction = async () => {
    const selectedPlan = PLANS.find(p => p.id === selectedPlanId);

    // If unauthenticated or choosing trial, go to register
    if (!user || selectedPlan.type === 'trial') {
      navigate('/register', { state: { plan: selectedPlan.id } });
      return;
    }

    // Authenticated user paying for a plan
    const res = await loadRazorpayScript();
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // 1. Create order
      const { data: order } = await axios.post('/api/payments/create-order', {
        amount: selectedPlan.price,
        plan: selectedPlan.name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. Open Razorpay Checkout focused on UPI/QR
      const options = {
        key: order.keyId,
        amount: order.amount.toString(),
        currency: order.currency,
        name: 'Gita Wisdom',
        description: selectedPlan.name,
        order_id: order.orderId,
        handler: async function (response) {
          try {
            // 3. Verify payment
            const { data } = await axios.post('/api/payments/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan: selectedPlan.name
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            // Update local user state
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/kids'; // Force full reload to update context and route
          } catch (err) {
            alert('Payment verification failed!');
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: '#B66A2A' // devotion-gold
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      alert(error.response?.data?.message || 'Something went wrong initiating payment');
    }
  };

  const selectedPlanDetails = PLANS.find(p => p.id === selectedPlanId);

  return (
    <div className="min-h-screen pt-20 sm:pt-28 pb-12 px-4 sm:px-6 lg:px-8 relative bg-[#06101E] text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.06),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(122,46,46,0.15),transparent_30%)]"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl md:text-5xl font-serif font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-devotion-gold via-[#FFF2C8] to-devotion-gold mb-4 filter drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">
            Subscribe to Watch
          </h1>
          <p className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto font-light">
            Unlock complete access to divine wisdom and premium cinematic stories.
          </p>
        </div>

        <div className="bg-glass-premium backdrop-blur-3xl rounded-[2.5rem] border border-devotion-gold/20 p-6 md:p-10 shadow-2xl animate-slide-up">
          <h3 className="text-xl font-bold text-white mb-6">Select a plan</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {PLANS.map((plan) => {
              // Hide Trial plan if user is already logged in (they had their trial)
              if (user && plan.type === 'trial') return null;

              const isSelected = selectedPlanId === plan.id;
              
              return (
                <div 
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-300 ${isSelected ? 'bg-gradient-to-br from-devotion-gold/20 to-yellow-600/20 border-2 border-devotion-gold scale-105 shadow-[0_0_20px_rgba(255,215,0,0.2)]' : 'bg-white/5 border border-white/10 hover:border-white/30'}`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-devotion-gold text-devotion-darkBlue px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap">
                      Best Value
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-3 right-3 text-devotion-gold">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                  
                  <h4 className={`font-bold ${isSelected ? 'text-devotion-gold' : 'text-white'}`}>{plan.duration}</h4>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-2xl font-black text-white">₹{plan.price}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{plan.name}</p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/10 pt-6 mb-8">
            <h4 className="font-bold text-white mb-4">You will get:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['All Spiritual Content', 'Ad-free Experience', 'Max Video Quality: 4K (2160p)', 'Multiple Audio Languages', 'Download & Watch Offline'].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-devotion-gold/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-devotion-gold" />
                  </div>
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleAction}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-devotion-gold to-yellow-600 text-devotion-darkBlue font-black text-base uppercase tracking-[0.2em] hover:shadow-[0_0_40px_rgba(255,215,0,0.5)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
          >
            {selectedPlanDetails?.type === 'trial' ? (
              <>Start {selectedPlanDetails.duration} Free <ArrowRight className="w-5 h-5" /></>
            ) : (
              <>Continue with UPI / QR (PhonePe, GPay) <QrCode className="w-5 h-5" /></>
            )}
          </button>
          
          {selectedPlanDetails?.type !== 'trial' && (
            <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" /> 100% Secure Payments powered by Razorpay
            </p>
          )}
        </div>

        {!user && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-devotion-gold hover:text-white font-bold transition-colors">
                Login Here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
