// utils/aiService.js - AI-powered features for feedback analysis
const OpenAI = require('openai');
const sentiment = require('sentiment');
const natural = require('natural');

// Initialize sentiment analyzer
const sentimentAnalyzer = new sentiment();

// Initialize OpenAI (if API key is provided)
let openai = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

/**
 * Analyze sentiment of feedback text
 * @param {string} text - The feedback text to analyze
 * @returns {Object} - Sentiment analysis result
 */
function analyzeSentiment(text) {
    if (!text || typeof text !== 'string') {
        return {
            score: 0,
            label: 'neutral',
            confidence: 0
        };
    }

    const result = sentimentAnalyzer.analyze(text);
    
    // Normalize score to -1 to 1 range
    const normalizedScore = Math.max(-1, Math.min(1, result.score / 10));
    
    // Determine label based on score
    let label = 'neutral';
    if (normalizedScore > 0.1) {
        label = 'positive';
    } else if (normalizedScore < -0.1) {
        label = 'negative';
    }
    
    // Calculate confidence based on absolute score
    const confidence = Math.min(1, Math.abs(normalizedScore) + 0.3);
    
    return {
        score: normalizedScore,
        label: label,
        confidence: confidence,
        tokens: result.tokens,
        words: result.words
    };
}

/**
 * Detect spam in feedback using keywords and patterns
 * @param {string} text - The feedback text to check
 * @returns {Object} - Spam detection result
 */
function detectSpam(text) {
    if (!text || typeof text !== 'string') {
        return { isSpam: false, score: 0, reasons: [] };
    }

    const spamKeywords = [
        'click here', 'buy now', 'free money', 'guaranteed', 'limited time',
        'no obligation', 'risk free', 'urgent', 'winner', 'congratulations',
        'viagra', 'cialis', 'pharmacy', 'casino', 'lottery', 'inheritance',
        'nigerian prince', 'bitcoin', 'cryptocurrency', 'investment opportunity'
    ];

    const suspiciousPatterns = [
        /(\w)\1{4,}/, // Repeated characters (aaaaa)
        /[A-Z]{5,}/, // All caps words
        /\$\d+/, // Money amounts
        /http[s]?:\/\//, // URLs
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card numbers
        /\b\d{3}[\s-]?\d{2}[\s-]?\d{4}\b/, // Phone numbers
    ];

    let spamScore = 0;
    const reasons = [];
    const lowerText = text.toLowerCase();

    // Check for spam keywords
    spamKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
            spamScore += 0.3;
            reasons.push(`Contains spam keyword: ${keyword}`);
        }
    });

    // Check for suspicious patterns
    suspiciousPatterns.forEach((pattern, index) => {
        if (pattern.test(text)) {
            spamScore += 0.2;
            reasons.push(`Matches suspicious pattern ${index + 1}`);
        }
    });

    // Check text length and quality
    if (text.length < 10) {
        spamScore += 0.1;
        reasons.push('Text too short');
    }

    if (text.length > 2000) {
        spamScore += 0.2;
        reasons.push('Text unusually long');
    }

    // Check for excessive punctuation
    const punctuationRatio = (text.match(/[!?]{2,}/g) || []).length / text.length;
    if (punctuationRatio > 0.1) {
        spamScore += 0.3;
        reasons.push('Excessive punctuation');
    }

    return {
        isSpam: spamScore > 0.5,
        score: Math.min(1, spamScore),
        reasons: reasons
    };
}

/**
 * Calculate quality score for feedback
 * @param {string} text - The feedback text
 * @param {Object} formConfig - Form configuration
 * @returns {number} - Quality score between 0 and 1
 */
