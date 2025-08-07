// routes/feedbackRoutes.js - Feedback submission and management routes
const express = require('express');
const { 
  submitFeedback, 
  getFeedbackStats, 
  getFeedbackEntry, 
  updateEntryFlag 
} = require('../controllers/feedbackController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireVendor } = require('../middleware/roleMiddleware');

const router = express.Router();

// @route   POST /api/forms/:formId/submit
// @desc    Submit feedback to a form (anonymous, public access)
// @access  Public
router.post('/forms/:formId/submit', submitFeedback);

// @route   GET /api/forms/:formId/stats
// @desc    Get feedback statistics for a form
// @access  Private (Vendor only, own forms only)
router.get('/forms/:formId/stats', authenticateToken, requireVendor, getFeedbackStats);

// @route   GET /api/feedback/:entryId
// @desc    Get a specific feedback entry
// @access  Private (Vendor only, own forms only)
router.get('/feedback/:entryId', authenticateToken, requireVendor, getFeedbackEntry);

// @route   PATCH /api/feedback/:entryId/flag
// @desc    Update the flag status of a feedback entry
// @access  Private (Vendor only, own forms only)
router.patch('/feedback/:entryId/flag', authenticateToken, requireVendor, updateEntryFlag);

// Additional utility routes for better API organization

// @route   GET /api/feedback/entry/:entryId
// @desc    Get a specific feedback entry (alternative route)
// @access  Private (Vendor only, own forms only)
router.get('/feedback/entry/:entryId', authenticateToken, requireVendor, getFeedbackEntry);

// @route   PUT /api/feedback/:entryId/flag
// @desc    Update the flag status of a feedback entry (alternative method)
// @access  Private (Vendor only, own forms only)
router.put('/feedback/:entryId/flag', authenticateToken, requireVendor, updateEntryFlag);

module.exports = router;
