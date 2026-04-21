require('dotenv').config({ path: __dirname + '/.env' });

const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const http       = require('http');
const path       = require('path');
const fs         = require('fs');
const { Server } = require('socket.io');

const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/users');
const reelRoutes         = require('./routes/reels');
const postRoutes         = require('./routes/posts');
const notificationRoutes = require('./routes/notifications');
const searchRoutes       = require('./routes/search');
const chatRoutes         = require('./routes/chat');

const { socketHandler } = require('./utils/socketHandler');
const connectDB         = require('./config/db');

const app    = express();
const server = http.createServer(app);

// ── Socket.io ────────────────────────────────────────────────────────────────
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
const io = new Server(server, {
  cors: { origin: allowedOrigin, methods: ['GET', 'POST'], credentials: true },
});

// ── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Attach socket.io to every request
app.use((req, res, next) => { req.io = io; next(); });

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/reels',         reelRoutes);
app.use('/api/posts',         postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search',        searchRoutes);
app.use('/api/chat',          chatRoutes);

// Health-check
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', app: 'JIOREELS' })
);

// ── Serve React Frontend ──────────────────────────────────────────────────────
// Looks for the built React app at ../frontend/build
// If not built yet, shows a helpful message instead of "Cannot GET /"
const buildPath = path.join(__dirname, '../frontend/build');

if (fs.existsSync(path.join(buildPath, 'index.html'))) {
  // Serve static assets (JS, CSS, images)
  app.use(express.static(buildPath));

  // All non-API routes → React's index.html  (React Router handles them)
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  // Build not found → show clear instructions
  app.get('*', (req, res) => {
    res.status(200).send(`
      <!DOCTYPE html><html><head>
        <title>JIOREELS — Setup Required</title>
        <style>
          body { font-family: sans-serif; background: #0a0a0a; color: #fff;
                 display:flex; align-items:center; justify-content:center;
                 min-height:100vh; margin:0; }
          .box { background:#161616; border:1px solid #333; border-radius:16px;
                 padding:40px 48px; max-width:520px; text-align:center; }
          h1 { background:linear-gradient(135deg,#FF2D78,#FF6B35);
               -webkit-background-clip:text; -webkit-text-fill-color:transparent;
               font-size:2rem; margin-bottom:8px; }
          p  { color:#888; line-height:1.7; }
          code { background:#222; padding:10px 18px; border-radius:8px;
                 display:block; margin:10px 0; color:#4ade80;
                 font-size:15px; text-align:left; }
          .note { font-size:13px; color:#555; margin-top:24px; }
        </style>
      </head><body><div class="box">
        <h1>JIOREELS</h1>
        <p>Backend is running ✅<br>
           You need to <strong>build the React frontend</strong> once.</p>
        <p>Open a <strong>new terminal</strong> and run:</p>
        <code>cd frontend<br>npm install<br>npm run build</code>
        <p>Then restart the backend:</p>
        <code>cd ../backend<br>node server.js</code>
        <p class="note">
          Or run both steps at once from the backend folder:<br>
          <code>npm run fullstart</code>
        </p>
      </div></body></html>
    `);
  });
}

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ success: false, message: 'File too large' });
  if (err.message?.includes('Only'))
    return res.status(400).json({ success: false, message: err.message });
  console.error('❌ Server error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false, message: err.message || 'Internal Server Error',
  });
});

// ── Socket.io ─────────────────────────────────────────────────────────────────
socketHandler(io);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5002;

connectDB().then(() => {
  server.listen(PORT, () => {
    const buildExists = fs.existsSync(path.join(buildPath, 'index.html'));
    console.log('');
    console.log('🚀 ─────────────────────────────────────────────────');
    console.log(`   JIOREELS  →  http://localhost:${PORT}`);
    console.log(`   API       →  http://localhost:${PORT}/api/health`);
    console.log(`   MongoDB   →  ${process.env.MONGO_URI}`);
    console.log(`   UI Build  →  ${buildExists ? '✅ Serving React app' : '⚠️  Not built yet — run: npm run fullstart'}`);
    console.log('─────────────────────────────────────────────────────');
    console.log('');
    if (!buildExists) {
      console.log('⚠️  Frontend not built. Run from backend folder:');
      console.log('   npm run fullstart');
      console.log('');
    }
  });
}).catch(err => {
  console.error('❌ DB connection failed:', err.message);
  process.exit(1);
});
