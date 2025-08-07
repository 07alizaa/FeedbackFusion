// controllers/aiController.js - AI-powered features controller
const aiService = require('../utils/aiService');
const { pool } = require('../models/db');

/**
 * Analyze feedback sentiment for a form
 */
const analyzeFeedbackSentiment = async (req, res) => {
    try {
        const { formId } = req.params;
        const userId = req.user.userId;

        // Verify form ownership
        const formResult = await pool.query(
            'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2',
            [formId, userId]
        );

        if (formResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Form not found or access denied' 
            });
        }

        // Get all feedback entries for the form
        const feedbackResult = await pool.query(`
            SELECT * FROM feedback_entries 
            WHERE form_id = $1 
            ORDER BY created_at DESC
        `, [formId]);

        const feedbacks = feedbackResult.rows;
        const analyzedFeedbacks = [];

        // Analyze each feedback entry
        for (const feedback of feedbacks) {
            const text = feedback.answers?.feedback || '';
            
            if (text.length > 10) {
                const sentiment = aiService.analyzeSentiment(text);
                const spamCheck = aiService.detectSpam(text);
                const qualityScore = aiService.calculateQualityScore(text);

                // Update feedback entry with AI analysis
                await pool.query(`
                    UPDATE feedback_entries 
                    SET sentiment_score = $1, sentiment_label = $2, 
                        ai_analysis = $3, is_spam = $4, spam_score = $5, 
                        quality_score = $6, updated_at = NOW()
                    WHERE id = $7
                `, [
                    sentiment.score,
                    sentiment.label,
                    JSON.stringify({
                        sentiment: sentiment,
                        spam: spamCheck,
                        quality: qualityScore,
                        analyzedAt: new Date().toISOString()
                    }),
                    spamCheck.isSpam,
                    spamCheck.score,
                    qualityScore,
                    feedback.id
                ]);

                analyzedFeedbacks.push({
                    ...feedback,
                    sentiment,
                    spamCheck,
                    qualityScore
                });
            }
        }

        // Generate overall insights
        const insights = await aiService.generateAIInsights(analyzedFeedbacks, 'sentiment_summary');

        // Save insights to database
        await pool.query(`
            INSERT INTO ai_insights (form_id, user_id, insight_type, insight_data, confidence_score)
            VALUES ($1, $2, 'sentiment_analysis', $3, $4)
        `, [formId, userId, JSON.stringify(insights), insights.confidence]);

        res.json({
            success: true,
            message: 'Sentiment analysis completed',
            totalAnalyzed: analyzedFeedbacks.length,
            insights: insights
        });

    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to analyze feedback sentiment' 
        });
    }
};

/**
 * Get AI insights for a form
 */
const getAIInsights = async (req, res) => {
    try {
        const { formId } = req.params;
        const { type = 'all' } = req.query;
        const userId = req.user.userId;

        // Verify form ownership
        const formResult = await pool.query(
            'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2',
            [formId, userId]
        );

        if (formResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Form not found or access denied' 
            });
        }

        let query = `
            SELECT * FROM ai_insights 
            WHERE form_id = $1 AND user_id = $2
        `;
        const params = [formId, userId];

        if (type !== 'all') {
            query += ' AND insight_type = $3';
            params.push(type);
        }

        query += ' ORDER BY generated_at DESC LIMIT 10';

        const insights = await pool.query(query, params);

        res.json({
            success: true,
            insights: insights.rows
        });

    } catch (error) {
        console.error('Error getting AI insights:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get AI insights' 
        });
    }
};

/**
 * Generate AI recommendations for form improvement
 */
