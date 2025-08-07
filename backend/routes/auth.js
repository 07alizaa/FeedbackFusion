// routes/auth.js - Authentication routes (legacy, use authRoutes.js)
const express = require('express');
const { signup, login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Legacy routes for backward compatibility
router.post('/register', signup);
router.post('/login', login);

// New routes
router.post('/signup', signup);
router.get('/profile', authenticateToken, getProfile);

module.exports = router;