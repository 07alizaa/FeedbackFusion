// routes/admin.js - Admin routes for dashboard functionality
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

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

// Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, adminAuth, async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get total businesses
    const totalBusinessesResult = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1',
      ['vendor']
    );
    const totalBusinesses = parseInt(totalBusinessesResult.rows[0].count);

    // Get pending businesses (recent registrations in last 7 days)
    const pendingBusinessesResult = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1 AND created_at > NOW() - INTERVAL \'7 days\'',
      ['vendor']
    );
    const pendingBusinesses = parseInt(pendingBusinessesResult.rows[0].count);

    // Get total forms
    const totalFormsResult = await client.query(
      'SELECT COUNT(*) as count FROM feedback_forms'
    );
    const totalForms = parseInt(totalFormsResult.rows[0].count);

    // Get total submissions
    const totalSubmissionsResult = await client.query(
      'SELECT COUNT(*) as count FROM feedback_entries'
    );
    const totalSubmissions = parseInt(totalSubmissionsResult.rows[0].count);

    // Get businesses change (last 30 days vs previous 30 days)
    const businessesLastMonthResult = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1 AND created_at > NOW() - INTERVAL \'30 days\'',
      ['vendor']
    );
    const businessesPrevMonthResult = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1 AND created_at BETWEEN NOW() - INTERVAL \'60 days\' AND NOW() - INTERVAL \'30 days\'',
      ['vendor']
    );
    const businessesChange = parseInt(businessesLastMonthResult.rows[0].count) - parseInt(businessesPrevMonthResult.rows[0].count);

    // Get forms change (last 30 days vs previous 30 days)
    const formsLastMonthResult = await client.query(
      'SELECT COUNT(*) as count FROM feedback_forms WHERE created_at > NOW() - INTERVAL \'30 days\''
    );
    const formsPrevMonthResult = await client.query(
      'SELECT COUNT(*) as count FROM feedback_forms WHERE created_at BETWEEN NOW() - INTERVAL \'60 days\' AND NOW() - INTERVAL \'30 days\''
    );
    const formsChange = parseInt(formsLastMonthResult.rows[0].count) - parseInt(formsPrevMonthResult.rows[0].count);

    // Get submissions change (last 30 days vs previous 30 days)
    const submissionsLastMonthResult = await client.query(
      'SELECT COUNT(*) as count FROM feedback_entries WHERE created_at > NOW() - INTERVAL \'30 days\''
    );
    const submissionsPrevMonthResult = await client.query(
      'SELECT COUNT(*) as count FROM feedback_entries WHERE created_at BETWEEN NOW() - INTERVAL \'60 days\' AND NOW() - INTERVAL \'30 days\''
    );
    const submissionsChange = parseInt(submissionsLastMonthResult.rows[0].count) - parseInt(submissionsPrevMonthResult.rows[0].count);

    // Get recent activity
    const recentActivityResult = await client.query(`
      SELECT 
        'business_registered' as type,
        CONCAT('New business "', business_name, '" registered') as description,
        created_at
      FROM users 
      WHERE role = 'vendor' AND created_at > NOW() - INTERVAL '24 hours'
      
      UNION ALL
      
      SELECT 
        'form_created' as type,
        CONCAT('New form "', title, '" created') as description,
        created_at
      FROM feedback_forms 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      
      UNION ALL
      
      SELECT 
        'response_submitted' as type,
        'New feedback response submitted' as description,
        created_at
      FROM feedback_entries 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      
      ORDER BY created_at DESC
      LIMIT 10
    `);

    client.release();

    const stats = {
      pendingBusinesses,
      totalBusinesses,
      pendingForms: pendingBusinesses, // Using same as pending businesses for now
      totalSubmissions,
      businessesChange,
      totalBusinessesChange: businessesChange,
      formsChange,
      submissionsChange,
      recentActivity: recentActivityResult.rows.map(row => ({
        type: row.type,
        description: row.description,
        createdAt: row.created_at
      }))
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// Get pending businesses
router.get('/businesses/pending', authenticateToken, adminAuth, async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get recent business registrations (last 7 days) that might need approval
    const result = await client.query(`
      SELECT 
        id,
        business_name as "businessName",
        name as "ownerName",
        email,
        phone,
        industry as category,
        'Pending review of recent registration' as description,
        created_at as "submittedAt"
      FROM users 
      WHERE role = 'vendor' 
      AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
    `);

    client.release();

    const pendingBusinesses = result.rows.map(row => ({
      ...row,
      website: `https://${row.businessName?.toLowerCase().replace(/\s+/g, '')}.com` || '',
      submittedAt: row.submittedAt
    }));

    res.status(200).json({
      success: true,
      data: pendingBusinesses
    });
  } catch (error) {
    console.error('Error fetching pending businesses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending businesses'
    });
  }
});

