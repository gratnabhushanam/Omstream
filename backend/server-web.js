const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const http = require('http');
const { connectDB } = require('./config/db');
const { startWorker } = require('./services/aiWorker');

// Initialize Environment
dotenv.config();

const app = express();
const compression = require('compression');

// Enable GZIP/Brotli Compression for High-Traffic Payload Optimization
app.use(compression({
  level: 6,
  threshold: 10 * 1024, // only compress > 10kb
}));

let initializePromise = null;

// Top-level response time logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[PERF-SLOW] ${req.method} ${req.originalUrl} - ${duration}ms`);
    } else {
      console.log(`[REQ] ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
  });
  next();
});

const { protectStreaming } = require('./middleware/drmMiddleware');

// Serve HLS playlists and segments securely behind DRM Firewall
app.use('/uploads/reels', protectStreaming, express.static(path.join(__dirname, 'uploads/reels'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Range');
    res.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    res.set('Accept-Ranges', 'bytes');
  }
}));

// Security & Anti-Hacking Rate Limiter
const rateLimit = require('express-rate-limit');

// 1. General API Rate Limiter (Max 300 requests per 5 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  message: { message: 'Too many requests from this IP, please try again after 5 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// 2. Strict Auth Rate Limiter (Max 15 attempts per 10 minutes)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: { message: 'Too many authentication attempts, your IP has been temporarily blocked for security reasons.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// DRM Content Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "https://apis.google.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "img-src": ["'self'", "data:", "https:", "http:"],
      "connect-src": ["'self'", "https://api.openai.com", "https://generativelanguage.googleapis.com", "https://api.deepseek.com"],
      "media-src": ["'self'", "https:", "http:", "blob:"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "frame-src": ["'self'", "https://www.youtube.com", "https://youtube.com"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:8888',
  'https://gitawisdom.onrender.com',
  // Vercel production & preview deployments
  'https://gitwisdom.vercel.app',
  'https://gita-wisdom.vercel.app',
  'https://gitawisdom.vercel.app',
  'https://gita-wisdom-devotion.vercel.app',
  'https://omstream.vercel.app',
  'https://ratnagowd14-7035s-projects.vercel.app',
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  // Allow all localhost and local network origins
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://192.168.') || origin.startsWith('http://10.') || origin.startsWith('http://172.')) return true;
  // Allow ALL Vercel preview deployments (*.vercel.app) - covers all branch/PR deploys
  if (origin && origin.endsWith('.vercel.app')) return true;
  return allowedOrigins.some(o => origin === o || origin.startsWith(o));
};

app.use('/api', cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error('CORS blocked for this origin'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-device-id', 'x-device-name'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));



// Static Folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB and Global Initializer
const initializeApp = async () => {
  if (initializePromise) return initializePromise;

  initializePromise = (async () => {
    try {
      await connectDB();
      console.log('MongoDB Connected successfully');

      // Migrate existing chapters and reconcile folders/chapters database state
      try {
        const Story = require('./models/Story');
        const User = require('./models/User');
        const bcrypt = require('bcryptjs');
        const mongoose = require('mongoose');
        
        // 1. Ensure the 6 folder documents exist
        const folderNames = [
          "Ramayanam",
          "Mahabharatam",
          "Bhagavad Gita",
          "Krishna Leela",
          "Hanuman Charitra",
          "Shiva Purana"
        ];
        for (const name of folderNames) {
          let folder = await Story.findOne({ title: name });
          if (!folder) {
            folder = await Story.create({
              title: name,
              description: `Explore the sacred stories of ${name}`,
              isFolder: true,
              status: 'published'
            });
            console.log(`[MIGRATION] Created folder: "${name}".`);
          } else if (!folder.isFolder) {
            folder.isFolder = true;
            await folder.save();
            console.log(`[MIGRATION] Updated existing story to folder: "${name}".`);
          }
        }

        // 2. Only set isFolder: false on stories that have a parentFolderId (i.e. actual chapters/sub-stories).
        // Do NOT touch admin-uploaded root-level folders — they should keep their isFolder: true flag.
        await Story.updateMany(
          { 
            title: { $nin: folderNames },
            parentFolderId: { $exists: true, $ne: '' },
            isFolder: { $ne: false }
          },
          { $set: { isFolder: false } }
        );

        // 3. Move "marriage" story into "Ramayanam" folder
        const ramFolder = await Story.findOne({ title: "Ramayanam" });
        if (ramFolder) {
          const marriageStory = await Story.findOne({ title: /marriage/i });
          if (marriageStory && String(marriageStory._id) !== String(ramFolder._id)) {
            marriageStory.parentFolderId = "Ramayanam";
            marriageStory.isFolder = false;
            marriageStory.folderId = ramFolder._id;
            marriageStory.parentFolder = "Ramayanam";
            await marriageStory.save();
            console.log(`[MIGRATION] Successfully moved "marriage" story into folder "Ramayanam".`);
          }
        }

        // Admin credentials are handled by initializeAdminCredentials() below (uses ADMIN_EMAIL/ADMIN_PASSWORD from .env)
      } catch (migrationError) {
        console.error('[MIGRATION-ERROR] Failed to run database migration:', migrationError.message);
      }

      // Ensure upload directories exist
      const dirs = ['uploads/reels', 'uploads/temp', 'uploads/thumbnails'];
      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      });

      // Start AI Background Worker
      startWorker();

      // Initialize Admin Credentials
      const { initializeAdminCredentials } = require('./controllers/authController');
      await initializeAdminCredentials();
      console.log('Admin credentials initialized/verified.');

      // Run Subscription migrations
      try {
        const { migrateExistingUsers } = require('./scripts/migrateSubscriptions');
        await migrateExistingUsers();
      } catch (err) {
        console.error('[MIGRATION] Subscription migration failed:', err.message);
      }

      // Start Cron Jobs (Automated Sloka, sloka rotation etc)
      if (!cluster.isWorker || cluster.worker.id === 1) {
        require('./services/cronJobs').initializeCronJobs();
        try {
          const { initializeSubscriptionCrons } = require('./services/subscriptionCron');
          initializeSubscriptionCrons();
        } catch (err) {
          console.error('[CRON] Subscription cron initialization failed:', err.message);
        }
        console.log('[CRON] Jobs initialized by Worker 1 (or Primary).');
      } else {
        console.log(`[CRON] Worker ${cluster.worker.id} bypassing cron initialization to prevent duplication.`);
      }

      return true;
    } catch (err) {
      console.error('Initialization Failed:', err.message);
      return false;
    }
  })();

  return initializePromise;
};

// DIRECT ROUTE FOR TRANSLATION (To bypass any potential routing issues)
app.post('/api/stories/:id/translate', require('./controllers/storyController').translateStory);

// Vercel Cache Bug Fix: Catch requests with double /api/api and rewrite them to /api
app.use((req, res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace('/api/api/', '/api/');
  }
  next();
});

// API Routes
const otpController = require('./controllers/otpController');
const authController = require('./controllers/authController');
const subscriptionController = require('./controllers/subscriptionController');
const { protect } = require('./middleware/authMiddleware');

app.post('/send-otp', otpController.sendOtp);
app.post('/verify-otp', otpController.verifyOtp);
app.post('/signup', authController.registerUser);
app.post('/login', authController.loginUser);
app.post('/create-order', protect, subscriptionController.subscribeToPlan);
app.post('/create-payment-link', protect, subscriptionController.createPaymentLink);
app.post('/verify-payment', protect, subscriptionController.verifyAndActivate);
app.post('/webhook', subscriptionController.handleWebhook);

app.post('/api/send-otp', otpController.sendOtp);
app.post('/api/verify-otp', otpController.verifyOtp);
app.post('/api/signup', authController.registerUser);
app.post('/api/login', authController.loginUser);
app.post('/api/create-order', protect, subscriptionController.subscribeToPlan);
app.post('/api/create-payment-link', protect, subscriptionController.createPaymentLink);
app.post('/api/verify-payment', protect, subscriptionController.verifyAndActivate);
app.post('/api/webhook', subscriptionController.handleWebhook);

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/subscription', require('./routes/subscriptionRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/content', require('./routes/syncRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin/notifications', require('./routes/adminNotificationRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/stories', require('./routes/storyRoutes'));
app.use('/api/story', require('./routes/storyRoutes'));
app.use('/api/chapters', require('./routes/chapterRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/channels', require('./routes/channelRoutes'));
app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/songs', require('./routes/songRoutes'));
app.use('/api/playlists', require('./routes/playlistRoutes'));
app.use('/api/slokas', require('./routes/slokaRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/communities', require('./routes/communityRoutes'));
console.log('Routes registered');

const PORT = process.env.PORT || 8888;
const LEGACY_PORT = process.env.LEGACY_PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

const cluster = require('cluster');
const os = require('os');

// Health check & Keep-alive route
app.get('/ping', (req, res) => res.status(200).send('pong'));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));

const startServer = async () => {
  try {
    const isPrimary = cluster.isPrimary || cluster.isMaster;
    if (isProduction && isPrimary) {
      console.log(`[CLUSTER] Primary ${process.pid} is running`);
      const numCPUs = process.env.WEB_CONCURRENCY ? Number(process.env.WEB_CONCURRENCY) : 1;
      
      console.log(`[CLUSTER] Forking ${numCPUs} optimized workers to match memory limits...`);
      for (let i = 0; i < numCPUs; i++) cluster.fork();
      
      cluster.on('exit', (worker, code, signal) => {
        console.warn(`[CLUSTER] Worker ${worker.process.pid} died. Forking a replacement...`);
        cluster.fork();
      });
    } else {
      await initializeApp();
      const httpServer = http.createServer(app);
      const { initSocket } = require('./services/socketService');
      initSocket(httpServer);

      httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`[SERVER] Running on port ${PORT} with Socket.IO`);
        
        // Prevent Render Free Tier Sleep
        if (isProduction) {
          console.log('[KEEP-ALIVE] Initialized self-ping every 14 minutes');
          setInterval(() => {
            require('https').get('https://gitawisdom.onrender.com/ping', (resp) => {
              console.log('[KEEP-ALIVE] Ping status:', resp.statusCode);
            }).on("error", (err) => {
              console.error('[KEEP-ALIVE] Ping failed:', err.message);
            });
          }, 14 * 60 * 1000); // 14 minutes
        }
      });
      if (!isProduction && String(LEGACY_PORT) !== String(PORT)) {
        const legacyServer = http.createServer(app);
        initSocket(legacyServer);
        legacyServer.listen(LEGACY_PORT, '0.0.0.0', () => {
          console.log(`[SERVER] Legacy compatibility port running on ${LEGACY_PORT}`);
        });
      }
    }
  } catch (err) {
    console.error('Server Startup Failed:', err);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, initializeApp, startServer };
