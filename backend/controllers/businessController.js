// controllers/businessController.js - Business profile management
const { pool } = require('../models/db');

// Get public business profile by slug
const getBusinessProfile = async (req, res) => {
  try {
    const { slug } = req.params;

    const businessResult = await pool.query(`
      SELECT 
        bp.*,
        u.username,
        u.email as business_email
      FROM business_profiles bp
      JOIN users u ON bp.user_id = u.id
      WHERE bp.slug = $1 AND bp.is_public = true
    `, [slug]);

    if (businessResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found'
      });
    }

    const business = businessResult.rows[0];

    // Increment page views
    await pool.query(
      'UPDATE business_profiles SET page_views = page_views + 1 WHERE id = $1',
      [business.id]
    );

    res.json({
      success: true,
      business
    });

  } catch (error) {
    console.error('Error fetching business profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business profile'
    });
  }
};

// Get business reviews
const getBusinessReviews = async (req, res) => {
  try {
    const { slug } = req.params;

    // First get the business ID
    const businessResult = await pool.query(
      'SELECT id FROM business_profiles WHERE slug = $1 AND is_public = true',
      [slug]
    );

    if (businessResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const businessId = businessResult.rows[0].id;

    const reviewsResult = await pool.query(`
      SELECT 
        id,
        reviewer_name,
        rating,
        review_text,
        created_at
      FROM business_reviews
      WHERE business_profile_id = $1 AND is_approved = true
      ORDER BY created_at DESC
    `, [businessId]);

    res.json({
      success: true,
      reviews: reviewsResult.rows
    });

  } catch (error) {
    console.error('Error fetching business reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

// Submit a new review
const submitReview = async (req, res) => {
  try {
    const { slug } = req.params;
    const { reviewer_name, reviewer_email, rating, review_text } = req.body;
    const ip_address = req.ip;

    // Get business ID
    const businessResult = await pool.query(
      'SELECT id FROM business_profiles WHERE slug = $1 AND is_public = true',
      [slug]
    );

    if (businessResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const businessId = businessResult.rows[0].id;

    // Check for duplicate reviews from same email in last 24 hours
    const duplicateCheck = await pool.query(`
      SELECT id FROM business_reviews
      WHERE business_profile_id = $1 AND reviewer_email = $2 
      AND created_at > NOW() - INTERVAL '24 hours'
    `, [businessId, reviewer_email]);

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You can only submit one review per day'
      });
    }

    const reviewResult = await pool.query(`
      INSERT INTO business_reviews (
        business_profile_id,
        reviewer_name,
        reviewer_email,
        rating,
        review_text,
        ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [businessId, reviewer_name, reviewer_email, rating, review_text, ip_address]);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. It will be visible after approval.',
      reviewId: reviewResult.rows[0].id
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review'
    });
  }
};

// Get public forms for a business
const getBusinessForms = async (req, res) => {
  try {
    const { slug } = req.params;

    // Get business user ID
    const businessResult = await pool.query(
      'SELECT user_id FROM business_profiles WHERE slug = $1 AND is_public = true',
      [slug]
    );

    if (businessResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const userId = businessResult.rows[0].user_id;

    const formsResult = await pool.query(`
      SELECT 
        id,
        title,
        description,
        status
      FROM feedback_forms
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC
    `, [userId]);

    res.json({
      success: true,
      forms: formsResult.rows
    });

  } catch (error) {
    console.error('Error fetching business forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forms'
    });
  }
};

// Create or update business profile
const createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      slug,
      public_name,
      description,
      logo_url,
      cover_image_url,
      contact_info,
      social_links,
      operating_hours,
      location,
      is_public,
      seo_title,
      seo_description,
      seo_keywords
    } = req.body;

    // Check if slug is available (for other users)
    const slugCheck = await pool.query(
      'SELECT id, user_id FROM business_profiles WHERE slug = $1',
      [slug]
    );

    if (slugCheck.rows.length > 0 && slugCheck.rows[0].user_id !== userId) {
      return res.status(400).json({
        success: false,
        message: 'This business URL is already taken'
      });
    }

    // Check if user already has a profile
    const existingProfile = await pool.query(
      'SELECT id FROM business_profiles WHERE user_id = $1',
      [userId]
    );

    let result;
    if (existingProfile.rows.length > 0) {
      // Update existing profile
      result = await pool.query(`
        UPDATE business_profiles SET
          slug = $2,
          public_name = $3,
          description = $4,
          logo_url = $5,
          cover_image_url = $6,
          contact_info = $7,
          social_links = $8,
          operating_hours = $9,
          location = $10,
          is_public = $11,
          seo_title = $12,
          seo_description = $13,
          seo_keywords = $14,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `, [
        userId, slug, public_name, description, logo_url, cover_image_url,
        JSON.stringify(contact_info), JSON.stringify(social_links),
        JSON.stringify(operating_hours), JSON.stringify(location),
        is_public, seo_title, seo_description, seo_keywords
      ]);
    } else {
      // Create new profile
      result = await pool.query(`
        INSERT INTO business_profiles (
          user_id, slug, public_name, description, logo_url, cover_image_url,
          contact_info, social_links, operating_hours, location, is_public,
          seo_title, seo_description, seo_keywords
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        userId, slug, public_name, description, logo_url, cover_image_url,
        JSON.stringify(contact_info), JSON.stringify(social_links),
        JSON.stringify(operating_hours), JSON.stringify(location),
        is_public, seo_title, seo_description, seo_keywords
      ]);
    }

    res.json({
      success: true,
      message: 'Business profile saved successfully',
      profile: result.rows[0]
    });

  } catch (error) {
    console.error('Error saving business profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save business profile'
    });
  }
};

