import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Sparkles, ArrowLeft, CheckCircle, CreditCard, QrCode, ShieldCheck } from 'lucide-react';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshSubscription } = useSubscription();

  const tier = searchParams.get('tier') || 'basic';
  const cycle = searchParams.get('cycle') || 'monthly';

  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { returnTo: `/payment?tier=${tier}&cycle=${cycle}` } });
      return;
    }

    const fetchPaymentDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const res = await axios.post(
          '/api/create-payment-link',
          { tier, billingCycle: cycle },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPaymentData(res.data);
      } catch (err) {
        console.error('Error creating payment link:', err);
        setError(err.response?.data?.message || 'Failed to initialize payment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [tier, cycle, user, navigate]);

  const handleRazorpayCheckout = async () => {
    if (!paymentData) return;

    setVerifying(true);
    try {
      const isRazorpayLoaded = await loadRazorpay();
      if (!isRazorpayLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const token = localStorage.getItem('token');
      const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey123';

      const options = {
        key: keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Gita Wisdom Devotion',
        description: `Plan: ${tier.toUpperCase()}`,
        order_id: paymentData.orderId.startsWith('order_sub_dummy') ? undefined : paymentData.orderId,
        handler: async (response) => {
          try {
            setVerifying(true);
            await axios.post(
              '/api/verify-payment',
              {
                razorpay_order_id: response.razorpay_order_id || paymentData.orderId,
                razorpay_payment_id: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
                razorpay_signature: response.razorpay_signature || 'mock_sig',
                transactionId: paymentData.transactionId
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            await refreshSubscription();
            navigate('/subscription/success', { state: { tier } });
          } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please contact support.');
          } finally {
            setVerifying(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: '#f59e0b'
        },
        modal: {
          ondismiss: () => {
            setVerifying(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message || 'Razorpay checkout error.');
      setVerifying(false);
    }
  };

  const simulateSuccess = async () => {
    if (!paymentData) return;
    setVerifying(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/verify-payment',
        {
          razorpay_order_id: paymentData.orderId,
          razorpay_payment_id: `pay_upi_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature',
          transactionId: paymentData.transactionId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await refreshSubscription();
      navigate('/subscription/success', { state: { tier } });
    } catch (err) {
      setError(err.response?.data?.message || 'Simulation verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060e1c] text-white">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">Generating Payment Details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#060e1c] relative overflow-hidden px-4 py-8">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full opacity-25"
          style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/subscription')}
          className="mb-6 inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Plans
        </button>

        <div className="rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 bg-zinc-950/80 backdrop-blur-2xl text-center space-y-6">
          <div>
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 text-2xl font-bold mb-2">🕉️</span>
            <h2 className="text-2xl font-black text-white capitalize">{tier} Plan Payment</h2>
            <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">Gitawisdom Secure checkout</p>
          </div>

          {error && (
            <div className="bg-rose-950/30 border border-rose-900 text-rose-300 rounded-2xl p-4 text-sm font-semibold">
              {error}
            </div>
          )}

          {verifying && (
            <div className="bg-amber-950/30 border border-amber-900 text-amber-300 rounded-2xl p-4 text-sm font-semibold animate-pulse">
              Verifying transaction status, please wait...
            </div>
          )}

          {/* Payment Link / QR Code Panel */}
          {paymentData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border border-white/10 rounded-2xl p-5 bg-white/5">
              {/* QR Panel */}
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-white p-3 rounded-2xl inline-block">
                  <img
                    src={paymentData.qrCodeUrl}
                    alt="UPI QR Code"
                    className="w-40 h-40"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-white flex items-center justify-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" /> Scan to Pay
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Use GPay, PhonePe, or Paytm</p>
                </div>
              </div>

              {/* Details & Button Panel */}
              <div className="text-left space-y-4">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Price:</span>
                    <span className="font-extrabold text-amber-400 text-base">₹{paymentData.amount / 100}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Billing Cycle:</span>
                    <span className="font-bold text-white capitalize">{cycle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Currency:</span>
                    <span className="font-bold text-white">INR</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleRazorpayCheckout}
                    disabled={verifying}
                    className="w-full py-3 rounded-xl font-bold bg-amber-400 text-zinc-950 hover:bg-amber-300 active:scale-98 transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                  >
                    <CreditCard className="w-4 h-4" /> Pay with Card / Netbanking
                  </button>

                  <button
                    onClick={simulateSuccess}
                    disabled={verifying}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white active:scale-98 transition"
                  >
                    Simulate Payment Success (Demo)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Trust indicators */}
          <div className="pt-2 flex items-center justify-center gap-4 text-zinc-500 text-xs font-medium">
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Payments</span>
            <span>•</span>
            <span>Powered by Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