const generateFormRecommendations = async (req, res) => {
    try {
        const { formId } = req.params;
        const userId = req.user.userId;

        // Get form and its responses
        const formResult = await pool.query(`
            SELECT ff.*, 
                   COUNT(fe.id) as response_count,
                   AVG(fe.quality_score) as avg_quality
            FROM feedback_forms ff
            LEFT JOIN feedback_entries fe ON ff.id = fe.form_id
            WHERE ff.id = $1 AND ff.user_id = $2
            GROUP BY ff.id
        `, [formId, userId]);

        if (formResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Form not found or access denied' 
            });
        }

        const form = formResult.rows[0];

        // Get all responses
        const responsesResult = await pool.query(`
            SELECT * FROM feedback_entries 
            WHERE form_id = $1 
            ORDER BY created_at DESC
        `, [formId]);

        const recommendations = aiService.generateFormImprovements(form, responsesResult.rows);

        // Generate AI-powered recommendations if available
        let aiRecommendations = null;
        if (responsesResult.rows.length > 5) {
            try {
                aiRecommendations = await aiService.generateAIInsights(
                    responsesResult.rows, 
                    'recommendations'
                );
            } catch (error) {
                console.log('AI recommendations not available:', error.message);
            }
        }

        // Save recommendations
        await pool.query(`
            INSERT INTO ai_insights (form_id, user_id, insight_type, insight_data, confidence_score)
            VALUES ($1, $2, 'form_recommendations', $3, $4)
        `, [
            formId, 
            userId, 
            JSON.stringify({
                basicRecommendations: recommendations,
                aiRecommendations: aiRecommendations,
                generatedAt: new Date().toISOString(),
                formStats: {
                    responseCount: form.response_count,
                    avgQuality: form.avg_quality
                }
            }),
            aiRecommendations ? aiRecommendations.confidence : 0.7
        ]);

        res.json({
            success: true,
            recommendations: recommendations,
            aiRecommendations: aiRecommendations,
            formStats: {
                responseCount: form.response_count,
                avgQuality: form.avg_quality
            }
        });

    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate recommendations' 
        });
    }
};

/**
 * Identify top quality users
 */
const getTopQualityUsers = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 10 } = req.query;

        // Get all users who provided feedback to user's forms
        const usersResult = await pool.query(`
            SELECT DISTINCT
                fe.contact_details->>'email' as email,
                fe.contact_details->>'name' as name,
                ARRAY_AGG(fe.id) as feedback_ids,
                COUNT(fe.id) as feedback_count
            FROM feedback_entries fe
            JOIN feedback_forms ff ON fe.form_id = ff.id
            WHERE ff.user_id = $1
            AND fe.contact_details IS NOT NULL
            AND fe.contact_details->>'email' IS NOT NULL
            GROUP BY fe.contact_details->>'email', fe.contact_details->>'name'
            HAVING COUNT(fe.id) >= 2
            ORDER BY COUNT(fe.id) DESC
            LIMIT $2
        `, [userId, limit]);

        const users = [];

        for (const user of usersResult.rows) {
            // Get feedbacks for this user
            const feedbacksResult = await pool.query(`
                SELECT fe.*, ff.title as form_title
                FROM feedback_entries fe
                JOIN feedback_forms ff ON fe.form_id = ff.id
                WHERE fe.id = ANY($1)
                ORDER BY fe.created_at DESC
            `, [user.feedback_ids]);

            users.push({
                email: user.email,
                name: user.name,
                feedbackCount: user.feedback_count,
                feedbacks: feedbacksResult.rows
            });
        }

        // Analyze user quality using AI service
        const topUsers = aiService.identifyTopQualityUsers(users);

        // Save insights
        await pool.query(`
            INSERT INTO ai_insights (user_id, insight_type, insight_data, confidence_score)
            VALUES ($1, 'top_quality_users', $2, 0.8)
        `, [
            userId,
            JSON.stringify({
                topUsers: topUsers.slice(0, parseInt(limit)),
                generatedAt: new Date().toISOString(),
                criteria: 'feedback_quality_and_engagement'
            })
        ]);

        res.json({
            success: true,
            topUsers: topUsers,
            total: users.length
        });

    } catch (error) {
        console.error('Error identifying top users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to identify top quality users' 
        });
    }
};

/**
 * Generate form template based on business type
 */
const generateFormTemplate = async (req, res) => {
    try {
        const { businessType } = req.body;

        if (!businessType) {
            return res.status(400).json({ 
                success: false, 
                message: 'Business type is required' 
            });
        }

        const template = aiService.generateFormTemplate(businessType);

        res.json({
            success: true,
            template: template,
            businessType: businessType
        });

    } catch (error) {
        console.error('Error generating form template:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate form template' 
        });
    }
};

/**
 * Bulk analyze all feedback for sentiment
 */
