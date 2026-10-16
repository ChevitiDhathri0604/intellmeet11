const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// MongoDB configuration with non-blocking resilience
const MONGO_URI = process.env.MONGO_URI;
mongoose.set('bufferCommands', false);

let isDbConnected = false;
const connectDB = async () => {
  if (isDbConnected || !MONGO_URI) return;
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    isDbConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.warn('⚠️ MongoDB unavailable. IntellMeet running in Resilient In-Memory Mode.');
  }
};
connectDB();

// Mount all API sub-routes helper
const mountRoutes = (router) => {
  router.use('/auth', authRoutes);
  router.use('/meetings', meetingRoutes);
  router.use('/ai', aiRoutes);
  router.use('/tasks', taskRoutes);
  router.get('/health', (req, res) => {
    res.json({
      status: 'active',
      platform: 'IntellMeet Netlify Serverless API',
      timestamp: new Date().toISOString()
    });
  });
};

// 1. Mount at /api prefix (for frontend requests e.g. /api/auth/login)
const apiRouter = express.Router();
mountRoutes(apiRouter);
app.use('/api', apiRouter);

// 2. Mount at /.netlify/functions/api prefix
const netlifyRouter = express.Router();
mountRoutes(netlifyRouter);
app.use('/.netlify/functions/api', netlifyRouter);

// 3. Mount directly at root
mountRoutes(app);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'IntellMeet Serverless API is operational on Netlify',
    health: '/api/health'
  });
});

module.exports = app;
