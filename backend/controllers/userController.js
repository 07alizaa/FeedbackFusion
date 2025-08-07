const pool = require('../db');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, email, role, business_name, phone, industry, 
        company_size, status, approval_description, created_at, updated_at
      FROM users 
      WHERE role = 'vendor'
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: {
        users: result.rows
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users'
    });
  }
};

// Get pending users (admin only)
const getPendingUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, email, role, business_name, phone, industry, 
        company_size, status, created_at
      FROM users 
      WHERE role = 'vendor' AND status = 'pending'
      ORDER BY created_at ASC
    `);

    res.status(200).json({
      success: true,
      data: {
        users: result.rows
      }
    });

  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching pending users'
    });
  }
};

// Approve user (admin only)
const approveUser = async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  try {
    // Validate user ID
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Update user status to approved
    const result = await pool.query(
      `UPDATE users 
       SET status = 'approved', approval_description = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND role = 'vendor'
       RETURNING id, name, email, business_name, status`,
      [description || 'Account approved by admin', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Emit real-time notification for user approval
    if (typeof global.emitNotification === 'function') {
      global.emitNotification('user_approved', {
        userId: user.id,
        userName: user.name,
        businessName: user.business_name,
        email: user.email,
        approvedAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while approving user'
    });
  }
};

// Reject user (admin only)
const rejectUser = async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  try {
    // Validate user ID
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Validate rejection reason
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Update user status to rejected
    const result = await pool.query(
      `UPDATE users 
       SET status = 'rejected', approval_description = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND role = 'vendor'
       RETURNING id, name, email, business_name, status`,
      [description.trim(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Emit real-time notification for user rejection
    if (typeof global.emitNotification === 'function') {
      global.emitNotification('user_rejected', {
        userId: user.id,
        userName: user.name,
        businessName: user.business_name,
        email: user.email,
        rejectedAt: new Date(),
        reason: description.trim()
      });
    }

    res.status(200).json({
      success: true,
      message: 'User rejected successfully',
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while rejecting user'
    });
  }
};

// Get user statistics (admin only)
const getUserStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_users,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_users,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_users
      FROM users 
      WHERE role = 'vendor'
    `);

    res.status(200).json({
      success: true,
      data: {
        stats: stats.rows[0]
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user statistics'
    });
  }
};

module.exports = {
  getAllUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
  getUserStats
};