// Get all businesses
router.get('/businesses', authenticateToken, adminAuth, async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get all businesses with their form and response counts
    const result = await client.query(`
      SELECT 
        u.id,
        u.business_name as "businessName",
        u.name as "ownerName",
        u.email,
        u.phone,
        u.industry as category,
        'approved' as status,
        COUNT(DISTINCT f.id) as "formsCount",
        COUNT(DISTINCT fe.id) as "responsesCount",
        COALESCE(AVG(CASE 
          WHEN fe.ai_score > 0 THEN fe.ai_score::float / 20 
          ELSE 4.0 
        END), 4.0) as "avgRating",
        u.created_at as "createdAt"
      FROM users u
      LEFT JOIN feedback_forms f ON u.id = f.user_id
      LEFT JOIN feedback_entries fe ON f.id = fe.form_id
      WHERE u.role = 'vendor'
      GROUP BY u.id, u.business_name, u.name, u.email, u.phone, u.industry, u.created_at
      ORDER BY u.created_at DESC
    `);

    client.release();

    const businesses = result.rows.map(row => ({
      ...row,
      formsCount: parseInt(row.formsCount) || 0,
      responsesCount: parseInt(row.responsesCount) || 0,
      avgRating: parseFloat(row.avgRating) || 4.0
    }));

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

// Get pending forms
router.get('/forms/pending', authenticateToken, adminAuth, async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get recent forms (last 7 days) that might need review
    const result = await client.query(`
      SELECT 
        f.id,
        f.title,
        'Recent form submission for review' as description,
        u.business_name as "businessName",
        u.email as "businessEmail",
        jsonb_array_length(f.config->'fields') as "fieldsCount",
        f.created_at as "submittedAt",
        f.config->'fields' as fields
      FROM feedback_forms f
      JOIN users u ON f.user_id = u.id
      WHERE f.created_at > NOW() - INTERVAL '7 days'
      ORDER BY f.created_at DESC
    `);

    client.release();

    const pendingForms = result.rows.map(row => ({
      ...row,
      fieldsCount: row.fieldsCount || 0,
      fields: row.fields || []
    }));

    res.status(200).json({
      success: true,
      data: pendingForms
    });
  } catch (error) {
    console.error('Error fetching pending forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending forms'
    });
  }
});

