// server.js - Main server file for FeedbackFusion backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./models/db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'FeedbackFusion Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Import and use routes one by one to isolate the issue
console.log('Importing authRoutes...');
const authRoutes = require('./routes/authRoutes');
console.log('✅ authRoutes imported');

// API Routes - Testing authRoutes only first
console.log('Registering authRoutes...');
app.use('/api/auth', authRoutes); // Authentication routes
console.log('✅ authRoutes registered');

// Comment out other routes for now
/*
console.log('Importing formRoutes...');
const formRoutes = require('./routes/formRoutes');
console.log('✅ formRoutes imported');

console.log('Importing feedbackRoutes...');
const feedbackRoutes = require('./routes/feedbackRoutes');
console.log('✅ feedbackRoutes imported');

console.log('Registering formRoutes...');
app.use('/api/forms', formRoutes); // Form management routes
console.log('✅ formRoutes registered');

console.log('Registering feedbackRoutes...');
app.use('/api', feedbackRoutes); // Feedback submission routes
console.log('✅ feedbackRoutes registered');
*/

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
    console.log('📊 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully!');
    console.log('🎯 Server ready for testing!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
});

module.exports = app;
