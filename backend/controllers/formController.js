// controllers/formController.js - Form management logic
const pool = require('../db');
const { scoreAndFlagFeedback } = require('../utils/aiHelper');
const { validateFormConfig, normalizeFormConfig } = require('../utils/formTypes');

// Create a new feedback form (vendor only)
const createForm = async (req, res) => {
  const { title, config } = req.body;
  const userId = req.user.userId;

  try {
    // Check if user is approved (skip for admin)
    if (userId !== 'admin') {
      const userResult = await pool.query(
        'SELECT status FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userStatus = userResult.rows[0].status;
      if (userStatus !== 'approved') {
        let message;
        switch (userStatus) {
          case 'pending':
            message = 'Your account is pending admin approval. You cannot create forms until your account is approved.';
            break;
          case 'rejected':
            message = 'Your account has been rejected. You cannot create forms.';
            break;
          default:
            message = 'Your account is not approved for creating forms.';
        }
        
        return res.status(403).json({
          success: false,
          message,
          accountStatus: userStatus
        });
      }
    }

    // Input validation
    if (!title || !config) {
      return res.status(400).json({
        success: false,
        message: 'Title and config are required'
      });
    }

    // Validate title length
    if (title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 3 characters long'
      });
    }

    // Validate config is a valid JSON object
    if (typeof config !== 'object' || Array.isArray(config)) {
      return res.status(400).json({
        success: false,
        message: 'Config must be a valid JSON object'
      });
    }

    // Validate form configuration structure
    const configValidation = validateFormConfig(config);
    if (!configValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form configuration',
        errors: configValidation.errors
      });
    }

    // Normalize the configuration (ensure proper field IDs, etc.)
    const normalizedConfig = normalizeFormConfig(config);

    // Create new form
    const newForm = await pool.query(
      `INSERT INTO feedback_forms (user_id, title, config, is_active, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, user_id, title, config, is_active, status, created_at, updated_at`,
      [userId, title.trim(), JSON.stringify(normalizedConfig), true, 'pending']
    );

    const form = newForm.rows[0];

    // Get user/business info for notification
    const userResult = await pool.query(
      'SELECT name, business_name FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    // Emit real-time notification for new form creation
    if (typeof global.emitNotification === 'function') {
      global.emitNotification('form_created', {
        id: form.id,
        title: form.title,
        businessName: user?.business_name || user?.name || 'Unknown Business',
        createdAt: form.created_at,
        fieldsCount: normalizedConfig.fields?.length || 0
      });
    }

    res.status(201).json({
      success: true,
      message: 'Form created successfully',
      data: {
        form: {
          id: form.id,
          userId: form.user_id,
          title: form.title,
          config: form.config,
          isActive: form.is_active,
          status: form.status,
          createdAt: form.created_at,
          updatedAt: form.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating form'
    });
  }
};

// Get a specific form by ID (public access for form display)
const getFormById = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }

    // Get form details (only active and approved forms for public access)
    const formResult = await pool.query(
      `SELECT f.id, f.title, f.config, f.is_active, f.status, f.created_at, u.name as vendor_name 
       FROM feedback_forms f 
       JOIN users u ON f.user_id = u.id 
       WHERE f.id = $1 AND f.is_active = true AND f.status = 'approved'`,
      [id]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found, inactive, or not approved'
      });
    }

    const form = formResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        form: {
          id: form.id,
          title: form.title,
          config: form.config,
          isActive: form.is_active,
          createdAt: form.created_at,
          vendorName: form.vendor_name
        }
      }
    });

  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching form'
    });
  }
};