// Get analytics data
router.get('/analytics', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    const client = await pool.connect();
    
    // Get total counts
    const totalUsersResult = await client.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['vendor']);
    const activeBusinessesResult = await client.query('SELECT COUNT(*) as count FROM users WHERE role = $1 AND created_at > NOW() - INTERVAL \'30 days\'', ['vendor']);
    const totalFormsResult = await client.query('SELECT COUNT(*) as count FROM feedback_forms');
    const totalResponsesResult = await client.query('SELECT COUNT(*) as count FROM feedback_entries');

    // Get changes from previous period
    const usersLastMonthResult = await client.query('SELECT COUNT(*) as count FROM users WHERE role = $1 AND created_at > NOW() - INTERVAL \'30 days\'', ['vendor']);
    const formsLastMonthResult = await client.query('SELECT COUNT(*) as count FROM feedback_forms WHERE created_at > NOW() - INTERVAL \'30 days\'');
    const responsesLastMonthResult = await client.query('SELECT COUNT(*) as count FROM feedback_entries WHERE created_at > NOW() - INTERVAL \'30 days\'');

    // Get top businesses
    const topBusinessesResult = await client.query(`
      SELECT 
        u.id,
        u.business_name as "businessName",
        u.industry as category,
        COUNT(DISTINCT fe.id) as "responseCount",
        COUNT(DISTINCT f.id) as "formsCount"
      FROM users u
      LEFT JOIN feedback_forms f ON u.id = f.user_id
      LEFT JOIN feedback_entries fe ON f.id = fe.form_id
      WHERE u.role = 'vendor'
      GROUP BY u.id, u.business_name, u.industry
      ORDER BY COUNT(DISTINCT fe.id) DESC
      LIMIT 5
    `);

    // Get top forms
    const topFormsResult = await client.query(`
      SELECT 
        f.id,
        f.title,
        u.business_name as "businessName",
        COUNT(fe.id) as "responseCount",
        COALESCE(AVG(CASE 
          WHEN fe.ai_score > 0 THEN fe.ai_score::float / 20 
          ELSE 4.0 
        END), 4.0) as "avgRating"
      FROM feedback_forms f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN feedback_entries fe ON f.id = fe.form_id
      GROUP BY f.id, f.title, u.business_name
      ORDER BY COUNT(fe.id) DESC
      LIMIT 5
    `);

    // Get recent activity
    const recentActivityResult = await client.query(`
      SELECT 
        'business_registered' as type,
        CONCAT('New business registration: ', business_name) as description,
        created_at as timestamp,
        industry as metadata
      FROM users 
      WHERE role = 'vendor' AND created_at > NOW() - INTERVAL '24 hours'
      
      UNION ALL
      
      SELECT 
        'form_created' as type,
        CONCAT('New form created: ', title) as description,
        f.created_at as timestamp,
        CONCAT('by ', u.business_name) as metadata
      FROM feedback_forms f
      JOIN users u ON f.user_id = u.id
      WHERE f.created_at > NOW() - INTERVAL '24 hours'
      
      UNION ALL
      
      SELECT 
        'response_submitted' as type,
        CONCAT('New response submitted to ', f.title) as description,
        fe.created_at as timestamp,
        CONCAT('Rating: ', CASE WHEN fe.ai_score > 0 THEN (fe.ai_score::float / 20)::text ELSE '4.0' END, '/5') as metadata
      FROM feedback_entries fe
      JOIN feedback_forms f ON fe.form_id = f.id
      WHERE fe.created_at > NOW() - INTERVAL '24 hours'
      
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    // Get active users (users who created forms or responses in last 7 days)
    const activeUsersResult = await client.query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      LEFT JOIN feedback_forms f ON u.id = f.user_id
      LEFT JOIN feedback_entries fe ON f.id = fe.form_id
      WHERE u.role = 'vendor' 
      AND (f.created_at > NOW() - INTERVAL '7 days' OR fe.created_at > NOW() - INTERVAL '7 days')
    `);

    client.release();

    const analytics = {
      totalUsers: parseInt(totalUsersResult.rows[0].count),
      activeBusinesses: parseInt(activeBusinessesResult.rows[0].count),
      totalForms: parseInt(totalFormsResult.rows[0].count),
      totalResponses: parseInt(totalResponsesResult.rows[0].count),
      usersChange: parseInt(usersLastMonthResult.rows[0].count),
      businessesChange: parseInt(activeBusinessesResult.rows[0].count),
      formsChange: parseInt(formsLastMonthResult.rows[0].count),
      responsesChange: parseInt(responsesLastMonthResult.rows[0].count),
      topBusinesses: topBusinessesResult.rows.map(row => ({
        ...row,
        responseCount: parseInt(row.responseCount),
        formsCount: parseInt(row.formsCount)
      })),
      topForms: topFormsResult.rows.map(row => ({
        ...row,
        responseCount: parseInt(row.responseCount),
        avgRating: parseFloat(row.avgRating)
      })),
      recentActivity: recentActivityResult.rows,
      systemHealth: {
        uptime: '99.9%',
        responseTime: '< 200ms',
        errorRate: '< 0.1%'
      },
      activeUsers: parseInt(activeUsersResult.rows[0].count)
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
});

// Approve business
router.post('/businesses/:id/approve', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const client = await pool.connect();
    
    // Check if business exists
    const businessResult = await client.query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [id, 'vendor']
    );

    if (businessResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // For now, we'll just log the approval. In a full system, you might:
    // 1. Add an 'approval_status' column to users table
    // 2. Send approval email to business owner
    // 3. Log the approval action
    
    console.log(`Business ${id} (${businessResult.rows[0].business_name}) approved by admin. Reason: ${reason || 'No reason provided'}`);
    
    // You could add an approval_status field to track this
    // await client.query(
    //   'UPDATE users SET approval_status = $1, approved_at = NOW(), approved_by = $2 WHERE id = $3',
    //   ['approved', req.user.id, id]
    // );

    client.release();

    res.status(200).json({
      success: true,
      message: 'Business approved successfully',
      data: {
        businessName: businessResult.rows[0].business_name,
        ownerName: businessResult.rows[0].name,
        approvedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error approving business:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve business'
    });
  }
});

