// routes/admin.js - Admin routes for dashboard functionality
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

// Dashboard and Analytics Routes
router.get('/stats', authenticateToken, adminAuth, enhancedAdminController.getDashboardStats);
router.get('/analytics', authenticateToken, adminAuth, enhancedAdminController.getAnalytics);
router.get('/recent-activity', authenticateToken, adminAuth, enhancedAdminController.getRecentActivity);

// Business Management Routes
router.get('/businesses', authenticateToken, adminAuth, async (req, res) => {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        id,
        name as ownerName,
        email,
        business_name as businessName,
        phone,
        industry,
        company_size as companySize,
        status,
        created_at as registrationDate
      FROM users 
      WHERE role = 'vendor'
      ORDER BY created_at DESC
    `);

    const businesses = result.rows.map(business => ({
      ...business,
      status: business.status || 'pending'
    }));

    client.release();

    res.status(200).json({
      success: true,
      data: businesses
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch businesses'
    });
  }
});

router.get('/pending-approvals', authenticateToken, adminAuth, enhancedAdminController.getPendingApprovals);

// Business approval routes
router.post('/businesses/:id/approve', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    const result = await client.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND role = $3 RETURNING *',
      ['approved', id, 'vendor']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }
    
    client.release();
    
    res.status(200).json({
      success: true,
      message: 'Business approved successfully',
      data: result.rows[0]
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
    const { reason } = req.body;
    const client = await pool.connect();
    
    const result = await client.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND role = $3 RETURNING *',
      ['rejected', id, 'vendor']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }
    
    client.release();
    
    res.status(200).json({
      success: true,
      message: 'Business rejected successfully',
      data: {
        ...result.rows[0],
        rejectionReason: reason
      }
    });
  } catch (error) {
    console.error('Error rejecting business:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject business'
    });
  }
});

// User Management Routes
router.get('/users', authenticateToken, adminAuth, adminController.getAllUsers);
router.patch('/users/:userId/status', authenticateToken, adminAuth, adminController.updateUserStatus);

router.delete('/users/:userId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const client = await pool.connect();
    
    await client.query('BEGIN');
    
    // Delete user's forms and feedback entries (cascade should handle this)
    const result = await client.query(
      'DELETE FROM users WHERE id = $1 AND role != $2 RETURNING *',
      [userId, 'admin']
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'User not found or cannot delete admin user'
      });
    }
    
    await client.query('COMMIT');
    client.release();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Form Management Routes
router.get('/forms', authenticateToken, adminAuth, adminController.getAllForms);
router.get('/forms/pending', authenticateToken, adminAuth, async (req, res) => {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        ff.id,
        ff.title,
        ff.description,
        ff.is_active,
        ff.status,
        ff.created_at,
        u.name as owner_name,
        u.email as owner_email,
        u.business_name
      FROM feedback_forms ff
      JOIN users u ON ff.user_id = u.id
      WHERE ff.status = 'pending'
      ORDER BY ff.created_at DESC
    `);

    client.release();

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching pending forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending forms'
    });
  }
});

// Content Management Routes
router.get('/flagged-content', authenticateToken, adminAuth, adminController.getFlaggedContent);
router.patch('/moderate', authenticateToken, adminAuth, adminController.moderateContent);

// Subscription Management Routes
router.get('/subscriptions', authenticateToken, adminAuth, adminController.getSubscriptions);

// Notification Routes
router.get('/notifications', authenticateToken, adminAuth, adminController.getNotifications);

// System Settings Routes
router.get('/settings', authenticateToken, adminAuth, async (req, res) => {
  try {
    const mockSettings = {
      general: {
        siteName: 'FeedbackFusion',
        siteDescription: 'Advanced Feedback Management System',
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: false,
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: false,
        adminAlerts: true,
        systemUpdates: true,
      },
      security: {
        twoFactorAuth: false,
        passwordComplexity: 'medium',
        sessionTimeout: 30,
        ipWhitelist: '',
      },
      api: {
        rateLimit: 1000,
        apiKeys: 3,
        webhooksEnabled: true,
        corsEnabled: true,
      },
      database: {
        backupFrequency: 'daily',
        retentionPeriod: 90,
        compressionEnabled: true,
      },
    };

    res.status(200).json({
      success: true,
      data: mockSettings
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings'
    });
  }
});

router.post('/settings', authenticateToken, adminAuth, async (req, res) => {
  try {
    const settings = req.body;
    
    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings'
    });
  }
});

module.exports = router;
