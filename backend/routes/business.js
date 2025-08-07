// routes/business.js - Business profile routes
const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/:slug', businessController.getBusinessProfile);
router.get('/:slug/reviews', businessController.getBusinessReviews);
router.post('/:slug/reviews', businessController.submitReview);
router.get('/:slug/forms', businessController.getBusinessForms);
router.get('/:slug/stats', businessController.getBusinessStats);

// Protected routes (require authentication)
router.use(authenticateToken);

// User profile management
router.get('/profile/me', businessController.getUserProfile);
router.post('/profile', businessController.createOrUpdateProfile);
router.put('/profile', businessController.createOrUpdateProfile);
router.delete('/profile', businessController.deleteProfile);

module.exports = router;
