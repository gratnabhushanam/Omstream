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
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  // Allow all localhost origins
  if (origin.startsWith('http://localhost:')) return true;
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

        // 2. Set isFolder: false for all other stories
        await Story.updateMany(
          { title: { $nin: folderNames } },
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
app.use('/api/payments', require('./routes/payments'));
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

// Health check & Keep-alive route
app.get('/ping', (req, res) => res.status(200).send('pong'));

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
        
        // Prevent Render Free Tier Sleep
        if (isProduction) {
          console.log('[KEEP-ALIVE] Initialized self-ping every 14 minutes');
          setInterval(() => {
            require('https').get('https://gita-wisdom-1.onrender.com/ping', (resp) => {
              console.log('[KEEP-ALIVE] Ping status:', resp.statusCode);
            }).on("error", (err) => {
              console.error('[KEEP-ALIVE] Ping failed:', err.message);
            });
          }, 14 * 60 * 1000); // 14 minutes
        }
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
