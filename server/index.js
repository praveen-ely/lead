const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const companyRoutes = require('./routes/companyRoutes');
const leadRoutes = require('./routes/leadRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const userPreferenceRoutes = require('./routes/userPreferenceRoutes');
const leadTrackingRoutes = require('./routes/leadTrackingRoutes');
const testApiRoutes = require('./routes/testApiRoutes');
const { router: notificationRoutes, sendNotification } = require('./routes/notificationRoutes');
const authRoutes = require('./routes/authRoutes');
const { initializeScheduledTasks } = require('./controllers/settingsController');
const thirdPartyApiService = require('./services/thirdPartyApiService');
const { ensureTestUsers } = require('./utils/seedTestUsers');
const { startDailyUserLeadSync } = require('./services/userLeadSyncService');

const app = express();
const PORT = process.env.PORT || 5002;
const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001'];
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : defaultOrigins;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.set('trust proxy', 1);

// Rate limiting - very lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per 15 minutes (very lenient for development)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/api/health';
  }
});

// Apply rate limiting to all routes except health check
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('MongoDB connected');
  ensureTestUsers();
  initializeScheduledTasks();
  startDailyUserLeadSync();
})
.catch(err => console.error('MongoDB connection error:', err));

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/user-preferences', userPreferenceRoutes);
app.use('/api/lead-tracking', leadTrackingRoutes);
app.use('/api/test', testApiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
