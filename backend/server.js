const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { startWorker } = require('./services/aiWorker');

// Initialize Environment
dotenv.config();

const app = express();
let initializePromise = null;

// VERY TOP Request Logger
app.use((req, res, next) => {
  console.log(`[TOP-REQ] ${req.method} ${req.originalUrl}`);
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
  'https://gita-wisdom-1.onrender.com',
  // Vercel production & preview deployments
  'https://gitwisdom.vercel.app',
  'https://gita-wisdom.vercel.app',
  'https://gitawisdom.vercel.app',
  'https://gita-wisdom-devotion.vercel.app',
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  // Allow all Vercel preview deployments (*.vercel.app)
  if (origin && origin.endsWith('.vercel.app')) return true;
  return allowedOrigins.some(o => origin.startsWith(o));
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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Global Request Logger
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});


// Static Folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB and Global Initializer
const initializeApp = async () => {
  if (initializePromise) return initializePromise;

  initializePromise = (async () => {
    try {
      await connectDB();
      console.log('MongoDB Connected successfully');

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

      // Start Cron Jobs (Automated Sloka, sloka rotation etc)
      require('./services/cronJobs').initializeCronJobs();
      console.log('Cron jobs initialized (Daily Sloka scheduled for 08:00 AM IST).');

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

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/content', require('./routes/syncRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
console.log('Loading storyRoutes...');
app.use('/api/stories', require('./routes/storyRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/slokas', require('./routes/slokaRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/forum', require('./routes/forumRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

console.log('Routes registered');

const PORT = process.env.PORT || 8888;
const LEGACY_PORT = process.env.LEGACY_PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

const cluster = require('cluster');
const os = require('os');

const startServer = async () => {
  try {
    if (false) { // Disabled cluster for debugging
      const numCPUs = os.cpus().length;
      for (let i = 0; i < numCPUs; i++) cluster.fork();
      cluster.on('exit', () => cluster.fork());
    } else {
      await initializeApp();
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`[SERVER] Running on port ${PORT}`);
      });
      if (!isProduction && String(LEGACY_PORT) !== String(PORT)) {
        app.listen(LEGACY_PORT, '0.0.0.0', () => {
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
