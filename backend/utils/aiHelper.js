// utils/aiHelper.js - AI-based feedback scoring and flagging
// This is a basic AI simulation for scoring and flagging feedback

// Keywords that indicate valuable feedback
const POSITIVE_KEYWORDS = [
  'excellent', 'great', 'amazing', 'wonderful', 'fantastic', 'outstanding',
  'helpful', 'useful', 'valuable', 'appreciate', 'love', 'perfect',
  'professional', 'quick', 'fast', 'efficient', 'friendly', 'polite',
  'recommend', 'satisfied', 'pleased', 'impressed', 'exceptional'
];

const NEGATIVE_KEYWORDS = [
  'terrible', 'awful', 'horrible', 'worst', 'bad', 'poor', 'disappointing',
  'frustrating', 'annoying', 'useless', 'waste', 'rude', 'unprofessional',
  'slow', 'delayed', 'broken', 'error', 'problem', 'issue', 'complaint',
  'refund', 'cancel', 'unsubscribe', 'never', 'again'
];

const CONSTRUCTIVE_KEYWORDS = [
  'suggest', 'improve', 'better', 'could', 'should', 'would', 'feature',
  'request', 'enhancement', 'update', 'upgrade', 'consider', 'recommend',
  'feedback', 'opinion', 'think', 'feel', 'experience', 'journey'
];

const SPAM_INDICATORS = [
  'click here', 'buy now', 'free money', 'lottery', 'winner', 'urgent',
  'congratulations', 'limited time', 'act now', 'call now', 'promo',
  'discount', 'offer expires', 'no obligation', 'risk free'
];

// Calculate the combined text from all answers
const extractTextFromAnswers = (answers) => {
  let combinedText = '';
  
  if (typeof answers === 'object' && answers !== null) {
    for (const key in answers) {
      const value = answers[key];
      if (typeof value === 'string') {
        combinedText += ` ${value}`;
      } else if (typeof value === 'object') {
        // Handle nested objects or arrays
        combinedText += ` ${JSON.stringify(value)}`;
      }
    }
  }
  
  return combinedText.toLowerCase().trim();
};

// Calculate word count and character count
const getTextMetrics = (text) => {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  return {
    wordCount: words.length,
    charCount: text.length,
    avgWordLength: words.length > 0 ? text.length / words.length : 0
  };
};