// Get all forms for the logged-in vendor
const getVendorForms = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Handle admin user specially - return empty array since admin doesn't have vendor forms
    if (userId === 'admin') {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Get all forms created by the vendor with entry counts and approval status
    const formsResult = await pool.query(
      `SELECT f.*, 
              COUNT(fe.id) as entry_count,
              COUNT(CASE WHEN fe.wants_to_be_contacted = true THEN 1 END) as contact_entries_count
       FROM feedback_forms f 
       LEFT JOIN feedback_entries fe ON f.id = fe.form_id 
       WHERE f.user_id = $1 
       GROUP BY f.id 
       ORDER BY f.created_at DESC`,
      [userId]
    );

    const forms = formsResult.rows.map(form => ({
      id: form.id,
      title: form.title,
      description: form.description || '',
      config: form.config,
      isActive: form.is_active,
      status: form.status || 'pending', // Include approval status
      statusMessage: form.status_message || null, // Include status message
      createdAt: form.created_at,
      updatedAt: form.updated_at,
      entryCount: parseInt(form.entry_count),
      contactEntriesCount: parseInt(form.contact_entries_count),
      responses_count: parseInt(form.entry_count), // Alias for compatibility
      created_at: form.created_at, // Alias for compatibility
      is_active: form.is_active // Alias for compatibility
    }));

    res.status(200).json({
      success: true,
      data: {
        forms,
        totalForms: forms.length
      }
    });

  } catch (error) {
    console.error('Get vendor forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching forms'
    });
  }
};

// Get a specific form by ID for vendor editing (vendor can access their own forms regardless of status)
const getVendorFormById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }

    // Handle admin user specially - allow access to any form
    let queryCondition = 'f.id = $1';
    let queryParams = [id];
    
    if (userId !== 'admin') {
      queryCondition += ' AND f.user_id = $2';
      queryParams.push(userId);
    }

    // Get form details (vendor can access their own forms regardless of status)
    const formResult = await pool.query(
      `SELECT f.*, u.name as vendor_name, u.business_name 
       FROM feedback_forms f 
       JOIN users u ON f.user_id = u.id 
       WHERE ${queryCondition}`,
      queryParams
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const form = formResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        form: {
          id: form.id,
          title: form.title,
          description: form.description,
          config: form.config,
          isActive: form.is_active,
          status: form.status,
          createdAt: form.created_at,
          updatedAt: form.updated_at,
          vendorName: form.vendor_name,
          businessName: form.business_name
        }
      }
    });

  } catch (error) {
    console.error('Get vendor form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching form'
    });
  }
};