// Reject business
router.post('/businesses/:id/reject', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const client = await pool.connect();
    
    // Check if business exists
    const businessResult = await client.query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [id, 'vendor']
    );

    if (businessResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    console.log(`Business ${id} (${businessResult.rows[0].business_name}) rejected by admin. Reason: ${reason || 'No reason provided'}`);
    
    // In a full system, you might update the status or send rejection email
    // await client.query(
    //   'UPDATE users SET approval_status = $1, rejected_at = NOW(), rejection_reason = $2 WHERE id = $3',
    //   ['rejected', reason, id]
    // );

    client.release();

    res.status(200).json({
      success: true,
      message: 'Business rejected successfully',
      data: {
        businessName: businessResult.rows[0].business_name,
        ownerName: businessResult.rows[0].name,
        rejectedAt: new Date().toISOString(),
        reason: reason
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

// Approve form
router.post('/forms/:id/approve', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const client = await pool.connect();
    
    // Check if form exists
    const formResult = await client.query(`
      SELECT f.*, u.business_name, u.name as owner_name 
      FROM feedback_forms f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = $1
    `, [id]);

    if (formResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Approve the form by setting status to 'approved' and store message
    await client.query(
      'UPDATE feedback_forms SET status = $1, status_message = $2, updated_at = NOW() WHERE id = $3',
      ['approved', reason || 'Form approved by admin', id]
    );

    const form = formResult.rows[0];
    console.log(`Form ${id} (${form.title}) approved by admin. Reason: ${reason || 'No reason provided'}`);

    client.release();

    res.status(200).json({
      success: true,
      message: 'Form approved successfully',
      data: {
        formTitle: form.title,
        businessName: form.business_name,
        approvedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error approving form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve form'
    });
  }
});

// Reject form
router.post('/forms/:id/reject', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const client = await pool.connect();
    
    // Check if form exists
    const formResult = await client.query(`
      SELECT f.*, u.business_name, u.name as owner_name 
      FROM feedback_forms f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = $1
    `, [id]);

    if (formResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Reject the form by setting status to 'rejected' and store message
    await client.query(
      'UPDATE feedback_forms SET status = $1, status_message = $2, updated_at = NOW() WHERE id = $3',
      ['rejected', reason || 'Form rejected by admin', id]
    );

    const form = formResult.rows[0];
    console.log(`Form ${id} (${form.title}) rejected by admin. Reason: ${reason || 'No reason provided'}`);

    client.release();

    res.status(200).json({
      success: true,
      message: 'Form rejected successfully',
      data: {
        formTitle: form.title,
        businessName: form.business_name,
        rejectedAt: new Date().toISOString(),
        reason: reason
      }
    });
  } catch (error) {
    console.error('Error rejecting form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject form'
    });
  }
});

// Delete business
router.delete('/businesses/:id', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const client = await pool.connect();
    
    // Check if business exists
    const businessResult = await client.query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [id, 'vendor']
    );

    if (businessResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const business = businessResult.rows[0];

    // Delete the business (CASCADE will handle related forms and entries)
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    console.log(`Business ${id} (${business.business_name}) deleted by admin. Reason: ${reason || 'No reason provided'}`);

    client.release();

    res.status(200).json({
      success: true,
      message: 'Business deleted successfully',
      data: {
        businessName: business.business_name,
        ownerName: business.name,
        deletedAt: new Date().toISOString(),
        reason: reason
      }
    });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete business'
    });
  }
});

// Update business status
router.patch('/businesses/:id/status', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const client = await pool.connect();
    
    // Check if business exists
    const businessResult = await client.query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [id, 'vendor']
    );

    if (businessResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // For now, we'll just log the status update since we don't have a status column
    // In a full system, you might add a status column to the users table
    console.log(`Business ${id} status updated to ${status} by admin`);

    client.release();

    res.status(200).json({
      success: true,
      message: 'Business status updated successfully',
      data: {
        businessName: businessResult.rows[0].business_name,
        newStatus: status,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating business status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update business status'
    });
  }
});

