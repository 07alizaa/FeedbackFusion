// controllers/feedbackController.js - Feedback submission logic
const pool = require('../db');
const { scoreAndFlagFeedback } = require('../utils/aiHelper');
const { validateFormAnswers, sanitizeAnswersForStorage } = require('../utils/formValidator');

// Submit feedback to a form (anonymous, public access)
const submitFeedback = async (req, res) => {
  const { formId } = req.params;
  let { answers, wantsToBeContacted = false, contactDetails = null } = req.body;

  try {
    // Validate form ID is a number
    if (isNaN(parseInt(formId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }

    // Input validation
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Answers are required and must be a valid object'
      });
    }

    // Check if form exists and is active
    const formResult = await pool.query(
      'SELECT id, title, config, is_active FROM feedback_forms WHERE id = $1',
      [formId]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    const form = formResult.rows[0];

    if (!form.is_active) {
      return res.status(400).json({
        success: false,
        message: 'This form is no longer accepting responses'
      });
    }

    // Validate answers against form configuration
    const validation = validateFormAnswers(answers, form.config);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form response',
        errors: validation.errors
      });
    }

    // Sanitize answers for database storage
    const sanitizedAnswers = sanitizeAnswersForStorage(validation.processedAnswers);

    // Validate contact details if user wants to be contacted
    if (wantsToBeContacted) {
      if (!contactDetails || typeof contactDetails !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Contact details are required when you want to be contacted'
        });
      }

      // Basic validation for contact details
      const { email, phone, name } = contactDetails;
      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: 'At least email or phone number is required in contact details'
        });
      }

      // Validate email format if provided
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
          });
        }
      }

      // Sanitize contact details
      const sanitizedContactDetails = {
        name: typeof name === 'string' ? name.trim().substring(0, 255) : null,
        email: typeof email === 'string' ? email.toLowerCase().trim() : null,
        phone: typeof phone === 'string' ? phone.trim().substring(0, 50) : null
      };

      contactDetails = sanitizedContactDetails;
    }

    // Generate AI score and flag for the feedback
    const { score, isFlagged } = scoreAndFlagFeedback(sanitizedAnswers);

    // Insert feedback entry
    const newEntry = await pool.query(
      `INSERT INTO feedback_entries (form_id, answers, wants_to_be_contacted, contact_details, ai_score, is_flagged) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, created_at`,
      [
        formId, 
        JSON.stringify(sanitizedAnswers), 
        Boolean(wantsToBeContacted),
        wantsToBeContacted ? JSON.stringify(contactDetails) : null,
        score,
        isFlagged
      ]
    );

    const entry = newEntry.rows[0];

    // Emit real-time notification for new feedback response
    if (typeof global.emitNotification === 'function') {
      global.emitNotification('response_submitted', {
        formId: formId,
        formTitle: form.title,
        entryId: entry.id,
        score: score,
        rating: score > 0 ? Math.round(score / 20 * 10) / 10 : 4.0,
        isFlagged: isFlagged,
        submittedAt: entry.created_at
      });
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        entryId: entry.id,
        submittedAt: entry.created_at,
        formTitle: form.title
      }
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while submitting feedback'
    });
  }
};

