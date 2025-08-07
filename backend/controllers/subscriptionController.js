// controllers/subscriptionController.js - Subscription management endpoints
const subscriptionService = require('../utils/subscriptionService');
const { pool } = require('../models/db');

/**
 * Get all subscription plans
 */
const getPlans = async (req, res) => {
    try {
        const plans = await subscriptionService.getSubscriptionPlans();
        res.json({ success: true, plans });
    } catch (error) {
        console.error('Error getting plans:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get subscription plans' 
        });
    }
};

/**
 * Get current user subscription
 */
const getCurrentSubscription = async (req, res) => {
    try {
        const userId = req.user.userId;
        const subscription = await subscriptionService.getUserSubscription(userId);
        const usage = await subscriptionService.checkUsageLimits(userId);
        
        res.json({ 
            success: true, 
            subscription, 
            usage: usage.usage,
            limits: usage.limits
        });
    } catch (error) {
        console.error('Error getting current subscription:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get subscription details' 
        });
    }
};

/**
 * Create a new subscription
 */
const createSubscription = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { planName } = req.body;

        if (!planName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Plan name is required' 
            });
        }

        const result = await subscriptionService.createSubscription(userId, planName);
        
        res.json({ 
            success: true, 
            message: 'Subscription created successfully',
            ...result
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to create subscription' 
        });
    }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await subscriptionService.cancelSubscription(userId);
        
        res.json({ 
            success: true, 
            message: result.message 
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to cancel subscription' 
        });
    }
};

/**
 * Create billing portal session
 */
const createBillingPortal = async (req, res) => {
    try {
        const userId = req.user.userId;
        const session = await subscriptionService.createBillingPortalSession(userId);
        
        res.json({ 
            success: true, 
            url: session.url 
        });
    } catch (error) {
        console.error('Error creating billing portal:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to create billing portal session' 
        });
    }
};

/**
 * Handle Stripe webhooks
 */
const handleWebhook = async (req, res) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(400).json({ error: 'Stripe not configured' });
        }

        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            await subscriptionService.handleStripeWebhook(event);
            res.json({ received: true });
        } catch (error) {
            console.error('Error handling webhook:', error);
            res.status(500).json({ error: 'Webhook handler failed' });
        }
    } catch (error) {
        console.error('Error in webhook handler:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
};

/**
 * Check usage limits for current user
 */
const checkUsage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const usage = await subscriptionService.checkUsageLimits(userId);
        
        res.json({ 
            success: true, 
            ...usage 
        });
    } catch (error) {
        console.error('Error checking usage:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to check usage limits' 
        });
    }
};

/**
 * Get subscription analytics (admin only)
 */
const getSubscriptionAnalytics = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }

        const analytics = await pool.query(`
            SELECT 
                sp.name as plan_name,
                COUNT(s.id) as subscriber_count,
                SUM(sp.price) as monthly_revenue,
                AVG(EXTRACT(EPOCH FROM (s.updated_at - s.created_at))/86400) as avg_retention_days
            FROM subscription_plans sp
            LEFT JOIN subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
            GROUP BY sp.id, sp.name, sp.price
            ORDER BY sp.price ASC
        `);

        const totalStats = await pool.query(`
            SELECT 
                COUNT(DISTINCT s.user_id) as total_subscribers,
                SUM(sp.price) as total_monthly_revenue,
                COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_subscriptions,
                COUNT(CASE WHEN s.status = 'canceled' THEN 1 END) as canceled_subscriptions
            FROM subscriptions s
            JOIN subscription_plans sp ON s.plan_id = sp.id
        `);

        res.json({ 
            success: true, 
            planAnalytics: analytics.rows,
            totalStats: totalStats.rows[0]
        });

    } catch (error) {
        console.error('Error getting subscription analytics:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get subscription analytics' 
        });
    }
};

module.exports = {
    getPlans,
    getCurrentSubscription,
    createSubscription,
    cancelSubscription,
    createBillingPortal,
    handleWebhook,
    checkUsage,
    getSubscriptionAnalytics
};
