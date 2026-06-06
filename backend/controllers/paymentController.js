const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

const initRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey123',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummysecret123',
  });
};

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', plan = 'Premium Annual' } = req.body;
    const userId = req.user.id;

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey123';
    
    // Bypass Razorpay API if using dummy keys
    if (keyId === 'rzp_test_dummykey123' || !process.env.RAZORPAY_KEY_SECRET) {
       console.log('[RAZORPAY] Dummy mode: Generating mock order');
       return res.json({ 
         orderId: `order_dummy_${Date.now()}`, 
         amount: amount * 100, 
         currency, 
         keyId 
       });
    }

    const instance = initRazorpay();

    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt: `receipt_order_${userId}_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        plan
      }
    };

    const order = await instance.orders.create(options);
    if (!order) {
      return res.status(500).json({ message: 'Error creating Razorpay order' });
    }

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId });
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};


exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummysecret123';

    // Verify signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      // Allow bypass in development if using dummy keys
      if (process.env.NODE_ENV !== 'development' && process.env.RAZORPAY_KEY_ID !== 'rzp_test_dummykey123') {
         return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
      } else {
         console.warn('Signature mismatch, but bypassing in development/dummy mode.');
      }
    }

    // Calculate end date based on plan notes
    // Fetch order details to know the plan if possible, but Razorpay verify doesn't give us order notes directly.
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey123';
    let planName = req.body.plan || 'Divine Annual'; // fallback or passed from frontend

    if (keyId !== 'rzp_test_dummykey123' && process.env.RAZORPAY_KEY_SECRET) {
      const instance = initRazorpay();
      try {
        const order = await instance.orders.fetch(razorpay_order_id);
        if (order.notes && order.notes.plan) {
          planName = order.notes.plan;
        }
      } catch (err) {
        console.error('Failed to fetch razorpay order for plan notes', err);
      }
    }
    
    const endDate = new Date();
    if (planName === 'Monthly Premium') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planName === 'Half-Yearly Premium') {
      endDate.setMonth(endDate.getMonth() + 6);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1); // Default to 1 year
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        subscriptionStatus: 'Subscription Active',
        trialEndDate: endDate // Storing end date here for simplicity
      },
      { new: true }
    );

    res.json({ message: 'Payment verified successfully', user: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      subscriptionStatus: updatedUser.subscriptionStatus,
      trialEndDate: updatedUser.trialEndDate
    }});
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