function calculateQualityScore(text, formConfig = {}) {
    if (!text || typeof text !== 'string') {
        return 0;
    }

    let qualityScore = 0.5; // Base score

    // Length factor
    const idealLength = 150; // Ideal feedback length
    const lengthFactor = Math.min(1, text.length / idealLength);
    qualityScore += lengthFactor * 0.2;

    // Word count factor
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= 10) qualityScore += 0.1;
    if (wordCount >= 25) qualityScore += 0.1;

    // Sentiment coherence (clear positive or negative)
    const sentimentResult = analyzeSentiment(text);
    if (Math.abs(sentimentResult.score) > 0.3) {
        qualityScore += 0.1;
    }

    // Check for constructive feedback indicators
    const constructiveWords = [
        'suggest', 'recommend', 'improve', 'better', 'could', 'would',
        'maybe', 'consider', 'think', 'feel', 'experience', 'helpful'
    ];
    
    const constructiveCount = constructiveWords.filter(word => 
        text.toLowerCase().includes(word)
    ).length;
    
    qualityScore += Math.min(0.2, constructiveCount * 0.05);

    // Penalize for spam characteristics
    const spamResult = detectSpam(text);
    qualityScore -= spamResult.score * 0.3;

    return Math.max(0, Math.min(1, qualityScore));
}

/**
 * Generate AI insights using OpenAI
 * @param {Array} feedbacks - Array of feedback entries
 * @param {string} insightType - Type of insight to generate
 * @returns {Object} - AI generated insights
 */
async function generateAIInsights(feedbacks, insightType = 'summary') {
    if (!openai) {
        // Fallback to rule-based insights if OpenAI is not available
        return generateRuleBasedInsights(feedbacks, insightType);
    }

    try {
        const feedbackTexts = feedbacks
            .map(f => f.answers?.feedback || f.text || '')
            .filter(text => text.length > 10)
            .slice(0, 50); // Limit to 50 feedbacks for API efficiency

        if (feedbackTexts.length === 0) {
            return { insights: [], confidence: 0 };
        }

        let prompt = '';
        
        switch (insightType) {
            case 'sentiment_summary':
                prompt = `Analyze the following customer feedback and provide a sentiment summary:

${feedbackTexts.join('\n---\n')}

Please provide:
1. Overall sentiment distribution (positive/negative/neutral percentages)
2. Key themes mentioned
3. Top 3 strengths highlighted by customers
4. Top 3 areas for improvement
5. Emotional tone analysis

Format as JSON with clear sections.`;
                break;

            case 'recommendations':
                prompt = `Based on this customer feedback, provide actionable business recommendations:

${feedbackTexts.join('\n---\n')}

Please provide:
1. Immediate action items (next 30 days)
2. Medium-term improvements (next 3 months)
3. Long-term strategic changes
4. Customer satisfaction strategies
5. Risk mitigation suggestions

Focus on practical, implementable solutions.`;
                break;

            case 'trends':
                prompt = `Identify trends and patterns in this customer feedback:

${feedbackTexts.join('\n---\n')}

Please identify:
1. Recurring themes and topics
2. Common pain points
3. Frequently mentioned positive aspects
4. Emerging concerns or opportunities
5. Customer behavior patterns

Provide insights that help predict future customer needs.`;
                break;

            default:
                prompt = `Analyze this customer feedback and provide comprehensive insights:

${feedbackTexts.join('\n---\n')}

Provide a comprehensive analysis including sentiment, themes, recommendations, and actionable insights.`;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an expert business analyst specializing in customer feedback analysis. Provide clear, actionable insights that help businesses improve their customer experience."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.3
        });

        return {
            insights: response.choices[0].message.content,
            confidence: 0.8,
            type: insightType,
            feedbackCount: feedbackTexts.length,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('OpenAI API error:', error);
        // Fallback to rule-based insights
        return generateRuleBasedInsights(feedbacks, insightType);
    }
}

/**
 * Generate insights using rule-based analysis (fallback)
 * @param {Array} feedbacks - Array of feedback entries
 * @param {string} insightType - Type of insight to generate
 * @returns {Object} - Rule-based insights
 */