// Update a form (vendor only, own forms only)
const updateForm = async (req, res) => {
  const { id } = req.params;
  const { title, config, isActive } = req.body;
  const userId = req.user.userId;

  try {
    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }

    // Check if form exists and belongs to the vendor
    const existingForm = await pool.query(
      'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingForm.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or you do not have permission to modify it'
      });
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];
    let parameterIndex = 1;

    if (title !== undefined) {
      if (title.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Title must be at least 3 characters long'
        });
      }
      updateFields.push(`title = $${parameterIndex}`);
      updateValues.push(title.trim());
      parameterIndex++;
    }

    if (config !== undefined) {
      if (typeof config !== 'object' || Array.isArray(config)) {
        return res.status(400).json({
          success: false,
          message: 'Config must be a valid JSON object'
        });
      }

      // Validate form configuration structure
      const configValidation = validateFormConfig(config);
      if (!configValidation.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid form configuration',
          errors: configValidation.errors
        });
      }

      // Normalize the configuration
      const normalizedConfig = normalizeFormConfig(config);
      
      updateFields.push(`config = $${parameterIndex}`);
      updateValues.push(JSON.stringify(normalizedConfig));
      parameterIndex++;
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${parameterIndex}`);
      updateValues.push(Boolean(isActive));
      parameterIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    // Add form ID and user ID to values
    updateValues.push(id, userId);

    // Update the form
    const updateQuery = `
      UPDATE feedback_forms 
      SET ${updateFields.join(', ')} 
      WHERE id = $${parameterIndex} AND user_id = $${parameterIndex + 1}
      RETURNING id, user_id, title, config, is_active, created_at, updated_at
    `;

    const updatedForm = await pool.query(updateQuery, updateValues);

    const form = updatedForm.rows[0];

    res.status(200).json({
      success: true,
      message: 'Form updated successfully',
      data: {
        form: {
          id: form.id,
          userId: form.user_id,
          title: form.title,
          config: form.config,
          isActive: form.is_active,
          createdAt: form.created_at,
          updatedAt: form.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating form'
    });
  }
};

// Delete a form (vendor only, own forms only)
const deleteForm = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }

    // Check if form exists and belongs to the vendor
    const existingForm = await pool.query(
      'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingForm.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or you do not have permission to delete it'
      });
    }

    // Delete the form (this will cascade delete all feedback entries)
    await pool.query(
      'DELETE FROM feedback_forms WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Form deleted successfully'
    });

  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting form'
    });
  }
};

// Get feedback entries for a specific form (vendor only, own forms only)
const getFormEntries = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const { page = 1, limit = 10, flagged, contacted } = req.query;

  try {
    // SECURITY: Validate form ID parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'  // Generic error message
      });
    }

    // SECURITY: Validate query parameters
    if (flagged !== undefined && !['true', 'false'].includes(flagged)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'  // Generic error message
      });
    }

    if (contacted !== undefined && !['true', 'false'].includes(contacted)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'  // Generic error message
      });
    }

    // Check if form exists and belongs to the vendor
    const formResult = await pool.query(
      'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Not found'  // Generic error message
      });
    }

    // Build query filters
    let queryFilters = 'WHERE form_id = $1';
    const queryParams = [id];
    let parameterIndex = 2;

    if (flagged !== undefined) {
      queryFilters += ` AND is_flagged = $${parameterIndex}`;
      queryParams.push(flagged === 'true');
      parameterIndex++;
    }

    if (contacted !== undefined) {
      queryFilters += ` AND wants_to_be_contacted = $${parameterIndex}`;
      queryParams.push(contacted === 'true');
      parameterIndex++;
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM feedback_entries ${queryFilters}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalEntries = parseInt(countResult.rows[0].count);

    // Get entries with pagination
    const entriesQuery = `
      SELECT id, answers, wants_to_be_contacted, contact_details, ai_score, is_flagged, created_at 
      FROM feedback_entries 
      ${queryFilters}
      ORDER BY ai_score DESC, created_at DESC 
      LIMIT $${parameterIndex} OFFSET $${parameterIndex + 1}
    `;
    
    queryParams.push(limitNum, offset);
    const entriesResult = await pool.query(entriesQuery, queryParams);

    const entries = entriesResult.rows.map(entry => ({
      id: entry.id,
      answers: entry.answers,
      wantsToBeContacted: entry.wants_to_be_contacted,
      contactDetails: entry.wants_to_be_contacted ? entry.contact_details : null,
      aiScore: entry.ai_score,
      isFlagged: entry.is_flagged,
      createdAt: entry.created_at
    }));

    res.status(200).json({
      success: true,
      data: {
        entries,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalEntries / limitNum),
          totalEntries,
          limit: limitNum,
          hasNext: pageNum < Math.ceil(totalEntries / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get form entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching entries'
    });
  }
};

// Resubmit a rejected form for approval
const resubmitForm = async (req, res) => {
  const formId = req.params.id;
  const userId = req.user.userId;
  const { title, config } = req.body;

  // SECURITY: Validate input parameters
  if (!formId || isNaN(parseInt(formId))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request'  // Generic error message
    });
  }

  console.log('Resubmit form request:', { formId, userId, title, configType: typeof config });

  try {
    // Check if user is approved
    if (userId !== 'admin') {
      const userResult = await pool.query(
        'SELECT status FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userStatus = userResult.rows[0].status;
      if (userStatus !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Your account must be approved to resubmit forms.',
          accountStatus: userStatus
        });
      }
    }

    // Verify form exists and belongs to user
    const formResult = await pool.query(
      'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2',
      [formId, userId]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const form = formResult.rows[0];

    // Check if form is rejected
    if (form.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Only rejected forms can be resubmitted'
      });
    }

    // Input validation
    if (!title || !config) {
      return res.status(400).json({
        success: false,
        message: 'Title and config are required'
      });
    }

    // Validate form configuration
    try {
      console.log('Validating config:', JSON.stringify(config, null, 2));
      const validationResult = validateFormConfig(config);
      console.log('Validation result:', validationResult);
      if (!validationResult.success) {
        console.log('Validation failed:', validationResult.errors);
        return res.status(400).json({
          success: false,
          message: 'Invalid form configuration',
          errors: validationResult.errors
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid form configuration format',
        error: error.message
      });
    }

    // Normalize the configuration
    const normalizedConfig = normalizeFormConfig(config);

    // Update the form and reset status to pending
    const result = await pool.query(
      `UPDATE feedback_forms 
       SET title = $1, config = $2, status = 'pending', status_message = NULL, updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [title, normalizedConfig, formId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or update failed'
      });
    }

    const updatedForm = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Form resubmitted successfully and is now pending approval',
      data: {
        id: updatedForm.id,
        title: updatedForm.title,
        config: updatedForm.config,
        status: updatedForm.status,
        statusMessage: updatedForm.status_message,
        createdAt: updatedForm.created_at,
        updatedAt: updatedForm.updated_at,
        isActive: updatedForm.is_active
      }
    });

  } catch (error) {
    console.error('Resubmit form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while resubmitting form'
    });
  }
};