// Get feedback statistics for a form (vendor only)
const getFeedbackStats = async (req, res) => {
  const { formId } = req.params;
  const userId = req.user.userId;

  try {
    // Validate form ID is a number
    if (isNaN(parseInt(formId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }

    // Check if form exists and belongs to the vendor
    const formResult = await pool.query(
      'SELECT id, title FROM feedback_forms WHERE id = $1 AND user_id = $2',
      [formId, userId]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or you do not have permission to view its statistics'
      });
    }

    // Get comprehensive statistics
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN wants_to_be_contacted = true THEN 1 END) as contact_entries,
        COUNT(CASE WHEN is_flagged = true THEN 1 END) as flagged_entries,
        AVG(ai_score) as avg_ai_score,
        MAX(ai_score) as max_ai_score,
        MIN(ai_score) as min_ai_score,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as entries_last_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as entries_last_7d,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as entries_last_30d
       FROM feedback_entries 
       WHERE form_id = $1`,
      [formId]
    );

    const stats = statsResult.rows[0];

    // Get top flagged entries
    const topEntriesResult = await pool.query(
      `SELECT id, ai_score, is_flagged, created_at, 
              CASE WHEN wants_to_be_contacted THEN true ELSE false END as has_contact
       FROM feedback_entries 
       WHERE form_id = $1 AND is_flagged = true
       ORDER BY ai_score DESC, created_at DESC 
       LIMIT 10`,
      [formId]
    );

    const topFlaggedEntries = topEntriesResult.rows.map(entry => ({
      id: entry.id,
      aiScore: entry.ai_score,
      isFlagged: entry.is_flagged,
      hasContact: entry.has_contact,
      createdAt: entry.created_at
    }));

    // Get daily submission counts for the last 30 days
    const dailyStatsResult = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
       FROM feedback_entries 
       WHERE form_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [formId]
    );

    const dailyStats = dailyStatsResult.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count)
    }));

    res.status(200).json({
      success: true,
      data: {
        formId: parseInt(formId),
        formTitle: formResult.rows[0].title,
        statistics: {
          totalEntries: parseInt(stats.total_entries),
          contactEntries: parseInt(stats.contact_entries),
          flaggedEntries: parseInt(stats.flagged_entries),
          averageAiScore: Math.round(parseFloat(stats.avg_ai_score) || 0),
          maxAiScore: parseInt(stats.max_ai_score) || 0,
          minAiScore: parseInt(stats.min_ai_score) || 0,
          entriesLast24h: parseInt(stats.entries_last_24h),
          entriesLast7d: parseInt(stats.entries_last_7d),
          entriesLast30d: parseInt(stats.entries_last_30d)
        },
        topFlaggedEntries,
        dailySubmissions: dailyStats
      }
    });

  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching statistics'
    });
  }
};

// Get a specific feedback entry (vendor only)
const getFeedbackEntry = async (req, res) => {
  const { entryId } = req.params;
  const userId = req.user.userId;

  try {
    // Validate entry ID is a number
    if (isNaN(parseInt(entryId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entry ID'
      });
    }

    // Get feedback entry with form ownership verification
    const entryResult = await pool.query(
      `SELECT fe.*, ff.title as form_title, ff.user_id as form_owner_id
       FROM feedback_entries fe
       JOIN feedback_forms ff ON fe.form_id = ff.id
       WHERE fe.id = $1`,
      [entryId]
    );

    if (entryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback entry not found'
      });
    }

    const entry = entryResult.rows[0];

    // Check if the current user owns the form
    if (entry.form_owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this feedback entry'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        entry: {
          id: entry.id,
          formId: entry.form_id,
          formTitle: entry.form_title,
          answers: entry.answers,
          wantsToBeContacted: entry.wants_to_be_contacted,
          contactDetails: entry.wants_to_be_contacted ? entry.contact_details : null,
          aiScore: entry.ai_score,
          isFlagged: entry.is_flagged,
          createdAt: entry.created_at,
          updatedAt: entry.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Get feedback entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching feedback entry'
    });
  }
};

// Update feedback entry flag status (vendor only)
const updateEntryFlag = async (req, res) => {
  const { entryId } = req.params;
  const { isFlagged } = req.body;
  const userId = req.user.userId;

  try {
    // Validate entry ID is a number
    if (isNaN(parseInt(entryId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entry ID'
      });
    }

    if (typeof isFlagged !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isFlagged must be a boolean value'
      });
    }

    // Check if entry exists and user owns the form
    const entryResult = await pool.query(
      `SELECT fe.id
       FROM feedback_entries fe
       JOIN feedback_forms ff ON fe.form_id = ff.id
       WHERE fe.id = $1 AND ff.user_id = $2`,
      [entryId, userId]
    );

    if (entryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback entry not found or you do not have permission to modify it'
      });
    }

    // Update the flag status
    await pool.query(
      'UPDATE feedback_entries SET is_flagged = $1 WHERE id = $2',
      [isFlagged, entryId]
    );

    res.status(200).json({
      success: true,
      message: `Entry ${isFlagged ? 'flagged' : 'unflagged'} successfully`
    });

  } catch (error) {
    console.error('Update entry flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating entry flag'
    });
  }
};

module.exports = {
  submitFeedback,
  getFeedbackStats,
  getFeedbackEntry,
  updateEntryFlag
};
