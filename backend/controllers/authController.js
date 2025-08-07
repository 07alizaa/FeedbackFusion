// controllers/authController.js - Authentication logic
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Generate JWT token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Signup controller
const signup = async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    role = 'vendor',
    businessName,
    phone,
    industry,
    companySize,
    marketingOptIn = false
  } = req.body;

  try {
    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate role
    if (!['vendor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either vendor or admin'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user (vendors start as pending approval)
    const userStatus = role === 'admin' ? 'approved' : 'pending';
    const newUser = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, business_name, phone, industry, company_size, marketing_opt_in, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING id, name, email, role, business_name, phone, industry, company_size, status, created_at`,
      [
        name.trim(), 
        email.toLowerCase(), 
        hashedPassword, 
        role,
        businessName || null,
        phone || null,
        industry || null,
        companySize || null,
        marketingOptIn,
        userStatus
      ]
    );

    const user = newUser.rows[0];

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    // Emit real-time notification for new business registration (only for vendors)
    if (role === 'vendor' && typeof global.emitNotification === 'function') {
      global.emitNotification('business_registered', {
        id: user.id,
        businessName: businessName || name,
        ownerName: name,
        email: email,
        industry: industry || 'Not specified',
        registeredAt: user.created_at
      });
    }

    res.status(201).json({
      success: true,
      message: userStatus === 'pending' 
        ? 'Registration successful! Your account is pending admin approval. You will be notified once approved.'
        : 'User created successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          businessName: user.business_name,
          status: user.status,
          createdAt: user.created_at
        },
        token: userStatus === 'approved' ? token : null,
        requiresApproval: userStatus === 'pending'
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during signup'
    });
  }
};

// Login controller
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check for hardcoded admin credentials
    if (email.toLowerCase() === 'admin@feedbackfusion.com' && password === 'admin123456') {
      // Generate JWT token for admin
      const token = generateToken('admin', 'admin@feedbackfusion.com', 'admin');

      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        data: {
          user: {
            id: 'admin',
            name: 'System Administrator',
            email: 'admin@feedbackfusion.com',
            role: 'admin',
            createdAt: new Date().toISOString()
          },
          token
        }
      });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token (allow login regardless of approval status)
    const token = generateToken(user.id, user.email, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          businessName: user.business_name,
          status: user.status,
          createdAt: user.created_at
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Handle admin user specially since admin doesn't exist in the users table
    if (userId === 'admin') {
      return res.status(200).json({
        success: true,
        data: {
          id: 'admin',
          name: 'Administrator',
          email: 'admin@feedbackfusion.com',
          role: 'admin',
          business_name: null,
          phone: null,
          industry: null,
          company_size: null,
          created_at: new Date().toISOString()
        }
      });
    }

    const userResult = await pool.query(
      'SELECT id, name, email, role, business_name, phone, industry, company_size, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          business_name: user.business_name,
          phone: user.phone,
          industry: user.industry,
          company_size: user.company_size,
          created_at: user.created_at
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, business_name, phone, industry, company_size } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Update user profile
    const updateResult = await pool.query(
      `UPDATE users 
       SET name = $1, business_name = $2, phone = $3, industry = $4, company_size = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING id, name, email, role, business_name, phone, industry, company_size, created_at`,
      [
        name.trim(),
        business_name || null,
        phone || null,
        industry || null,
        company_size || null,
        userId
      ]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = updateResult.rows[0];

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          business_name: user.business_name,
          phone: user.phone,
          industry: user.industry,
          company_size: user.company_size,
          created_at: user.created_at
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile
};