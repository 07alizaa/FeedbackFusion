const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/userRoutes');
const legacyAuthRoutes = require('./routes/auth'); // For backward compatibility
const subscriptionRoutes = require('./routes/subscription');
const aiRoutes = require('./routes/ai');
const qrRoutes = require('./routes/qr');
const businessRoutes = require('./routes/business');
const notificationRoutes = require('./routes/notification');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'feedbackfusion',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make database and io available to all routes
app.use((req, res, next) => {
  req.db = pool;
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/forms', formRoutes); // Form management routes
app.use('/api', feedbackRoutes); // Feedback submission routes
app.use('/api/admin', adminRoutes); // Admin dashboard routes
app.use('/api/users', userRoutes); // User management routes
app.use('/api/auth', legacyAuthRoutes); // For backward compatibility
app.use('/api/subscriptions', subscriptionRoutes); // Subscription management
app.use('/api/subscription', subscriptionRoutes); // Subscription management (singular for frontend compatibility)
app.use('/api/ai', aiRoutes); // AI-powered features
app.use('/api/qr', qrRoutes); // QR code management
app.use('/api/business', businessRoutes); // Business profiles
app.use('/api/notifications', notificationRoutes); // Notification system

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Start server
const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin Dashboard: http://localhost:${PORT}/api/admin`);
  console.log(`Business Profiles: http://localhost:${PORT}/api/business`);
  console.log(`Notifications: http://localhost:${PORT}/api/notifications`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    pool.end();
  });
});

module.exports = app;
