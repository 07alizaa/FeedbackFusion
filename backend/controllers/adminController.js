// controllers/adminController.js - Admin management endpoints
const { pool } = require('../models/db');

// Get admin dashboard statistics
const getAdminStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if user is admin
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userCheck.rows[0] || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get total users
    const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Get new users this month
    const newUsersResult = await pool.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);
    const newUsersThisMonth = parseInt(newUsersResult.rows[0].count);

    // Get active forms
    const activeFormsResult = await pool.query(`
      SELECT COUNT(*) as count FROM feedback_forms 
      WHERE status = 'active'
    `);
    const activeForms = parseInt(activeFormsResult.rows[0].count);

    // Get new forms this month
    const newFormsResult = await pool.query(`
      SELECT COUNT(*) as count FROM feedback_forms 
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);
    const newFormsThisMonth = parseInt(newFormsResult.rows[0].count);

    // Get revenue data (from subscriptions)
    const revenueResult = await pool.query(`
      SELECT 
        COALESCE(SUM(sp.price), 0) as total_revenue,
        COALESCE(SUM(CASE 
          WHEN DATE_TRUNC('month', s.created_at) = DATE_TRUNC('month', CURRENT_DATE) 
          THEN sp.price ELSE 0 END), 0) as revenue_this_month
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.status = 'active'
    `);
    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue || 0);
    const revenueThisMonth = parseFloat(revenueResult.rows[0].revenue_this_month || 0);

    // Get flagged content count
    const flaggedContentResult = await pool.query(`
      SELECT COUNT(*) as count FROM feedback_entries 
      WHERE is_flagged = true
    `);
    const flaggedContent = parseInt(flaggedContentResult.rows[0].count);

    // Get user growth data (last 7 days)
    const userGrowthResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    const userGrowth = {
      labels: userGrowthResult.rows.map(row => 
        new Date(row.date).toLocaleDateString()
      ),
      data: userGrowthResult.rows.map(row => parseInt(row.count))
    };

    // Get subscription distribution
    const subscriptionDistResult = await pool.query(`
      SELECT 
        sp.name,
        COUNT(*) as count
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.status = 'active'
      GROUP BY sp.name
    `);

    const subscriptionDistribution = {};
    subscriptionDistResult.rows.forEach(row => {
      subscriptionDistribution[row.name.toLowerCase()] = parseInt(row.count);
    });

    // Add free users (users without subscriptions)
    const freeUsersResult = await pool.query(`
      SELECT COUNT(*) as count FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE s.id IS NULL OR s.status != 'active'
    `);
    subscriptionDistribution.free = parseInt(freeUsersResult.rows[0].count);

    const stats = {
      totalUsers,
      newUsersThisMonth,
      activeForms,
      newFormsThisMonth,
      totalRevenue,
      revenueThisMonth,
      flaggedContent,
      userGrowth,
      subscriptionDistribution
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics'
    });
  }
};

// Get all users for admin management
const getAllUsers = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if user is admin
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userCheck.rows[0] || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // SECURITY: Validate and sanitize pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50)); // Max 100 items per page
    const offset = (page - 1) * limit;

    const usersResult = await pool.query(`
      SELECT 
        u.id,
        u.name as username,
        u.email,
        u.role,
        u.business_name,
        u.phone,
        u.industry,
        u.status,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.role != 'admin'
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const totalResult = await pool.query(`
      SELECT COUNT(*) as count FROM users WHERE role != 'admin'
    `);
    const total = parseInt(totalResult.rows[0].count);

    // Format the response data
    const users = usersResult.rows.map(user => ({
      id: user.id,
      username: user.username || 'N/A',
      email: user.email,
      role: user.role,
      businessName: user.business_name,
      phone: user.phone,
      industry: user.industry,
      status: user.status || 'approved',
      createdAt: user.created_at,
      lastLogin: user.updated_at || user.created_at,
      isFlagged: false,
      verificationStatus: user.status || 'approved',
      subscription: 'Free'
    }));

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const targetUserId = req.params.userId;
    const { status } = req.body;
    
    // SECURITY: Validate input parameters
    if (!targetUserId || isNaN(parseInt(targetUserId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'  // Generic error message
      });
    }

    if (!status || !['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'  // Generic error message
      });
    }
    
    // Check if user is admin
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userCheck.rows[0] || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Update user status
    await pool.query(
      'UPDATE users SET verification_status = $1 WHERE id = $2',
      [status, targetUserId]
    );

    // Log admin action
    await pool.query(`
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      userId,
      'update_user_status',
      'user',
      targetUserId,
      JSON.stringify({ status })
    ]);

    res.json({
      success: true,
      message: 'User status updated successfully'
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

// Get all forms for admin review
const getAllForms = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if user is admin
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userCheck.rows[0] || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const formsResult = await pool.query(`
      SELECT 
        f.id,
        f.title,
        f.description,
        f.status,
        f.created_at,
        f.view_count,
        u.username as owner,
        COUNT(fe.id) as response_count
      FROM feedback_forms f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN feedback_entries fe ON f.id = fe.form_id
      GROUP BY f.id, u.username
      ORDER BY f.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const totalResult = await pool.query('SELECT COUNT(*) as count FROM feedback_forms');
    const total = parseInt(totalResult.rows[0].count);

    res.json({
      success: true,
      forms: formsResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forms'
    });
  }
};

