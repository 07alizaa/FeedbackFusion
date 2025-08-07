// middleware/authMiddleware.js - JWT authentication middleware
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Middleware to verify JWT token and extract user information
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Handle special admin case (hardcoded admin)
    if (decoded.userId === 'admin' && decoded.role === 'admin') {
      req.user = {
        userId: 'admin',
        email: 'admin@feedbackfusion.com',
        role: 'admin',
        userDetails: {
          id: 'admin',
          name: 'System Administrator',
          email: 'admin@feedbackfusion.com',
          role: 'admin'
        }
      };
      return next();
    }

    // Optional: Verify user still exists in database
    const userResult = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    // Attach user information to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      userDetails: userResult.rows[0]
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

// Optional middleware for routes that can work with or without authentication
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    // Try to verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details
    const userResult = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length > 0) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        userDetails: userResult.rows[0]
      };
    } else {
      req.user = null;
    }

    next();

  } catch (error) {
    // If token verification fails, continue without authentication
    req.user = null;
    next();
  }
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin
};