function generateRuleBasedInsights(feedbacks, insightType) {
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    const commonWords = {};
    let totalQuality = 0;

    feedbacks.forEach(feedback => {
        const text = feedback.answers?.feedback || feedback.text || '';
        if (text.length < 10) return;

        const sentiment = analyzeSentiment(text);
        sentimentCounts[sentiment.label]++;

        const quality = calculateQualityScore(text);
        totalQuality += quality;

        // Extract common words
        const words = natural.WordTokenizer.tokenize(text.toLowerCase());
        const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        
        words.forEach(word => {
            if (word.length > 3 && !stopWords.includes(word)) {
                commonWords[word] = (commonWords[word] || 0) + 1;
            }
        });
    });

    const total = feedbacks.length;
    const avgQuality = total > 0 ? totalQuality / total : 0;

    // Get top words
    const topWords = Object.entries(commonWords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);

    const insights = {
        sentiment_distribution: {
            positive: total > 0 ? (sentimentCounts.positive / total * 100).toFixed(1) : 0,
            negative: total > 0 ? (sentimentCounts.negative / total * 100).toFixed(1) : 0,
            neutral: total > 0 ? (sentimentCounts.neutral / total * 100).toFixed(1) : 0
        },
        average_quality_score: avgQuality.toFixed(2),
        top_keywords: topWords,
        total_feedback_count: total,
        insights: [
            `${sentimentCounts.positive > sentimentCounts.negative ? 'Positive' : 'Negative'} sentiment dominates your feedback`,
            `Average feedback quality score: ${(avgQuality * 100).toFixed(0)}%`,
            `Most mentioned topics: ${topWords.slice(0, 3).join(', ')}`,
            total > 10 ? 'You have sufficient feedback for reliable insights' : 'Consider collecting more feedback for better analysis'
        ]
    };

    return {
        insights: JSON.stringify(insights, null, 2),
        confidence: 0.6,
        type: insightType,
        feedbackCount: total,
        generatedAt: new Date().toISOString()
    };
}

/**
 * Identify top quality users based on feedback patterns
 * @param {Array} users - Array of users with their feedback
 * @returns {Array} - Top quality users ranked by engagement and feedback quality
 */
function identifyTopQualityUsers(users) {
    const scoredUsers = users.map(user => {
        const feedbacks = user.feedbacks || [];
        
        if (feedbacks.length === 0) {
            return { ...user, qualityScore: 0, rank: 'inactive' };
        }

        let totalQuality = 0;
        let sentimentBalance = 0;
        let constructiveFeedbackCount = 0;

        feedbacks.forEach(feedback => {
            const text = feedback.answers?.feedback || feedback.text || '';
            
            if (text.length > 10) {
                const quality = calculateQualityScore(text);
                const sentiment = analyzeSentiment(text);
                
                totalQuality += quality;
                sentimentBalance += Math.abs(sentiment.score); // Prefer clear opinions
                
                // Check for constructive feedback
                const constructiveWords = ['suggest', 'improve', 'recommend', 'better', 'could'];
                if (constructiveWords.some(word => text.toLowerCase().includes(word))) {
                    constructiveFeedbackCount++;
                }
            }
        });

        const avgQuality = totalQuality / feedbacks.length;
        const avgSentimentClarity = sentimentBalance / feedbacks.length;
        const constructiveRatio = constructiveFeedbackCount / feedbacks.length;
        
        // Calculate overall quality score
        const qualityScore = (
            avgQuality * 0.4 +
            avgSentimentClarity * 0.3 +
            constructiveRatio * 0.3 +
            Math.min(1, feedbacks.length / 5) * 0.2 // Engagement bonus
        );

        let rank = 'novice';
        if (qualityScore > 0.8) rank = 'expert';
        else if (qualityScore > 0.6) rank = 'advanced';
        else if (qualityScore > 0.4) rank = 'intermediate';

        return {
            ...user,
            qualityScore,
            rank,
            feedbackCount: feedbacks.length,
            avgQuality,
            constructiveRatio
        };
    });

    return scoredUsers
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .slice(0, 20); // Top 20 users
}

