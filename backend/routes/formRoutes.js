// routes/formRoutes.js - Form management routes
const express = require('express');
const { 
  createForm, 
  getFormById, 
  getVendorForms,
  getVendorFormById, 
  updateForm, 
  deleteForm, 
  getFormEntries,
  getFormStats,
  resubmitForm
} = require('../controllers/formController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const { requireVendor, requireVendorOrAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// @route   POST /api/forms
// @desc    Create a new feedback form
// @access  Private (Vendor only)
router.post('/', authenticateToken, requireVendor, createForm);

// @route   GET /api/forms/vendor/my
// @desc    Get all forms created by the logged-in vendor
// @access  Private (Vendor or Admin)
router.get('/vendor/my', authenticateToken, requireVendorOrAdmin, getVendorForms);

// Alternative route structure for better REST compliance
// @route   GET /api/forms/vendor
// @desc    Get all forms for the logged-in vendor
// @access  Private (Vendor or Admin only)
router.get('/vendor', authenticateToken, requireVendorOrAdmin, getVendorForms);

// @route   GET /api/forms/vendor/:id
// @desc    Get a specific form by ID for editing (vendor can access their own forms)
// @access  Private (Vendor only)
router.get('/vendor/:id', authenticateToken, requireVendorOrAdmin, getVendorFormById);

// @route   GET /api/forms/:id
// @desc    Get a specific form by ID (public access for form display)
// @access  Public
router.get('/:id', getFormById);

// @route   GET /api/forms/:id
// @desc    Get a specific form by ID (public access for form display)
// @access  Public
router.get('/:id', getFormById);

// @route   PUT /api/forms/:id
// @desc    Update a form (vendor can only update their own forms)
// @access  Private (Vendor only)
router.put('/:id', authenticateToken, requireVendor, updateForm);

// @route   DELETE /api/forms/:id
// @desc    Delete a form (vendor can only delete their own forms)
// @access  Private (Vendor only)
router.delete('/:id', authenticateToken, requireVendor, deleteForm);

// @route   GET /api/forms/:id/entries
// @desc    Get feedback entries for a specific form
// @access  Private (Vendor only, own forms only)
router.get('/:id/entries', authenticateToken, requireVendor, getFormEntries);

// @route   GET /api/forms/:id/stats
// @desc    Get statistics for a specific form
// @access  Private (Vendor only, own forms only)
router.get('/:id/stats', authenticateToken, requireVendor, getFormStats);

// @route   POST /api/forms/:id/resubmit
// @desc    Resubmit a rejected form for approval
// @access  Private (Vendor only)
router.post('/:id/resubmit', authenticateToken, requireVendor, resubmitForm);

module.exports = router;