// Get subscription analytics
const getSubscriptions = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if user is admin
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userCheck.rows[0] || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const subscriptionsResult = await pool.query(`
      SELECT 
        s.id,
        s.status,
        s.created_at,
        s.current_period_end,
        sp.name as plan_name,
        sp.price,
        u.username,
        u.email
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);

    res.json({
      success: true,
      subscriptions: subscriptionsResult.rows
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
};

// Get flagged content for moderation
const getFlaggedContent = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if user is admin
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userCheck.rows[0] || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const flaggedResult = await pool.query(`
      SELECT 
        fe.id,
        fe.content,
        fe.flag_reason,
        fe.created_at,
        f.title as form_title,
        u.username as form_owner
      FROM feedback_entries fe
      JOIN feedback_forms f ON fe.form_id = f.id
      JOIN users u ON f.user_id = u.id
      WHERE fe.is_flagged = true
      ORDER BY fe.created_at DESC
    `);

    const content = flaggedResult.rows.map(row => ({
      id: row.id,
      type: 'feedback_entry',
      content: row.content,
      reason: row.flag_reason,
      form_title: row.form_title,
      reporter: row.form_owner,
      created_at: row.created_at
    }));

    res.json({
      success: true,
      content
    });

  } catch (error) {
    console.error('Error fetching flagged content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flagged content'
    });
  }
};

// Moderate content (approve/reject)
const moderateContent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { contentId, action, contentType } = req.body;
    
    // Check if user is admin
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userCheck.rows[0] || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    if (contentType === 'feedback_entry') {
      if (action === 'approve') {
        await pool.query(
          'UPDATE feedback_entries SET is_flagged = false, flag_reason = NULL WHERE id = $1',
          [contentId]
        );
      } else if (action === 'reject') {
        await pool.query(
          'DELETE FROM feedback_entries WHERE id = $1',
          [contentId]
        );
      }
    }

    // Log admin action
    await pool.query(`
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      userId,
      `moderate_${action}`,
      contentType,
      contentId,
      JSON.stringify({ action })
    ]);

    res.json({
      success: true,
      message: `Content ${action}ed successfully`
    });

  } catch (error) {
    console.error('Error moderating content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate content'
    });
  }
};

// Get system notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if user is admin
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userCheck.rows[0] || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const notificationsResult = await pool.query(`
      SELECT 
        id,
        type,
        title,
        message,
        data,
        is_read,
        created_at
      FROM notifications
      WHERE user_id IS NULL OR user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);

    res.json({
      success: true,
      notifications: notificationsResult.rows
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  updateUserStatus,
  getAllForms,
  getSubscriptions,
  getFlaggedContent,
  moderateContent,
  getNotifications
};