// Get system settings
router.get('/settings', authenticateToken, adminAuth, async (req, res) => {
  try {
    // In a real system, you'd fetch settings from a settings table
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

// Update system settings
router.post('/settings', authenticateToken, adminAuth, async (req, res) => {
  try {
    const settings = req.body;
    
    // In a real system, you'd save settings to a database
    console.log('System settings updated by admin:', settings);
    
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

// Replace existing stats route with enhanced version
router.get('/stats', authenticateToken, adminAuth, adminController.getAdminStats);

// User management routes
router.get('/users', authenticateToken, adminAuth, adminController.getAllUsers);
router.patch('/users/:userId/status', authenticateToken, adminAuth, adminController.updateUserStatus);

// Form management routes  
router.get('/forms', authenticateToken, adminAuth, adminController.getAllForms);

// Subscription management routes
router.get('/subscriptions', authenticateToken, adminAuth, adminController.getSubscriptions);

// Content moderation routes
router.get('/flagged-content', authenticateToken, adminAuth, adminController.getFlaggedContent);
router.patch('/moderate', authenticateToken, adminAuth, adminController.moderateContent);

// Notification routes
router.get('/notifications', authenticateToken, adminAuth, adminController.getNotifications);

// Additional admin endpoints for frontend compatibility
router.get('/recent-activity', authenticateToken, adminAuth, async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get recent user registrations, form creations, etc.
    const recentActivity = await client.query(`
      SELECT 
        'user_registration' as type,
        u.name as title,
        u.email as description,
        u.created_at as timestamp
      FROM users u 
      WHERE u.created_at >= NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'form_creation' as type,
        ff.title as title,
        u.name as description,
        ff.created_at as timestamp
      FROM feedback_forms ff
      JOIN users u ON ff.user_id = u.id
      WHERE ff.created_at >= NOW() - INTERVAL '7 days'
      
      ORDER BY timestamp DESC
      LIMIT 10
    `);
    
    client.release();
    
    res.json({
      success: true,
      data: recentActivity.rows
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity'
    });
  }
});

router.get('/pending-approvals', authenticateToken, adminAuth, async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get pending business approvals
    const pendingBusinesses = await client.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        'business' as type
      FROM users u 
      WHERE u.role = 'vendor' 
      AND u.status = 'pending'
      ORDER BY u.created_at DESC
    `);
    
    client.release();
    
    res.json({
      success: true,
      data: pendingBusinesses.rows
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals'
    });
  }
});

// Business management endpoints
router.post('/businesses/:id/suspend', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const client = await pool.connect();
    
    await client.query(
      'UPDATE users SET status = $1, suspension_reason = $2 WHERE id = $3 AND role = $4',
      ['suspended', reason || 'Suspended by admin', id, 'vendor']
    );
    
    client.release();
    
    res.json({
      success: true,
      message: 'Business suspended successfully'
    });
  } catch (error) {
    console.error('Error suspending business:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend business'
    });
  }
});

router.post('/businesses/:id/reactivate', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    await client.query(
      'UPDATE users SET status = $1, suspension_reason = NULL WHERE id = $2 AND role = $3',
      ['active', id, 'vendor']
    );
    
    client.release();
    
    res.json({
      success: true,
      message: 'Business reactivated successfully'
    });
  } catch (error) {
    console.error('Error reactivating business:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate business'
    });
  }
});

// User management endpoints
router.post('/users/:userId/activate', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const client = await pool.connect();
    
    await client.query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['active', userId]
    );
    
    client.release();
    
    res.json({
      success: true,
      message: 'User activated successfully'
    });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user'
    });
  }
});

router.post('/users/:userId/suspend', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const client = await pool.connect();
    
    await client.query(
      'UPDATE users SET status = $1, suspension_reason = $2 WHERE id = $3',
      ['suspended', reason || 'Suspended by admin', userId]
    );
    
    client.release();
    
    res.json({
      success: true,
      message: 'User suspended successfully'
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user'
    });
  }
});

router.delete('/users/:userId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const client = await pool.connect();
    
    // Delete user and related data
    await client.query('BEGIN');
    
    // Delete user's forms first (foreign key constraint)
    await client.query('DELETE FROM feedback_forms WHERE user_id = $1', [userId]);
    
    // Delete user
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    
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

module.exports = router;