// Get user's business profile for editing
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profileResult = await pool.query(
      'SELECT * FROM business_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.json({
        success: true,
        profile: null
      });
    }

    res.json({
      success: true,
      profile: profileResult.rows[0]
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// Delete business profile
const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    await pool.query('DELETE FROM business_profiles WHERE user_id = $1', [userId]);

    res.json({
      success: true,
      message: 'Business profile deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile'
    });
  }
};

// Get business statistics
const getBusinessStats = async (req, res) => {
  try {
    const { slug } = req.params;

    // Get business user ID from slug
    const businessResult = await pool.query(`
      SELECT bp.user_id, bp.business_name
      FROM business_profiles bp
      WHERE bp.slug = $1 AND bp.is_public = true
    `, [slug]);

    if (businessResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const userId = businessResult.rows[0].user_id;

    // Get form statistics
    const formsResult = await pool.query(`
      SELECT COUNT(*) as total_forms
      FROM feedback_forms 
      WHERE user_id = $1 AND status = 'active'
    `, [userId]);

    // Get total feedback count
    const feedbackResult = await pool.query(`
      SELECT COUNT(*) as total_feedback
      FROM feedback_entries fe
      JOIN feedback_forms ff ON fe.form_id = ff.id
      WHERE ff.user_id = $1
    `, [userId]);

    // Get average rating (if ratings exist)
    const ratingResult = await pool.query(`
      SELECT ROUND(AVG(
        CASE 
          WHEN data->>'rating' ~ '^[0-9]+$' 
          THEN (data->>'rating')::numeric 
          ELSE NULL 
        END
      ), 1) as avg_rating
      FROM feedback_entries fe
      JOIN feedback_forms ff ON fe.form_id = ff.id
      WHERE ff.user_id = $1 AND data->>'rating' IS NOT NULL
    `, [userId]);

    // Get recent feedback count (last 30 days)
    const recentFeedbackResult = await pool.query(`
      SELECT COUNT(*) as recent_feedback
      FROM feedback_entries fe
      JOIN feedback_forms ff ON fe.form_id = ff.id
      WHERE ff.user_id = $1 
      AND fe.created_at >= NOW() - INTERVAL '30 days'
    `, [userId]);

    const stats = {
      business_name: businessResult.rows[0].business_name,
      total_forms: parseInt(formsResult.rows[0].total_forms),
      total_feedback: parseInt(feedbackResult.rows[0].total_feedback),
      avg_rating: ratingResult.rows[0].avg_rating || 0,
      recent_feedback: parseInt(recentFeedbackResult.rows[0].recent_feedback)
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching business stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business statistics'
    });
  }
};

module.exports = {
  getBusinessProfile,
  getBusinessReviews,
  submitReview,
  getBusinessForms,
  getBusinessStats,
  createOrUpdateProfile,
  getUserProfile,
  deleteProfile
};
