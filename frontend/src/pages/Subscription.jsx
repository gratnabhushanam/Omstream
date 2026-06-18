import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import PlanCard from '../components/subscription/PlanCard';
import PlanToggle from '../components/subscription/PlanToggle';
import FeatureCompare from '../components/subscription/FeatureCompare';
import { Sparkles, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/subscription.css';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Subscription() {
  const { plans, subscription, tier: currentTier, refreshSubscription } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [checkoutDetails, setCheckoutDetails] = useState(null);

  // Accordion state
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { q: 'How many profiles can I create?', a: 'Sadhak (Free) supports 1 profile. Sevak (Silver) supports 2, Bhakt (Gold) supports 3, and Param Bhakt (Diamond) supports up to 5 profiles.' },
    { q: 'Can I watch movies on the Silver plan?', a: 'Silver plan users can watch previews of premium films. For full movie library access, you will need a Gold (Bhakt) or Diamond (Param Bhakt) tier.' },
    { q: 'How does the device limit work?', a: 'The system monitors concurrent devices. Depending on your tier, you can log in on 1, 2, 3, or up to 5 devices simultaneously.' },
    { q: 'Can I cancel my subscription anytime?', a: 'Yes. You can cancel auto-renewal in your Profile settings at any time. Your benefits will continue until the end of your billing cycle.' }
  ];

  const handleSelectPlan = async (selectedTier) => {
    if (!user) {
      navigate('/login', { state: { returnTo: '/subscription' } });
      return;
    }

    if (selectedTier === currentTier) return;

    if (selectedTier === 'free') {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        await axios.post(
          '/api/subscription/subscribe',
          { tier: 'free', billingCycle: 'none' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await refreshSubscription();
        navigate('/subscription/success', { state: { tier: 'free' } });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to activate free plan.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Redirect to the Payment page for paid plans (Basic, Premium)
    navigate(`/payment?tier=${selectedTier}&cycle=${billingCycle}`);
  };

  if (!plans) {
    return (
      <div className="subscription-container flex items-center justify-center">
        <div className="text-zinc-400 text-lg">Loading plans...</div>
      </div>
    );
  }

  const activeTiers = Object.keys(plans);

  return (
    <div className="subscription-container">
      <div className="subscription-hero">
        <h1 className="flex items-center justify-center gap-2">
          Unlock Divine Wisdom <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
        </h1>
        <p>Choose the subscription tier that matches your depth of learning and spiritual devotion.</p>
      </div>

      <PlanToggle value={billingCycle} onChange={setBillingCycle} />

      {error && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-center text-sm font-semibold">
          {error}
        </div>
      )}

      {loading && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-amber-950/40 border border-amber-800 text-amber-300 rounded-xl text-center text-sm font-semibold animate-pulse">
          Processing... please complete the payment details.
        </div>
      )}

      <div className="plan-grid">
        {activeTiers.map((t) => (
          <PlanCard
            key={t}
            plan={plans[t]}
            billingCycle={billingCycle}
            isCurrentPlan={currentTier === t}
            onSelect={handleSelectPlan}
            isSelected={false}
          />
        ))}
      </div>

      <FeatureCompare plans={plans} />

      {/* Accordion FAQ */}
      <div className="max-w-3xl mx-auto mt-20">
        <h3 className="text-2xl font-bold mb-8 text-center font-sans">Frequently Asked Questions</h3>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-zinc-900/30 border border-zinc-850 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center p-5 text-left font-bold text-zinc-200 hover:text-white transition"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {openFaq === idx && (
                <div className="p-5 pt-0 text-sm text-zinc-400 leading-relaxed border-t border-zinc-900 bg-zinc-950/30">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* UPI QR Payment Modal */}
      {showUpiModal && checkoutDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-[#0e1624] p-6 text-white text-center shadow-2xl space-y-6">
            <div>
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 text-2xl font-bold mb-2">🕉️</span>
              <h3 className="text-xl font-bold text-white">UPI QR Code Payment</h3>
              <p className="text-xs text-zinc-400 mt-1">Scan QR Code using any UPI App (GPay, PhonePe, Paytm)</p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-3 rounded-2xl inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `upi://pay?pa=gitawisdom@upi&pn=GitaWisdom&am=${checkoutDetails.amount / 100}&cu=INR&tn=Sub_${checkoutDetails.selectedTier}`
                )}`}
                alt="UPI QR Code"
                className="w-44 h-44"
              />
            </div>

            {/* Billing Details */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Plan:</span>
                <span className="font-bold text-white capitalize">{checkoutDetails.selectedTier} ({billingCycle})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">UPI ID:</span>
                <span className="font-mono text-xs text-amber-400 font-bold">gitawisdom@upi</span>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-2 text-base">
                <span className="font-semibold text-white">Amount:</span>
                <span className="font-extrabold text-amber-400">₹{checkoutDetails.amount / 100}</span>
              </div>
            </div>

            {/* Control buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    setShowUpiModal(false);
                    const token = localStorage.getItem('token');
                    await axios.post(
                      '/api/subscription/verify',
                      {
                        razorpay_order_id: checkoutDetails.orderId,
                        razorpay_payment_id: `pay_upi_${Date.now()}`,
                        razorpay_signature: 'mock_signature',
                        transactionId: checkoutDetails.transactionId
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );

                    await refreshSubscription();
                    navigate('/subscription/success', { state: { tier: checkoutDetails.selectedTier } });
                  } catch (err) {
                    setError(err.response?.data?.message || 'UPI Payment simulation failed.');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-[#0c1320] active:scale-98 transition"
              >
                Simulate Payment Success
              </button>
              <button
                onClick={() => {
                  setShowUpiModal(false);
                  setCheckoutDetails(null);
                  setError('Payment cancelled by user.');
                }}
                className="w-full py-2.5 rounded-xl font-bold text-zinc-400 hover:text-white transition text-xs"
              >
                Cancel Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
