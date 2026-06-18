const Razorpay = require('razorpay');
const crypto = require('crypto');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const PLANS = {
  free: {
    name: 'Free Plan', tier: 'free',
    pricing: { monthly: 0, annual: 0 },
    features: { maxDevices: 1, maxProfiles: 1, adFree: false, offlineDownload: false, maxQuality: '480p', aiChatLimit: 3, movieAccess: 'none', satsangAccess: false },
    trialDays: 0,
    description: 'Basic access to spiritual teachings',
    highlights: ['Daily Sloka', 'Limited Stories (5/day)', 'Basic Quizzes', '3 AI Mentor chats/day']
  },
  basic: {
    name: 'Basic Plan', tier: 'basic',
    pricing: { monthly: 19900, annual: 199900 }, // in paise: ₹199
    features: { maxDevices: 2, maxProfiles: 2, adFree: true, offlineDownload: false, maxQuality: '720p', aiChatLimit: 20, movieAccess: 'preview', satsangAccess: true },
    description: 'Essential content and full access',
    highlights: ['All Stories & Videos', 'Movie Previews', 'All Quizzes', '20 AI Mentor chats/day', 'Satsang Access']
  },
  premium: {
    name: 'Premium Plan', tier: 'premium',
    pricing: { monthly: 49900, annual: 499900 }, // in paise: ₹499
    features: { maxDevices: 5, maxProfiles: 5, adFree: true, offlineDownload: true, maxQuality: '4K', aiChatLimit: -1, movieAccess: 'full', satsangAccess: true },
    recommended: true,
    description: 'Ultimate spiritual experience',
    highlights: ['Everything in Basic', 'Full Movie Library', 'Unlimited AI Mentor', 'Offline Downloads', 'Ad-free experience', '4K Quality']
  }
};

const TIER_HIERARCHY = { free: 0, basic: 1, premium: 2 };

const initRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey123',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummysecret123',
  });
};

exports.PLANS = PLANS;
exports.TIER_HIERARCHY = TIER_HIERARCHY;