const bulkAnalyzeSentiment = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get all forms for the user
        const formsResult = await pool.query(
            'SELECT id FROM feedback_forms WHERE user_id = $1',
            [userId]
        );

        const formIds = formsResult.rows.map(row => row.id);
        let totalProcessed = 0;

        for (const formId of formIds) {
            try {
                // Get unanalyzed feedback entries
                const feedbackResult = await pool.query(`
                    SELECT * FROM feedback_entries 
                    WHERE form_id = $1 AND sentiment_score IS NULL
                `, [formId]);

                for (const feedback of feedbackResult.rows) {
                    const text = feedback.answers?.feedback || '';
                    
                    if (text.length > 10) {
                        const sentiment = aiService.analyzeSentiment(text);
                        const spamCheck = aiService.detectSpam(text);
                        const qualityScore = aiService.calculateQualityScore(text);

                        await pool.query(`
                            UPDATE feedback_entries 
                            SET sentiment_score = $1, sentiment_label = $2, 
                                ai_analysis = $3, is_spam = $4, spam_score = $5, 
                                quality_score = $6, updated_at = NOW()
                            WHERE id = $7
                        `, [
                            sentiment.score,
                            sentiment.label,
                            JSON.stringify({
                                sentiment: sentiment,
                                spam: spamCheck,
                                quality: qualityScore,
                                analyzedAt: new Date().toISOString()
                            }),
                            spamCheck.isSpam,
                            spamCheck.score,
                            qualityScore,
                            feedback.id
                        ]);

                        totalProcessed++;
                    }
                }
            } catch (error) {
                console.error(`Error analyzing form ${formId}:`, error);
            }
        }

        res.json({
            success: true,
            message: `Bulk sentiment analysis completed`,
            totalProcessed: totalProcessed,
            formsAnalyzed: formIds.length
        });

    } catch (error) {
        console.error('Error in bulk sentiment analysis:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to perform bulk sentiment analysis' 
        });
    }
};

/**
 * Get AI analytics dashboard data
 */
const getAIDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get sentiment distribution across all forms
        const sentimentStats = await pool.query(`
            SELECT 
                sentiment_label,
                COUNT(*) as count,
                AVG(sentiment_score) as avg_score
            FROM feedback_entries fe
            JOIN feedback_forms ff ON fe.form_id = ff.id
            WHERE ff.user_id = $1 AND sentiment_label IS NOT NULL
            GROUP BY sentiment_label
        `, [userId]);

        // Get quality score distribution
        const qualityStats = await pool.query(`
            SELECT 
                CASE 
                    WHEN quality_score >= 0.8 THEN 'high'
                    WHEN quality_score >= 0.6 THEN 'medium'
                    WHEN quality_score >= 0.4 THEN 'low'
                    ELSE 'very_low'
                END as quality_category,
                COUNT(*) as count,
                AVG(quality_score) as avg_score
            FROM feedback_entries fe
            JOIN feedback_forms ff ON fe.form_id = ff.id
            WHERE ff.user_id = $1 AND quality_score IS NOT NULL
            GROUP BY quality_category
        `, [userId]);

        // Get spam detection stats
        const spamStats = await pool.query(`
            SELECT 
                is_spam,
                COUNT(*) as count,
                AVG(spam_score) as avg_score
            FROM feedback_entries fe
            JOIN feedback_forms ff ON fe.form_id = ff.id
            WHERE ff.user_id = $1 AND spam_score IS NOT NULL
            GROUP BY is_spam
        `, [userId]);

        // Get recent insights
        const recentInsights = await pool.query(`
            SELECT * FROM ai_insights 
            WHERE user_id = $1 
            ORDER BY generated_at DESC 
            LIMIT 5
        `, [userId]);

        res.json({
            success: true,
            dashboard: {
                sentimentDistribution: sentimentStats.rows,
                qualityDistribution: qualityStats.rows,
                spamDetection: spamStats.rows,
                recentInsights: recentInsights.rows,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error getting AI dashboard:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get AI dashboard data' 
        });
    }
};

module.exports = {
    analyzeFeedbackSentiment,
    getAIInsights,
    generateFormRecommendations,
    getTopQualityUsers,
    generateFormTemplate,
    bulkAnalyzeSentiment,
    getAIDashboard
};