/**
 * Generate form improvement suggestions based on response patterns
 * @param {Object} form - Form configuration
 * @param {Array} responses - Form responses
 * @returns {Array} - Improvement suggestions
 */
function generateFormImprovements(form, responses) {
    const suggestions = [];
    
    if (responses.length === 0) {
        return ['No responses yet - consider promoting your form to get feedback'];
    }

    // Analyze completion rate
    const totalViews = form.view_count || responses.length;
    const completionRate = totalViews > 0 ? responses.length / totalViews : 0;
    
    if (completionRate < 0.3) {
        suggestions.push('Low completion rate - consider simplifying your form or reducing the number of fields');
    }

    // Analyze response quality
    const qualityScores = responses.map(r => {
        const text = r.answers?.feedback || '';
        return calculateQualityScore(text);
    });

    const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    
    if (avgQuality < 0.5) {
        suggestions.push('Consider adding more specific questions to encourage detailed feedback');
    }

    // Check for empty responses
    const emptyResponses = responses.filter(r => {
        const text = r.answers?.feedback || '';
        return text.length < 10;
    }).length;

    if (emptyResponses > responses.length * 0.3) {
        suggestions.push('Many responses are too short - try asking more engaging questions');
    }

    // Sentiment analysis
    const sentiments = responses.map(r => {
        const text = r.answers?.feedback || '';
        return analyzeSentiment(text);
    });

    const negativeCount = sentiments.filter(s => s.label === 'negative').length;
    if (negativeCount > responses.length * 0.6) {
        suggestions.push('High negative sentiment detected - consider following up with dissatisfied customers');
    }

    if (suggestions.length === 0) {
        suggestions.push('Your form is performing well! Consider adding conditional logic for more personalized questions');
    }

    return suggestions;
}

/**
 * Generate industry-specific form templates
 * @param {string} businessType - Type of business
 * @returns {Object} - Form template configuration
 */