exports.getPlans = async (req, res) => {
  try {
    // Return plans with display prices
    const displayPlans = JSON.parse(JSON.stringify(PLANS));
    res.json(displayPlans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    let subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      // Auto-create a trial/free subscription
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + PLANS.free.trialDays);

      subscription = await Subscription.create({
        userId,
        tier: 'free',
        billingCycle: 'none',
        status: 'trial',
        trialStartDate: new Date(),
        trialEndDate,
        features: PLANS.free.features
      });
    }

    res.json({
      subscription,
      planDetails: PLANS[subscription.tier]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.subscribeToPlan = async (req, res) => {
  try {
    const { tier, billingCycle } = req.body;
    const userId = req.user.id;

    if (!PLANS[tier]) {
      return res.status(400).json({ message: 'Invalid tier specified' });
    }
    if (tier === 'free') {
      let subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        subscription = new Subscription({ userId });
      }
      subscription.tier = 'free';
      subscription.billingCycle = 'none';
      subscription.status = 'active';
      subscription.startDate = new Date();
      subscription.endDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
      subscription.features = PLANS.free.features;
      await subscription.save();

      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'Subscription Active',
        trialEndDate: subscription.endDate
      });

      return res.json({
        success: true,
        activated: true,
        message: 'Free Plan activated successfully',
        subscription
      });
    }

    if (!['monthly', 'quarterly', 'annual'].includes(billingCycle)) {
      return res.status(400).json({ message: 'Invalid billing cycle specified' });
    }

    const plan = PLANS[tier];
    const amountInPaise = plan.pricing[billingCycle];

    if (amountInPaise === 0) {
      return res.status(400).json({ message: 'Cannot subscribe to Free plan with payment' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey123';
    
    // Create pre-transaction
    const transaction = await Transaction.create({
      userId,
      amount: amountInPaise,
      currency: 'INR',
      status: 'created',
      planTier: tier,
      planCycle: billingCycle,
      planName: `${plan.name} - ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}`
    });

    if (keyId === 'rzp_test_dummykey123' || !process.env.RAZORPAY_KEY_SECRET) {
      console.log('[RAZORPAY] Dummy mode: Generating mock order for subscriptions');
      const mockOrderId = `order_sub_dummy_${Date.now()}`;
      transaction.razorpayOrderId = mockOrderId;
      await transaction.save();

      return res.json({
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId,
        transactionId: transaction._id
      });
    }

    const instance = initRazorpay();
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_sub_${transaction._id}`,
      notes: {
        userId: userId.toString(),
        transactionId: transaction._id.toString(),
        tier,
        billingCycle
      }
    };

    const order = await instance.orders.create(options);
    if (!order) {
      return res.status(500).json({ message: 'Error creating Razorpay order' });
    }

    transaction.razorpayOrderId = order.id;
    await transaction.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      transactionId: transaction._id
    });
  } catch (error) {
    console.error('Error in subscribeToPlan:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.verifyAndActivate = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = req.body;
    const userId = req.user.id;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummysecret123';

    // Verify signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      if (process.env.NODE_ENV !== 'production' && process.env.RAZORPAY_KEY_ID === 'rzp_test_dummykey123') {
        console.warn('Signature mismatch, bypassing in dummy mode');
      } else {
        return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
      }
    }

    // Find and update Transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction record not found' });
    }

    transaction.status = 'paid';
    transaction.razorpayPaymentId = razorpay_payment_id;
    await transaction.save();

    // Calculate end date based on billingCycle
    const startDate = new Date();
    const endDate = new Date();
    if (transaction.planCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (transaction.planCycle === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else if (transaction.planCycle === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Upsert user's subscription record
    const plan = PLANS[transaction.planTier];
    let subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      subscription = new Subscription({ userId });
    }

    subscription.tier = transaction.planTier;
    subscription.billingCycle = transaction.planCycle;
    subscription.status = 'active';
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.autoRenew = true;
    subscription.lastPaymentId = transaction._id;
    subscription.features = plan.features;
    await subscription.save();

    // Update the transaction record with subscription ID
    transaction.subscriptionId = subscription._id;
    await transaction.save();

    // Update user's legacy subscriptionStatus & trialEndDate for compatibility
    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: 'Subscription Active',
      trialEndDate: endDate
    });

    res.json({
      message: 'Subscription activated successfully',
      subscription,
      planDetails: plan
    });
  } catch (error) {
    console.error('Error in verifyAndActivate:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.upgradePlan = async (req, res) => {
  try {
    const { newTier, billingCycle } = req.body;
    const userId = req.user.id;

    if (!PLANS[newTier]) {
      return res.status(400).json({ message: 'Invalid tier specified' });
    }

    const subscription = await Subscription.findOne({ userId });
    if (!subscription || subscription.status !== 'active') {
      return res.status(400).json({ message: 'No active subscription found to upgrade' });
    }

    const currentRank = TIER_HIERARCHY[subscription.tier];
    const newRank = TIER_HIERARCHY[newTier];

    if (newRank <= currentRank) {
      return res.status(400).json({ message: 'Cannot upgrade to a lower or equal tier' });
    }

    // Simple pro-rata credit calculation:
    // Credit = (Remaining time / Total time) * current cost
    const now = new Date();
    const remainingTime = subscription.endDate - now;
    const totalTime = subscription.endDate - subscription.startDate;
    let credit = 0;

    if (remainingTime > 0 && totalTime > 0) {
      const currentPlan = PLANS[subscription.tier];
      const currentCost = currentPlan.pricing[subscription.billingCycle];
      credit = Math.floor((remainingTime / totalTime) * currentCost);
    }

    const newPlan = PLANS[newTier];
    const newCost = newPlan.pricing[billingCycle];
    let finalAmount = newCost - credit;
    if (finalAmount < 0) finalAmount = 0; // minimum amount is 0

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey123';
    const transaction = await Transaction.create({
      userId,
      amount: finalAmount,
      currency: 'INR',
      status: 'created',
      planTier: newTier,
      planCycle: billingCycle,
      planName: `${newPlan.name} - ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)} (Upgrade)`
    });

    if (keyId === 'rzp_test_dummykey123' || !process.env.RAZORPAY_KEY_SECRET) {
      const mockOrderId = `order_sub_dummy_${Date.now()}`;
      transaction.razorpayOrderId = mockOrderId;
      await transaction.save();

      return res.json({
        orderId: mockOrderId,
        amount: finalAmount,
        currency: 'INR',
        keyId,
        transactionId: transaction._id,
        credit
      });
    }

    const instance = initRazorpay();
    const options = {
      amount: finalAmount,
      currency: 'INR',
      receipt: `receipt_upgrade_${transaction._id}`,
      notes: {
        userId: userId.toString(),
        transactionId: transaction._id.toString(),
        tier: newTier,
        billingCycle,
        upgrade: 'true'
      }
    };

    const order = await instance.orders.create(options);
    transaction.razorpayOrderId = order.id;
    await transaction.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      transactionId: transaction._id,
      credit
    });
  } catch (error) {
    console.error('Error in upgradePlan:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;

    const subscription = await Subscription.findOne({ userId });
    if (!subscription || subscription.status !== 'active') {
      return res.status(400).json({ message: 'No active subscription found to cancel' });
    }

    subscription.autoRenew = false;
    subscription.cancelledAt = new Date();
    if (reason) subscription.cancelReason = reason;
    await subscription.save();

    // Update user's legacy subscriptionStatus for compatibility
    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: 'Subscription Cancelled'
    });

    res.json({
      message: 'Subscription cancellation scheduled. Benefits remain until plan end date.',
      subscription
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reactivateSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({ userId });
    if (!subscription || subscription.status !== 'active') {
      return res.status(400).json({ message: 'No cancellable subscription found to reactivate' });
    }

    subscription.autoRenew = true;
    subscription.cancelledAt = undefined;
    subscription.cancelReason = undefined;
    await subscription.save();

    // Update user's legacy subscriptionStatus for compatibility
    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: 'Subscription Active'
    });

    res.json({
      message: 'Subscription reactivated successfully',
      subscription
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ userId, status: 'paid' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ userId, status: 'paid' });

    res.json({
      transactions,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (secret && signature) {
      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        return res.status(400).json({ message: 'Invalid signature' });
      }
    }

    // Process payment captured or subscription charged webhooks
    const event = req.body.event;
    console.log(`[RAZORPAY WEBHOOK] Received event: ${event}`);

    // Standard ok response to Razorpay
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).send('<h1>Invoice Not Found</h1><p>The requested transaction could not be located.</p>');
    }

    // Check permissions: either the user owns it, or the user is an admin
    if (transaction.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).send('<h1>Access Denied</h1><p>You do not have permission to view this invoice.</p>');
    }

    const user = await User.findById(transaction.userId);
    if (!user) {
      return res.status(404).send('<h1>Customer Not Found</h1><p>The user associated with this transaction could not be found.</p>');
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${transaction._id}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #334155;
      margin: 0;
      padding: 40px;
      background-color: #f8fafc;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
      padding: 48px;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 28px;
      margin-bottom: 36px;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #d97706; /* Saffron Devotion Color */
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo-symbol {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 20px;
    }
    .invoice-title {
      font-size: 30px;
      color: #0f172a;
      margin: 0;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .invoice-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      margin-bottom: 48px;
    }
    .details-block h3 {
      font-size: 13px;
      text-transform: uppercase;
      color: #64748b;
      margin: 0 0 12px 0;
      letter-spacing: 0.75px;
      font-weight: 700;
    }
    .details-block p {
      margin: 6px 0;
      font-size: 15px;
      color: #334155;
      line-height: 1.6;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 36px;
    }
    .invoice-table th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 14px 18px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e2e8f0;
    }
    .invoice-table td {
      padding: 18px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      font-size: 15px;
      line-height: 1.5;
    }
    .invoice-total {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 2px solid #f1f5f9;
    }
    .total-box {
      width: 320px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      font-size: 15px;
    }
    .total-box .label {
      color: #64748b;
      text-align: right;
    }
    .total-box .value {
      color: #1e293b;
      font-weight: 600;
      text-align: right;
    }
    .total-box .grand-total-label {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      text-align: right;
      align-self: center;
    }
    .total-box .grand-total-value {
      font-size: 22px;
      font-weight: 900;
      color: #d97706;
      text-align: right;
    }
    .no-print {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 30px;
    }
    .btn {
      background: linear-gradient(135deg, #d97706, #b45309);
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transition: all 0.2s;
    }
    .btn:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #e2e8f0;
      color: #475569;
      box-shadow: none;
    }
    .btn-secondary:hover {
      background: #cbd5e1;
      transform: none;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-paid {
      background-color: #dcfce7;
      color: #166534;
    }
    .status-created {
      background-color: #fef3c7;
      color: #92400e;
    }
    .status-failed {
      background-color: #fee2e2;
      color: #991b1b;
    }
    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .invoice-card {
        box-shadow: none;
        border: none;
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn" onclick="window.print()">Print Invoice</button>
    <button class="btn btn-secondary" onclick="window.close()">Close Window</button>
  </div>
  
  <div class="invoice-card">
    <div class="invoice-header">
      <div>
        <div class="logo">
          <span class="logo-symbol">🕉️</span> Omstream
        </div>
        <p style="margin: 6px 0 0 0; color: #64748b; font-size: 14px; font-weight: 500;">Spiritual Streaming Platform</p>
      </div>
      <div>
        <h1 class="invoice-title">Invoice</h1>
        <p style="margin: 6px 0 0 0; color: #64748b; text-align: right; font-size: 14px; font-family: monospace;">ID: ${transaction.razorpayPaymentId || transaction._id}</p>
      </div>
    </div>
    
    <div class="invoice-details">
      <div class="details-block">
        <h3>Billed To</h3>
        <p><strong>${user.name}</strong></p>
        <p style="color: #64748b;">Email: ${user.email || 'N/A'}</p>
        <p style="color: #64748b;">Phone: ${user.phone || 'N/A'}</p>
      </div>
      <div class="details-block" style="text-align: right;">
        <h3>Invoice Details</h3>
        <p>Date: <strong>${new Date(transaction.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</strong></p>
        <p>Status: <span class="status-badge status-${transaction.status}">${transaction.status}</span></p>
        <p style="color: #64748b;">Order Ref: ${transaction.razorpayOrderId || 'N/A'}</p>
      </div>
    </div>
    
    <table class="invoice-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right; width: 120px;">Price</th>
          <th style="text-align: right; width: 120px;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong style="color: #0f172a; font-size: 16px;">Omstream — ${transaction.planName}</strong><br/>
            <span style="font-size: 13px; color: #64748b; margin-top: 4px; display: inline-block;">
              Access Tier: ${transaction.planTier.toUpperCase()} &bull; Billing Cycle: ${transaction.planCycle.toUpperCase()}
            </span>
          </td>
          <td style="text-align: right; font-weight: 500;">₹${(transaction.amount / 100).toFixed(2)}</td>
          <td style="text-align: right; font-weight: 600; color: #0f172a;">₹${(transaction.amount / 100).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="invoice-total">
      <div class="total-box">
        <div class="label">Subtotal</div>
        <div class="value">₹${(transaction.amount / 100).toFixed(2)}</div>
        
        <div class="label">GST (0% - Spiritual / Devotional Service)</div>
        <div class="value">₹0.00</div>
        
        <div class="label grand-total-label">Total Amount Paid</div>
        <div class="value grand-total-value">₹${(transaction.amount / 100).toFixed(2)}</div>
      </div>
    </div>
    
    <div style="margin-top: 80px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px; color: #94a3b8; font-size: 13px; font-weight: 500;">
      Thank you for your devotion and support. May your spiritual journey be enriched!
    </div>
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (error) {
    res.status(500).send(`<h1>Error generating invoice</h1><p>${error.message}</p>`);
  }
};

exports.createPaymentLink = async (req, res) => {
  try {
    const { tier, billingCycle } = req.body;
    const userId = req.user.id;

    if (!PLANS[tier]) {
      return res.status(400).json({ message: 'Invalid tier specified' });
    }
    const cycle = billingCycle || 'monthly';
    const plan = PLANS[tier];
    const amountInPaise = plan.pricing[cycle];

    if (amountInPaise === 0) {
      return res.status(400).json({ message: 'Free plan does not require a payment link' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey123';

    // Create a transaction first
    const transaction = await Transaction.create({
      userId,
      amount: amountInPaise,
      currency: 'INR',
      status: 'created',
      planTier: tier,
      planCycle: cycle,
      planName: `${plan.name} - ${cycle.charAt(0).toUpperCase() + cycle.slice(1)}`
    });

    const user = await User.findById(userId);

    let paymentLinkUrl = '';
    let shortUrl = '';

    if (keyId === 'rzp_test_dummykey123' || !process.env.RAZORPAY_KEY_SECRET) {
      const mockOrderId = `order_sub_dummy_${Date.now()}`;
      transaction.razorpayOrderId = mockOrderId;
      await transaction.save();

      paymentLinkUrl = `upi://pay?pa=gitawisdom@upi&pn=Omstream&am=${amountInPaise / 100}&cu=INR&tn=Sub_${tier}`;
      shortUrl = `http://localhost:5173/payment/success?transactionId=${transaction._id}`;
    } else {
      const instance = initRazorpay();
      const paymentLink = await instance.paymentLink.create({
        amount: amountInPaise,
        currency: "INR",
        accept_partial: false,
        description: `Omstream - ${plan.name} (${cycle})`,
        customer: {
          name: user.name || "Customer",
          email: user.email || "",
          contact: user.phone || ""
        },
        notify: {
          sms: false,
          email: false
        },
        reminder_enable: false,
        notes: {
          userId: userId.toString(),
          transactionId: transaction._id.toString(),
          tier,
          billingCycle: cycle
        },
        callback_url: `http://localhost:5173/payment/success?transactionId=${transaction._id}`,
        callback_method: "get"
      });

      paymentLinkUrl = paymentLink.short_url;
      shortUrl = paymentLink.short_url;
      transaction.razorpayOrderId = paymentLink.id;
      await transaction.save();
    }

    // Convert payment link into a QR code url using dynamic Google Charts / qrserver API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentLinkUrl)}`;

    res.json({
      success: true,
      paymentLink: shortUrl,
      qrCodeUrl,
      amount: amountInPaise,
      currency: 'INR',
      transactionId: transaction._id,
      orderId: transaction.razorpayOrderId
    });
  } catch (error) {
    console.error('Error in createPaymentLink:', error);
    res.status(500).json({ message: error.message });
  }
};

