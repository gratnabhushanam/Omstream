// backend/utils/notificationService.js
// Centralized notification utility for email, push, and in-app notifications

const { getTransporter } = require('./emailHelpers');

// Email notification (Gmail SMTP, Resend, or Brevo)
async function sendEmail({ to, subject, html, text }) {
  // TODO: Switch provider based on env
  const transporter = getTransporter();
  if (!transporter) return;
  
  await transporter.sendMail({
    from: `${process.env.EMAIL_FROM_NAME || 'Omstream'} <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  });
}

const webpush = require('web-push');

// Configure web-push with VAPID details
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:support@gitawisdom.org';

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(vapidEmail, publicVapidKey, privateVapidKey);
}

// Send Native Web Push notification
async function sendPush({ subscription, title, body, data }) {
  if (!subscription || !publicVapidKey || !privateVapidKey) return;
  
  const payload = JSON.stringify({
    title,
    body,
    icon: '/logo.png', // Assuming logo.png exists in public folder
    badge: '/icon-192x192.png',
    data: data || {},
  });

  try {
    await webpush.sendNotification(subscription, payload);
  } catch (error) {
    console.error('Error sending push notification:', error);
    // If the subscription is invalid/expired (HTTP 410), we could ideally remove it from the DB here
    throw error;
  }
}

// In-app notification (DB insert)
async function sendInApp({ userId, type, title, body, data }) {
  // Lazy load to avoid circular dependency
  const Notification = require('../models/Notification');
  if (!userId) return;
  const safeType = String(type || 'system').trim() || 'system';
  const safeTitle = String(title || '').trim() || 'Omstream Update';
  const safeBody = String(body || '').trim() || 'You have a new update from Omstream.';

  await Notification.create({
    userId,
    type: safeType,
    title: safeTitle,
    body: safeBody,
    message: safeBody,
    data: data || {},
    isRead: false,
    read: false,
    createdAt: new Date(),
  });
}

module.exports = {
  sendEmail,
  sendPush,
  sendInApp,
};
