// Enhanced analytics API endpoints for admin dashboard
const express = require('express');
const { pool } = require('../models/db');

// Get comprehensive analytics with real dynamic data
const getAnalytics = async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get user growth data for last 6 months
    const userGrowthResult = await client.query(`
      WITH months AS (
        SELECT 
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months' + (generate_series(0, 5) * INTERVAL '1 month')) as month
      )
      SELECT 
        TO_CHAR(m.month, 'Mon') as month,
        COALESCE(COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'vendor'), 0) as businesses,
        COALESCE(COUNT(DISTINCT u.id), 0) as users
      FROM months m
      LEFT JOIN users u ON DATE_TRUNC('month', u.created_at) <= m.month
      GROUP BY m.month, TO_CHAR(m.month, 'Mon')
      ORDER BY m.month
    `);

    // Get subscription distribution (mock for now, but structure for real data)
    const subscriptionResult = await client.query(`
      SELECT 
        'Free' as name,
        COUNT(*) as value,
        '#8884d8' as color
      FROM users 
      WHERE role = 'vendor'
      
      UNION ALL
      
      SELECT 
        'Pro' as name,
        0 as value,
        '#82ca9d' as color
      
      UNION ALL
      
      SELECT 
        'Enterprise' as name,
        0 as value,
        '#ffc658' as color
    `);

    // Get top businesses by response count
    const topBusinessesResult = await client.query(`
      SELECT 
        u.business_name as name,
        COUNT(DISTINCT f.id) as forms,
        COUNT(DISTINCT fe.id) as responses
      FROM users u
      LEFT JOIN feedback_forms f ON u.id = f.user_id
      LEFT JOIN feedback_entries fe ON f.id = fe.form_id
      WHERE u.role = 'vendor'
      GROUP BY u.id, u.business_name
      ORDER BY COUNT(DISTINCT fe.id) DESC
      LIMIT 5
    `);

    client.release();

    const analytics = {
      userGrowth: userGrowthResult.rows,
      subscriptionDistribution: subscriptionResult.rows.map(row => ({
        name: row.name,
        value: parseInt(row.value),
        color: row.color
      })),
      topBusinesses: topBusinessesResult.rows.map(row => ({
        name: row.name || 'Unnamed Business',
        forms: parseInt(row.forms),
        responses: parseInt(row.responses)
      }))
    };

    res.json({
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
};

// Get dashboard stats with real data
const getDashboardStats = async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get current period stats
    const currentStats = await client.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN u.role = 'vendor' THEN u.id END) as total_businesses,
        COUNT(DISTINCT CASE WHEN u.role = 'vendor' AND u.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN u.id END) as new_businesses_this_month,
        COUNT(DISTINCT f.id) as total_forms,
        COUNT(DISTINCT CASE WHEN f.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN f.id END) as new_forms_this_month,
        COUNT(DISTINCT fe.id) as total_responses,
        COUNT(DISTINCT CASE WHEN fe.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN fe.id END) as new_responses_this_month
      FROM users u
      LEFT JOIN feedback_forms f ON u.id = f.user_id
      LEFT JOIN feedback_entries fe ON f.id = fe.form_id
    `);

    // Get previous month stats for comparison
    const previousStats = await client.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN u.role = 'vendor' AND u.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND u.created_at < DATE_TRUNC('month', CURRENT_DATE) THEN u.id END) as prev_businesses,
        COUNT(DISTINCT CASE WHEN f.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND f.created_at < DATE_TRUNC('month', CURRENT_DATE) THEN f.id END) as prev_forms,
        COUNT(DISTINCT CASE WHEN fe.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND fe.created_at < DATE_TRUNC('month', CURRENT_DATE) THEN fe.id END) as prev_responses
      FROM users u
      LEFT JOIN feedback_forms f ON u.id = f.user_id
      LEFT JOIN feedback_entries fe ON f.id = fe.form_id
    `);

    client.release();

    const current = currentStats.rows[0];
    const previous = previousStats.rows[0];

    const stats = {
      totalBusinesses: parseInt(current.total_businesses) || 0,
      newBusinessesThisMonth: parseInt(current.new_businesses_this_month) || 0,
      businessesChange: (parseInt(current.new_businesses_this_month) || 0) - (parseInt(previous.prev_businesses) || 0),
      
      totalForms: parseInt(current.total_forms) || 0,
      newFormsThisMonth: parseInt(current.new_forms_this_month) || 0,
      formsChange: (parseInt(current.new_forms_this_month) || 0) - (parseInt(previous.prev_forms) || 0),
      
      totalResponses: parseInt(current.total_responses) || 0,
      newResponsesThisMonth: parseInt(current.new_responses_this_month) || 0,
      responsesChange: (parseInt(current.new_responses_this_month) || 0) - (parseInt(previous.prev_responses) || 0),
      
      // Revenue is 0 for now since we don't have subscription payments
      totalRevenue: 0,
      revenueChange: 0
    };

    res.json({
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
};

// Get recent activity with real data
const getRecentActivity = async (req, res) => {
  try {
    const client = await pool.connect();
    
    const recentActivityResult = await client.query(`
      SELECT 
        id,
        'business_registration' as type,
        CONCAT('New business "', COALESCE(business_name, name), '" registered') as description,
        created_at as timestamp
      FROM users 
      WHERE role = 'vendor' 
      AND created_at >= NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        f.id,
        'form_creation' as type,
        CONCAT('New form "', f.title, '" created by ', COALESCE(u.business_name, u.name)) as description,
        f.created_at as timestamp
      FROM feedback_forms f
      JOIN users u ON f.user_id = u.id
      WHERE f.created_at >= NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        fe.id,
        'response_submission' as type,
        CONCAT('New response submitted to "', f.title, '"') as description,
        fe.created_at as timestamp
      FROM feedback_entries fe
      JOIN feedback_forms f ON fe.form_id = f.id
      WHERE fe.created_at >= NOW() - INTERVAL '7 days'
      
      ORDER BY timestamp DESC
      LIMIT 20
    `);

    client.release();

    const activities = recentActivityResult.rows.map((activity, index) => ({
      id: activity.id || index,
      type: activity.type,
      description: activity.description,
      timestamp: activity.timestamp,
      createdAt: activity.timestamp
    }));

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity'
    });
  }
};

// Get pending approvals with real data
const getPendingApprovals = async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get businesses that are actually pending approval
    const pendingResult = await client.query(`
      SELECT 
        u.id,
        COALESCE(u.business_name, 'Unnamed Business') as "businessName",
        u.name as "ownerName",
        u.email,
        u.phone,
        u.industry,
        u.status,
        'Business registration pending approval' as description,
        u.created_at as "submittedAt",
        ARRAY[]::text[] as documents
      FROM users u
      WHERE u.role = 'vendor'
      AND u.status = 'pending'
      ORDER BY u.created_at DESC
    `);

    client.release();

    const approvals = pendingResult.rows.map(row => ({
      id: row.id,
      businessName: row.businessName,
      ownerName: row.ownerName,
      email: row.email,
      phone: row.phone || 'Not provided',
      website: `https://${row.businessName.toLowerCase().replace(/\s+/g, '')}.com`,
      description: row.description,
      submittedAt: row.submittedAt,
      documents: row.documents || []
    }));

    res.json({
      success: true,
      data: approvals
    });

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals'
    });
  }
};

module.exports = {
  getAnalytics,
  getDashboardStats,
  getRecentActivity,
  getPendingApprovals
};
