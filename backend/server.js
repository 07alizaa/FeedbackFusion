// server.js - Main server file for FeedbackFusion backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./models/db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'FeedbackFusion Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const qrRoutes = require('./routes/qr');
const businessRoutes = require('./routes/business');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const subscriptionRoutes = require('./routes/subscription');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notification');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api', feedbackRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server and initialize database
app.listen(PORT, async () => {
  console.log(`🚀 FeedbackFusion Backend running on port ${PORT}`);
  
  try {
    await initializeDatabase();
    console.log('✅ Server ready!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
});

module.exports = app;
