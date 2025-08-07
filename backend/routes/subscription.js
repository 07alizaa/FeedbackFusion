// routes/subscription.js - Subscription management routes
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Get all subscription plans (public)
router.get('/plans', subscriptionController.getPlans);

// Protected routes (require authentication)
router.use(authenticateToken);

// Get current user subscription
router.get('/current', subscriptionController.getCurrentSubscription);

// Create new subscription
router.post('/create', subscriptionController.createSubscription);

// Cancel subscription
router.post('/cancel', subscriptionController.cancelSubscription);

// Create billing portal session
router.post('/billing-portal', subscriptionController.createBillingPortal);

// Check usage limits
router.get('/usage', subscriptionController.checkUsage);

// Admin only routes
router.get('/analytics', requireAdmin, subscriptionController.getSubscriptionAnalytics);

// Webhook endpoint (no auth needed, but signature verification inside)
router.post('/webhook', express.raw({type: 'application/json'}), subscriptionController.handleWebhook);

module.exports = router;
