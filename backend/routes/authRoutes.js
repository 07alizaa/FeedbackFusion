// routes/authRoutes.js - Authentication routes
const express = require('express');
const { signup, login, getProfile, updateProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user (vendor or admin)
// @access  Public
router.post('/signup', signup);

// @route   POST /api/auth/login
// @desc    Login user and get JWT token
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private (requires authentication)
router.get('/profile', authenticateToken, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update current user profile
// @access  Private (requires authentication)
router.put('/profile', authenticateToken, updateProfile);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  // Since we're using stateless JWT, logout is handled client-side
  // This endpoint can be used for any server-side cleanup if needed
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please remove the token from client storage.'
  });
});

// @route   POST /api/auth/verify
// @desc    Verify if the current token is valid
// @access  Private
router.post('/verify', authenticateToken, (req, res) => {
  // If middleware passes, token is valid
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role
      }
    }
  });
});

module.exports = router;