// Get form statistics
const getFormStats = async (req, res) => {
  const formId = req.params.id;
  const userId = req.user.userId;
  const isAdmin = req.user.role === 'admin';

  try {
    // Verify form exists and user owns it (or is admin)
    const formQuery = isAdmin 
      ? 'SELECT * FROM feedback_forms WHERE id = $1'
      : 'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2';
    
    const formParams = isAdmin ? [formId] : [formId, userId];
    const formResult = await pool.query(formQuery, formParams);

    if (formResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or access denied'
      });
    }

    // Get total entries count
    const totalEntriesResult = await pool.query(
      'SELECT COUNT(*) as total FROM feedback_entries WHERE form_id = $1',
      [formId]
    );

    // Get entries from last 30 days
    const recentEntriesResult = await pool.query(
      'SELECT COUNT(*) as recent FROM feedback_entries WHERE form_id = $1 AND created_at >= NOW() - INTERVAL \'30 days\'',
      [formId]
    );

    // Get average rating if rating field exists
    const avgRatingResult = await pool.query(`
      SELECT ROUND(AVG(
        CASE 
          WHEN data->>'rating' ~ '^[0-9]+$' 
          THEN (data->>'rating')::numeric 
          ELSE NULL 
        END
      ), 1) as avg_rating
      FROM feedback_entries 
      WHERE form_id = $1 AND data->>'rating' IS NOT NULL
    `, [formId]);

    // Get completion rate (submitted vs viewed)
    const viewsResult = await pool.query(
      'SELECT views FROM feedback_forms WHERE id = $1',
      [formId]
    );

    const totalEntries = parseInt(totalEntriesResult.rows[0].total);
    const recentEntries = parseInt(recentEntriesResult.rows[0].recent);
    const avgRating = avgRatingResult.rows[0].avg_rating || 0;
    const views = formResult.rows[0].views || 0;
    const completionRate = views > 0 ? Math.round((totalEntries / views) * 100) : 0;

    // Get sentiment analysis if available
    const sentimentResult = await pool.query(`
      SELECT 
        sentiment,
        COUNT(*) as count
      FROM feedback_entries 
      WHERE form_id = $1 AND sentiment IS NOT NULL
      GROUP BY sentiment
    `, [formId]);

    const sentimentBreakdown = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    sentimentResult.rows.forEach(row => {
      sentimentBreakdown[row.sentiment] = parseInt(row.count);
    });

    const stats = {
      form: {
        id: formResult.rows[0].id,
        title: formResult.rows[0].title,
        status: formResult.rows[0].status
      },
      total_entries: totalEntries,
      recent_entries: recentEntries,
      avg_rating: parseFloat(avgRating),
      views: views,
      completion_rate: completionRate,
      sentiment_breakdown: sentimentBreakdown
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get form stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching form statistics'
    });
  }
};

module.exports = {
  createForm,
  getFormById,
  getVendorFormById,
  getVendorForms,
  updateForm,
  deleteForm,
  getFormEntries,
  getFormStats,
  resubmitForm
};
