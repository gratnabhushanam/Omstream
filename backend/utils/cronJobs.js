const cron = require('node-cron');
const User = require('../models/User');
const { sendPush, sendInApp } = require('./notificationService');

// Function to run the daily sloka notification job
const sendDailySlokaNotifications = async () => {
  console.log('Running daily sloka notification job...');
  try {
    // Find all users who have notifications enabled
    const users = await User.find({}, 'email settings pushSubscriptions');

    if (!users || users.length === 0) return;

    let successCount = 0;

    // TODO: Ideally, fetch the "Sloka of the Day" from the database.
    // For now, we use a generic inspirational message that links to the Daily Sloka page.
    const title = 'Daily Sloka - Gita Wisdom';
    const body = 'Your daily verse from the Bhagavad Gita awaits. Open the app to continue your spiritual journey today.';

    for (const user of users) {
      if (user.settings && user.settings.notifications) {
        // Send In-App notification
        await sendInApp({
          userId: user.id,
          type: 'content',
          title,
          body,
          data: { url: '/daily-sloka' }
        }).catch(err => console.error(`Failed to send in-app notification to user ${user.id}`, err));

        // Send Native Web Push Notification
        if (user.pushSubscriptions && Array.isArray(user.pushSubscriptions)) {
          for (const subscription of user.pushSubscriptions) {
             await sendPush({
               subscription,
               title,
               body,
               data: { url: '/daily-sloka' }
             }).catch(err => console.error(`Failed to send web push to user ${user.id}`, err));
          }
        }
        successCount++;
      }
    }
    
    console.log(`Daily sloka notifications sent to ${successCount} users.`);
  } catch (error) {
    console.error('Error running daily sloka cron job:', error);
  }
};

// Initialize all cron jobs
const initCronJobs = () => {
  // Run every day at 08:00 AM server time
  cron.schedule('0 8 * * *', sendDailySlokaNotifications, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('Cron jobs initialized (Daily Sloka scheduled for 08:00 AM IST).');
};

module.exports = {
  initCronJobs,
  sendDailySlokaNotifications // Exported for manual trigger testing if needed
};