// Count keyword occurrences in text
const countKeywords = (text, keywords) => {
  return keywords.reduce((count, keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = text.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
};

// Check for spam indicators
const checkSpamIndicators = (text) => {
  const spamCount = countKeywords(text, SPAM_INDICATORS);
  const spamDensity = spamCount / (text.length || 1) * 1000; // spam per 1000 chars
  return { spamCount, spamDensity };
};

// Calculate sentiment score
const calculateSentiment = (text) => {
  const positiveCount = countKeywords(text, POSITIVE_KEYWORDS);
  const negativeCount = countKeywords(text, NEGATIVE_KEYWORDS);
  const constructiveCount = countKeywords(text, CONSTRUCTIVE_KEYWORDS);
  
  // Calculate sentiment score (-100 to +100)
  const sentimentScore = Math.min(100, Math.max(-100, 
    (positiveCount * 20) - (negativeCount * 15) + (constructiveCount * 10)
  ));
  
  return {
    positiveCount,
    negativeCount,
    constructiveCount,
    sentimentScore
  };
};

// Calculate engagement score based on text complexity
const calculateEngagement = (text, metrics) => {
  let engagementScore = 0;
  
  // Length-based scoring
  if (metrics.wordCount >= 50) engagementScore += 30;
  else if (metrics.wordCount >= 20) engagementScore += 20;
  else if (metrics.wordCount >= 10) engagementScore += 10;
  else if (metrics.wordCount >= 5) engagementScore += 5;
  
  // Quality indicators
  if (metrics.avgWordLength > 4) engagementScore += 10; // More descriptive words
  if (text.includes('?')) engagementScore += 5; // Questions show engagement
  if (text.includes('!')) engagementScore += 5; // Exclamations show emotion
  
  // Punctuation and structure
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 1) engagementScore += 10; // Multiple sentences
  
  // Specific details (numbers, specific terms)
  const numberMatches = text.match(/\d+/g);
  if (numberMatches && numberMatches.length > 0) engagementScore += 10;
  
  return Math.min(100, engagementScore);
};

// Main scoring function
const scoreAndFlagFeedback = (answers) => {
  try {
    const text = extractTextFromAnswers(answers);
    
    // If no text content, return low score
    if (!text || text.length < 3) {
      return { score: 0, isFlagged: false };
    }
    
    const metrics = getTextMetrics(text);
    const sentiment = calculateSentiment(text);
    const engagement = calculateEngagement(text, metrics);
    const spam = checkSpamIndicators(text);
    
    // Calculate overall score (0-100)
    let score = 0;
    
    // Base score from engagement (40% weight)
    score += engagement * 0.4;
    
    // Sentiment contribution (30% weight)
    // Normalize sentiment to 0-100 and apply weight
    const normalizedSentiment = Math.max(0, (sentiment.sentimentScore + 100) / 2);
    score += normalizedSentiment * 0.3;
    
    // Length and detail bonus (20% weight)
    const lengthScore = Math.min(100, metrics.wordCount * 2);
    score += lengthScore * 0.2;
    
    // Quality multiplier (10% weight)
    let qualityMultiplier = 1;
    if (metrics.wordCount >= 20 && sentiment.constructiveCount > 0) {
      qualityMultiplier = 1.1;
    }
    score *= qualityMultiplier;
    
    // Penalize spam
    if (spam.spamCount > 0) {
      score *= 0.3; // Heavily penalize spam
    }
    
    // Penalize very short responses
    if (metrics.wordCount < 3) {
      score *= 0.2;
    }
    
    // Round and ensure bounds
    score = Math.round(Math.min(100, Math.max(0, score)));
    
    // Determine if feedback should be flagged for review
    // Flag high-quality feedback (top 10-20%)
    const isFlagged = score >= 70 || 
                     (score >= 50 && sentiment.constructiveCount >= 2) ||
                     (metrics.wordCount >= 50 && sentiment.sentimentScore !== 0);
    
    return { 
      score, 
      isFlagged,
      debug: {
        textLength: text.length,
        wordCount: metrics.wordCount,
        sentimentScore: sentiment.sentimentScore,
        engagementScore: engagement,
        spamIndicators: spam.spamCount
      }
    };
    
  } catch (error) {
    console.error('AI scoring error:', error);
    // Return safe defaults on error
    return { score: 0, isFlagged: false };
  }
};

// Get top feedback entries based on AI scores
const getTopFeedbackEntries = async (formId, limit = 10) => {
  try {
    const pool = require('../db');
    
    const result = await pool.query(
      `SELECT id, answers, ai_score, is_flagged, created_at, wants_to_be_contacted
       FROM feedback_entries 
       WHERE form_id = $1 
       ORDER BY ai_score DESC, created_at DESC 
       LIMIT $2`,
      [formId, limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting top feedback entries:', error);
    return [];
  }
};

// Analyze feedback trends for a form
const analyzeFeedbackTrends = (feedbackEntries) => {
  if (!Array.isArray(feedbackEntries) || feedbackEntries.length === 0) {
    return {
      averageScore: 0,
      totalEntries: 0,
      flaggedPercentage: 0,
      sentimentTrend: 'neutral'
    };
  }
  
  const totalEntries = feedbackEntries.length;
  const totalScore = feedbackEntries.reduce((sum, entry) => sum + (entry.ai_score || 0), 0);
  const flaggedCount = feedbackEntries.filter(entry => entry.is_flagged).length;
  
  const averageScore = totalScore / totalEntries;
  const flaggedPercentage = (flaggedCount / totalEntries) * 100;
  
  // Determine sentiment trend
  let sentimentTrend = 'neutral';
  if (averageScore >= 70) sentimentTrend = 'positive';
  else if (averageScore <= 30) sentimentTrend = 'negative';
  
  return {
    averageScore: Math.round(averageScore),
    totalEntries,
    flaggedPercentage: Math.round(flaggedPercentage),
    sentimentTrend,
    highQualityCount: flaggedCount
  };
};

module.exports = {
  scoreAndFlagFeedback,
  getTopFeedbackEntries,
  analyzeFeedbackTrends,
  extractTextFromAnswers
};