function generateFormTemplate(businessType) {
    const templates = {
        restaurant: {
            title: 'Restaurant Feedback Form',
            description: 'Help us improve your dining experience',
            fields: [
                { type: 'rating', label: 'Overall Experience', required: true, max: 5 },
                { type: 'rating', label: 'Food Quality', required: true, max: 5 },
                { type: 'rating', label: 'Service Quality', required: true, max: 5 },
                { type: 'rating', label: 'Value for Money', required: true, max: 5 },
                { type: 'radio', label: 'How did you hear about us?', options: ['Social Media', 'Friends/Family', 'Google Search', 'Walk-by'], required: false },
                { type: 'checkbox', label: 'What did you order?', options: ['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Specials'], required: false },
                { type: 'textarea', label: 'What did you like most?', placeholder: 'Tell us what made your experience great...', required: false },
                { type: 'textarea', label: 'How can we improve?', placeholder: 'Any suggestions for improvement...', required: false },
                { type: 'radio', label: 'Would you recommend us?', options: ['Definitely', 'Probably', 'Not Sure', 'Probably Not', 'Definitely Not'], required: true }
            ]
        },
        gym: {
            title: 'Fitness Center Feedback',
            description: 'Help us enhance your fitness journey',
            fields: [
                { type: 'rating', label: 'Equipment Quality', required: true, max: 5 },
                { type: 'rating', label: 'Cleanliness', required: true, max: 5 },
                { type: 'rating', label: 'Staff Helpfulness', required: true, max: 5 },
                { type: 'rating', label: 'Class Quality', required: false, max: 5 },
                { type: 'select', label: 'Membership Type', options: ['Basic', 'Premium', 'VIP', 'Day Pass'], required: true },
                { type: 'checkbox', label: 'Which facilities do you use?', options: ['Cardio Equipment', 'Weight Training', 'Group Classes', 'Pool', 'Sauna', 'Personal Training'], required: false },
                { type: 'radio', label: 'Best time for your workouts?', options: ['Early Morning (5-8 AM)', 'Morning (8-12 PM)', 'Afternoon (12-5 PM)', 'Evening (5-8 PM)', 'Late Evening (8+ PM)'], required: false },
                { type: 'textarea', label: 'What motivates you most?', placeholder: 'Share what keeps you coming back...', required: false },
                { type: 'textarea', label: 'Suggestions for new equipment or classes?', placeholder: 'What would you like to see added...', required: false }
            ]
        },
        retail: {
            title: 'Shopping Experience Feedback',
            description: 'Tell us about your shopping experience',
            fields: [
                { type: 'rating', label: 'Product Selection', required: true, max: 5 },
                { type: 'rating', label: 'Store Layout & Navigation', required: true, max: 5 },
                { type: 'rating', label: 'Staff Assistance', required: true, max: 5 },
                { type: 'rating', label: 'Checkout Experience', required: true, max: 5 },
                { type: 'radio', label: 'Visit Frequency', options: ['First time', 'Rarely', 'Monthly', 'Weekly', 'Multiple times per week'], required: false },
                { type: 'number', label: 'Approximate amount spent today ($)', min: 0, max: 10000, required: false },
                { type: 'checkbox', label: 'What brought you in today?', options: ['Specific Item', 'Browsing', 'Sale/Promotion', 'Gift Shopping', 'Routine Shopping'], required: false },
                { type: 'textarea', label: 'What products would you like to see more of?', placeholder: 'Help us improve our inventory...', required: false },
                { type: 'textarea', label: 'Any suggestions for improvement?', placeholder: 'How can we make your shopping experience better...', required: false }
            ]
        },
        clinic: {
            title: 'Medical Practice Feedback',
            description: 'Help us improve our healthcare services',
            fields: [
                { type: 'rating', label: 'Overall Experience', required: true, max: 5 },
                { type: 'rating', label: 'Doctor/Provider Care', required: true, max: 5 },
                { type: 'rating', label: 'Staff Courtesy', required: true, max: 5 },
                { type: 'rating', label: 'Wait Time', required: true, max: 5 },
                { type: 'rating', label: 'Facility Cleanliness', required: true, max: 5 },
                { type: 'radio', label: 'Appointment Type', options: ['Routine Check-up', 'Follow-up', 'Urgent Care', 'Consultation', 'Procedure'], required: false },
                { type: 'radio', label: 'How did you schedule?', options: ['Phone Call', 'Online Portal', 'Walk-in', 'Mobile App'], required: false },
                { type: 'textarea', label: 'What did our team do well?', placeholder: 'Share positive aspects of your visit...', required: false },
                { type: 'textarea', label: 'How can we improve?', placeholder: 'Your suggestions help us provide better care...', required: false },
                { type: 'radio', label: 'Would you recommend us?', options: ['Definitely', 'Probably', 'Not Sure', 'Probably Not', 'Definitely Not'], required: true }
            ]
        },
        default: {
            title: 'Customer Feedback Form',
            description: 'We value your feedback and suggestions',
            fields: [
                { type: 'rating', label: 'Overall Experience', required: true, max: 5 },
                { type: 'rating', label: 'Service Quality', required: true, max: 5 },
                { type: 'rating', label: 'Value for Money', required: false, max: 5 },
                { type: 'radio', label: 'How likely are you to recommend us?', options: ['Very Likely', 'Likely', 'Neutral', 'Unlikely', 'Very Unlikely'], required: true },
                { type: 'textarea', label: 'What did you like most?', placeholder: 'Tell us what stood out...', required: false },
                { type: 'textarea', label: 'What can we improve?', placeholder: 'Your suggestions are valuable to us...', required: false },
                { type: 'email', label: 'Email (optional)', placeholder: 'For follow-up if needed', required: false }
            ]
        }
    };

    return templates[businessType] || templates.default;
}

module.exports = {
    analyzeSentiment,
    detectSpam,
    calculateQualityScore,
    generateAIInsights,
    generateRuleBasedInsights,
    identifyTopQualityUsers,
    generateFormImprovements,
    generateFormTemplate
};
