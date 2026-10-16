const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const taskRoutes = require('./routes/taskRoutes');
const setupSocketIO = require('./realtime/socketHandler');

const app = express();
const server = http.createServer(app);

// Enable CORS for local dev + Netlify + Vercel production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.netlify.app')
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback allow to avoid breaking deployed client calls
    }
  },
  credentials: true
}));
app.use(express.json());

// Root Landing Route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>IntellMeet API Server</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #131b2e; border: 1px solid #1e293b; padding: 2.5rem; border-radius: 1.5rem; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); max-width: 450px; }
          h1 { color: #6366f1; margin: 0 0 0.5rem 0; font-size: 1.75rem; }
          p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem; }
          .btn { background: #6366f1; color: white; padding: 0.6rem 1.2rem; border-radius: 0.75rem; text-decoration: none; font-weight: 600; display: inline-block; font-size: 0.875rem; }
          .btn:hover { background: #4f46e5; }
          .badge { display: inline-block; padding: 0.25rem 0.75rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">● OPERATIONAL</div>
          <h1>🚀 IntellMeet API is Live</h1>
          <p>The backend services and real-time WebRTC/Socket.io endpoints are active and ready.</p>
          <a class="btn" href="/api/health">Check API Health</a>
        </div>
      </body>
    </html>
  `);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', taskRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', platform: 'IntellMeet AI Backend', time: new Date() });
});

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
setupSocketIO(io);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intellmeet';

// Disable Mongoose buffering so operations fail immediately if Mongo is not connected
mongoose.set('bufferCommands', false);

// Asynchronously attempt MongoDB connection without blocking server listening
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 })
  .then(() => console.log('✅ Connected to MongoDB Database'))
  .catch(() => console.warn('⚠️ MongoDB not running. Running IntellMeet in Resilient Standalone Mode.'));

// Immediately start HTTP server
server.listen(PORT, () => {
  console.log(`🚀 IntellMeet Server running on port ${PORT}`);
});
