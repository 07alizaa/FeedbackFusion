// routes/admin.js - Clean admin routes for dashboard functionality
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const enhancedAdminController = require('../controllers/enhancedAdminController');

// Admin middleware to check if user is admin
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Enhanced dashboard routes using controllers
router.get('/stats', authenticateToken, adminAuth, enhancedAdminController.getDashboardStats);
router.get('/analytics', authenticateToken, adminAuth, enhancedAdminController.getAnalytics);
router.get('/recent-activity', authenticateToken, adminAuth, enhancedAdminController.getRecentActivity);
router.get('/pending-approvals', authenticateToken, adminAuth, enhancedAdminController.getPendingApprovals);

// User management routes
router.get('/users', authenticateToken, adminAuth, adminController.getAllUsers);
router.patch('/users/:userId/status', authenticateToken, adminAuth, adminController.updateUserStatus);

// Business management routes
router.get('/businesses', authenticateToken, adminAuth, async (req, res) => {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        u.id,
        u.name as "ownerName",
        u.email,
        u.business_name as "businessName",
        u.phone,
        u.industry,
        u.company_size as "companySize",
        u.status,
        u.created_at as "createdAt",
        COUNT(DISTINCT f.id) as "formsCount",
        COUNT(DISTINCT fe.id) as "responsesCount"
      FROM users u
      LEFT JOIN feedback_forms f ON u.id = f.user_id
      LEFT JOIN feedback_entries fe ON f.id = fe.form_id
      WHERE u.role = 'vendor'
      GROUP BY u.id, u.name, u.email, u.business_name, u.phone, u.industry, u.company_size, u.status, u.created_at
      ORDER BY u.created_at DESC
    `);

    client.release();

    res.json({
      success: true,
      businesses: result.rows
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch businesses'
    });
  }
});

router.get('/businesses/pending', authenticateToken, adminAuth, async (req, res) => {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        u.id,
        u.name as "ownerName",
        u.email,
        u.business_name as "businessName",
        u.phone,
        u.industry,
        u.company_size as "companySize",
        u.status,
        u.created_at as "createdAt"
      FROM users u
      WHERE u.role = 'vendor' AND u.status = 'pending'
      ORDER BY u.created_at DESC
    `);

    client.release();

    res.json({
      success: true,
      pendingBusinesses: result.rows
    });
  } catch (error) {
    console.error('Error fetching pending businesses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending businesses'
    });
  }
});

// Business approval/rejection routes
router.post('/businesses/:id/approve', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();

    await client.query('UPDATE users SET status = $1 WHERE id = $2 AND role = $3', ['approved', id, 'vendor']);
    client.release();

    res.json({
      success: true,
      message: 'Business approved successfully'
    });
  } catch (error) {
    console.error('Error approving business:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve business'
    });
  }
});

router.post('/businesses/:id/reject', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();

    await client.query('UPDATE users SET status = $1 WHERE id = $2 AND role = $3', ['rejected', id, 'vendor']);
    client.release();

    res.json({
      success: true,
      message: 'Business rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting business:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject business'
    });
  }
});

// Form management routes
router.get('/forms', authenticateToken, adminAuth, adminController.getAllForms);
router.get('/forms/pending', authenticateToken, adminAuth, async (req, res) => {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        f.id,
        f.title,
        f.description,
        f.status,
        f.created_at as "createdAt",
        u.name as "createdBy",
        u.business_name as "businessName"
      FROM feedback_forms f
      JOIN users u ON f.user_id = u.id
      WHERE f.status = 'pending'
      ORDER BY f.created_at DESC
    `);

    client.release();

    res.json({
      success: true,
      pendingForms: result.rows
    });
  } catch (error) {
    console.error('Error fetching pending forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending forms'
    });
  }
});

// Other management routes
router.get('/subscriptions', authenticateToken, adminAuth, adminController.getSubscriptions);
router.get('/flagged-content', authenticateToken, adminAuth, adminController.getFlaggedContent);
router.patch('/moderate', authenticateToken, adminAuth, adminController.moderateContent);
router.get('/notifications', authenticateToken, adminAuth, adminController.getNotifications);

// Settings routes
router.get('/settings', authenticateToken, adminAuth, async (req, res) => {
  try {
    const settings = {
      siteName: 'FeedbackFusion',
      siteDescription: 'Professional feedback management platform',
      maxFormsPerUser: 10,
      maxResponsesPerForm: 1000,
      autoApprovalEnabled: false,
      maintenanceMode: false,
      emailNotifications: true,
      analyticsEnabled: true
    };

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

module.exports = router;
