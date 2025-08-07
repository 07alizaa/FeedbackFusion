// utils/subscriptionService.js - Stripe subscription management
const { pool } = require('../models/db');

// Initialize Stripe only if API key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
    console.log('⚠️  Stripe not configured - subscription features will be limited');
}

/**
 * Create a new customer in Stripe
 * @param {Object} user - User object
 * @returns {Object} - Stripe customer object
 */
async function createStripeCustomer(user) {
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    try {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: {
                userId: user.id.toString(),
                businessName: user.business_name || ''
            }
        });

        // Update user with Stripe customer ID
        await pool.query(
            'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
            [customer.id, user.id]
        );

        return customer;
    } catch (error) {
        console.error('Error creating Stripe customer:', error);
        throw new Error('Failed to create customer');
    }
}

/**
 * Create a subscription
 * @param {number} userId - User ID
 * @param {string} planName - Plan name (Free, Pro, Enterprise)
 * @returns {Object} - Subscription details
 */
async function createSubscription(userId, planName) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Get user and plan details
        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
        const planResult = await client.query('SELECT * FROM subscription_plans WHERE name = $1', [planName]);

        if (userResult.rows.length === 0) {
            throw new Error('User not found');
        }

        if (planResult.rows.length === 0) {
            throw new Error('Plan not found');
        }

        const user = userResult.rows[0];
        const plan = planResult.rows[0];

        // For free plan, just create local subscription
        if (plan.name === 'Free') {
            const subscription = await client.query(`
                INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
                VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '1 year')
                RETURNING *
            `, [userId, plan.id]);

            await client.query('COMMIT');
            return { subscription: subscription.rows[0], requiresPayment: false };
        }

        // For paid plans, check if Stripe is configured
        if (!stripe) {
            throw new Error('Stripe not configured - paid plans not available');
        }

        // Create Stripe customer if doesn't exist
        let stripeCustomerId = user.stripe_customer_id;
        if (!stripeCustomerId) {
            const customer = await createStripeCustomer(user);
            stripeCustomerId = customer.id;
        }

        // Create Stripe price if doesn't exist
        let stripePriceId = plan.stripe_price_id;
        if (!stripePriceId) {
            const price = await stripe.prices.create({
                currency: 'usd',
                unit_amount: Math.round(plan.price * 100), // Convert to cents
                recurring: { interval: 'month' },
                product_data: {
                    name: `FeedbackFusion ${plan.name} Plan`,
                    description: `${plan.name} subscription plan with ${plan.forms_limit || 'unlimited'} forms and ${plan.responses_limit || 'unlimited'} responses`
                }
            });

            stripePriceId = price.id;
            await client.query(
                'UPDATE subscription_plans SET stripe_price_id = $1 WHERE id = $2',
                [stripePriceId, plan.id]
            );
        }

        // Create Stripe subscription
        const stripeSubscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: stripePriceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent']
        });

        // Save subscription to database
        const subscription = await client.query(`
            INSERT INTO subscriptions (
                user_id, plan_id, stripe_subscription_id, stripe_customer_id, 
                status, current_period_start, current_period_end
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            userId, plan.id, stripeSubscription.id, stripeCustomerId,
            stripeSubscription.status,
            new Date(stripeSubscription.current_period_start * 1000),
            new Date(stripeSubscription.current_period_end * 1000)
        ]);

        await client.query('COMMIT');

        return {
            subscription: subscription.rows[0],
            stripeSubscription,
            clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret,
            requiresPayment: true
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating subscription:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Update subscription status from Stripe webhook
 * @param {Object} stripeSubscription - Stripe subscription object
 */
async function updateSubscriptionStatus(stripeSubscription) {
    try {
        await pool.query(`
            UPDATE subscriptions 
            SET status = $1, current_period_start = $2, current_period_end = $3, updated_at = NOW()
            WHERE stripe_subscription_id = $4
        `, [
            stripeSubscription.status,
            new Date(stripeSubscription.current_period_start * 1000),
            new Date(stripeSubscription.current_period_end * 1000),
            stripeSubscription.id
        ]);

        // If subscription is cancelled, downgrade to free plan
        if (stripeSubscription.status === 'canceled') {
            const freePlan = await pool.query('SELECT id FROM subscription_plans WHERE name = $1', ['Free']);
            if (freePlan.rows.length > 0) {
                await pool.query(`
                    UPDATE subscriptions 
                    SET plan_id = $1 
                    WHERE stripe_subscription_id = $2
                `, [freePlan.rows[0].id, stripeSubscription.id]);
            }
        }
    } catch (error) {
        console.error('Error updating subscription status:', error);
        throw error;
    }
}

/**
 * Cancel subscription
 * @param {number} userId - User ID
 */
async function cancelSubscription(userId) {
    try {
        const result = await pool.query(`
            SELECT s.*, sp.name as plan_name 
            FROM subscriptions s 
            JOIN subscription_plans sp ON s.plan_id = sp.id 
            WHERE s.user_id = $1 AND s.status = 'active'
        `, [userId]);

        if (result.rows.length === 0) {
            throw new Error('No active subscription found');
        }

        const subscription = result.rows[0];

        // If it's a Stripe subscription, cancel it
        if (subscription.stripe_subscription_id) {
            await stripe.subscriptions.update(subscription.stripe_subscription_id, {
                cancel_at_period_end: true
            });
        }

        // Update local status
        await pool.query(`
            UPDATE subscriptions 
            SET status = 'canceled', updated_at = NOW()
            WHERE user_id = $1 AND status = 'active'
        `, [userId]);

        return { success: true, message: 'Subscription will be canceled at the end of the billing period' };
    } catch (error) {
        console.error('Error canceling subscription:', error);
        throw error;
    }
}

/**
 * Get user's current subscription
 * @param {number} userId - User ID
 * @returns {Object} - Subscription details with plan info
 */
async function getUserSubscription(userId) {
    try {
        const result = await pool.query(`
            SELECT s.*, sp.name, sp.price, sp.forms_limit, sp.responses_limit, sp.features
            FROM subscriptions s
            JOIN subscription_plans sp ON s.plan_id = sp.id
            WHERE s.user_id = $1 AND s.status IN ('active', 'trialing')
            ORDER BY s.created_at DESC
            LIMIT 1
        `, [userId]);

        if (result.rows.length === 0) {
            // Return free plan as default
            const freePlan = await pool.query('SELECT * FROM subscription_plans WHERE name = $1', ['Free']);
            return freePlan.rows[0] || null;
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error getting user subscription:', error);
        throw error;
    }
}

/**
 * Check usage limits
 * @param {number} userId - User ID
 * @returns {Object} - Current usage and limits
 */
async function checkUsageLimits(userId) {
    try {
        const subscription = await getUserSubscription(userId);
        if (!subscription) {
            throw new Error('No subscription found');
        }

        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

        // Get current month usage
        const usageResult = await pool.query(`
            SELECT forms_count, responses_count 
            FROM usage_tracking 
            WHERE user_id = $1 AND month_year = $2
        `, [userId, currentMonth]);

        const currentUsage = usageResult.rows[0] || { forms_count: 0, responses_count: 0 };

        // Get actual counts
        const formsResult = await pool.query(
            'SELECT COUNT(*) as count FROM feedback_forms WHERE user_id = $1',
            [userId]
        );

        const responsesResult = await pool.query(`
            SELECT COUNT(*) as count 
            FROM feedback_entries fe 
            JOIN feedback_forms ff ON fe.form_id = ff.id 
            WHERE ff.user_id = $1 AND fe.created_at >= $2
        `, [userId, new Date(currentMonth + '-01')]);

        const actualForms = parseInt(formsResult.rows[0].count);
        const actualResponses = parseInt(responsesResult.rows[0].count);

        // Update usage tracking
        await pool.query(`
            INSERT INTO usage_tracking (user_id, month_year, forms_count, responses_count)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, month_year)
            DO UPDATE SET 
                forms_count = $3,
                responses_count = $4
        `, [userId, currentMonth, actualForms, actualResponses]);

        return {
            subscription: {
                plan: subscription.name,
                forms_limit: subscription.forms_limit,
                responses_limit: subscription.responses_limit,
                features: subscription.features
            },
            usage: {
                forms_count: actualForms,
                responses_count: actualResponses
            },
            limits: {
                forms_exceeded: subscription.forms_limit ? actualForms >= subscription.forms_limit : false,
                responses_exceeded: subscription.responses_limit ? actualResponses >= subscription.responses_limit : false
            }
        };
    } catch (error) {
        console.error('Error checking usage limits:', error);
        throw error;
    }
}

/**
 * Get all subscription plans
 * @returns {Array} - Array of subscription plans
 */
async function getSubscriptionPlans() {
    try {
        const result = await pool.query('SELECT * FROM subscription_plans ORDER BY price ASC');
        return result.rows;
    } catch (error) {
        console.error('Error getting subscription plans:', error);
        throw error;
    }
}

/**
 * Create billing portal session
 * @param {number} userId - User ID
 * @returns {Object} - Billing portal session
 */
async function createBillingPortalSession(userId) {
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    try {
        const user = await pool.query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
        
        if (!user.rows[0]?.stripe_customer_id) {
            throw new Error('No Stripe customer found');
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.rows[0].stripe_customer_id,
            return_url: `${process.env.FRONTEND_URL}/vendor/billing`
        });

        return session;
    } catch (error) {
        console.error('Error creating billing portal session:', error);
        throw error;
    }
}

/**
 * Handle Stripe webhook events
 * @param {Object} event - Stripe webhook event
 */
async function handleStripeWebhook(event) {
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    try {
        switch (event.type) {
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                await updateSubscriptionStatus(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                // Handle successful payment
                const subscription = event.data.object.subscription;
                if (subscription) {
                    await pool.query(`
                        UPDATE subscriptions 
                        SET status = 'active', updated_at = NOW()
                        WHERE stripe_subscription_id = $1
                    `, [subscription]);
                }
                break;

            case 'invoice.payment_failed':
                // Handle failed payment
                const failedSubscription = event.data.object.subscription;
                if (failedSubscription) {
                    await pool.query(`
                        UPDATE subscriptions 
                        SET status = 'past_due', updated_at = NOW()
                        WHERE stripe_subscription_id = $1
                    `, [failedSubscription]);
                }
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    } catch (error) {
        console.error('Error handling Stripe webhook:', error);
        throw error;
    }
}

module.exports = {
    createStripeCustomer,
    createSubscription,
    updateSubscriptionStatus,
    cancelSubscription,
    getUserSubscription,
    checkUsageLimits,
    getSubscriptionPlans,
    createBillingPortalSession,
    handleStripeWebhook
};
