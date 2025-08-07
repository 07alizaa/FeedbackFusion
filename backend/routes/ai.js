// routes/ai.js - AI-powered features routes
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All AI routes require authentication
router.use(authenticateToken);

// Sentiment analysis routes
router.post('/forms/:formId/analyze-sentiment', aiController.analyzeFeedbackSentiment);
router.post('/bulk-analyze-sentiment', aiController.bulkAnalyzeSentiment);

// AI insights routes
router.get('/forms/:formId/insights', aiController.getAIInsights);
router.get('/dashboard', aiController.getAIDashboard);

// Form improvement recommendations
router.get('/forms/:formId/recommendations', aiController.generateFormRecommendations);

// User quality analysis
router.get('/top-quality-users', aiController.getTopQualityUsers);

// Form template generation
router.post('/generate-template', aiController.generateFormTemplate);

module.exports = router;
