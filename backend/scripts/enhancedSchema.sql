-- Enhanced Database Schema for FeedbackFusion 2.0
-- Supporting AI features, subscriptions, analytics, and advanced functionality

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    forms_limit INTEGER,
    responses_limit INTEGER,
    features JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price, forms_limit, responses_limit, features) VALUES
('Free', 0.00, 1, 100, '{"basic_analytics": true, "ai_features": false, "branding": false, "support": "community"}'),
('Pro', 29.99, 10, 5000, '{"basic_analytics": true, "advanced_analytics": true, "ai_features": true, "branding": true, "support": "email"}'),
('Enterprise', 99.99, null, null, '{"basic_analytics": true, "advanced_analytics": true, "ai_features": true, "branding": true, "team_access": true, "support": "priority"}')
ON CONFLICT (name) DO NOTHING;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES subscription_plans(id),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    forms_count INTEGER DEFAULT 0,
    responses_count INTEGER DEFAULT 0,
    month_year VARCHAR(7), -- Format: YYYY-MM
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month_year)
);

-- Enhanced users table with additional fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS business_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS business_logo TEXT,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_documents JSONB,
ADD COLUMN IF NOT EXISTS subscription_id INTEGER REFERENCES subscriptions(id),
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- Enhanced forms table with advanced features
ALTER TABLE feedback_forms 
ADD COLUMN IF NOT EXISTS form_type VARCHAR(50) DEFAULT 'feedback',
ADD COLUMN IF NOT EXISTS template_id INTEGER,
ADD COLUMN IF NOT EXISTS conditional_logic JSONB,
ADD COLUMN IF NOT EXISTS thank_you_message TEXT,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS schedule_settings JSONB,
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS qr_code_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS embed_code TEXT,
ADD COLUMN IF NOT EXISTS seo_meta JSONB,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_completion_time INTEGER; -- in seconds

-- Enhanced feedback_entries table with AI analysis
ALTER TABLE feedback_entries 
ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2), -- -1 to 1
ADD COLUMN IF NOT EXISTS sentiment_label VARCHAR(20), -- positive, negative, neutral
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spam_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS response_time INTEGER, -- time taken to complete form
ADD COLUMN IF NOT EXISTS device_info JSONB,
ADD COLUMN IF NOT EXISTS location_data JSONB;

-- Create form templates table
CREATE TABLE IF NOT EXISTS form_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    preview_image TEXT,
    is_premium BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES feedback_forms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- sentiment_summary, trends, recommendations, quality_users
    insight_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT false
);

-- Create analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    form_id INTEGER REFERENCES feedback_forms(id),
    event_type VARCHAR(50) NOT NULL, -- form_view, form_start, form_complete, form_abandon
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50), -- user, form, subscription
    target_id INTEGER,
    details JSONB,
    ip_address INET,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- IP address or user ID
    action VARCHAR(50) NOT NULL, -- form_submit, api_call, etc.
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, action)
);

-- Create business profiles table for public pages
CREATE TABLE IF NOT EXISTS business_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    public_name VARCHAR(100) NOT NULL,
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    contact_info JSONB,
    social_links JSONB,
    operating_hours JSONB,
    location JSONB,
    is_public BOOLEAN DEFAULT false,
    seo_title VARCHAR(200),
    seo_description TEXT,
    seo_keywords TEXT,
    page_views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table for business profiles
CREATE TABLE IF NOT EXISTS business_reviews (
    id SERIAL PRIMARY KEY,
    business_profile_id INTEGER REFERENCES business_profiles(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(100),
    reviewer_email VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create file uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    form_id INTEGER REFERENCES feedback_forms(id),
    response_id INTEGER REFERENCES feedback_entries(id),
    original_name VARCHAR(255),
    stored_name VARCHAR(255),
    file_path TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_secure BOOLEAN DEFAULT true,
    upload_type VARCHAR(50), -- profile_image, form_attachment, response_file
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- subscription_expiry, form_approved, new_response, etc.
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month ON usage_tracking(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_sentiment ON feedback_entries(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_spam ON feedback_entries(is_spam);
CREATE INDEX IF NOT EXISTS idx_analytics_events_form_id ON analytics_events(form_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_business_profiles_slug ON business_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_ai_insights_form_user ON ai_insights(form_id, user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean old rate limit entries
CREATE OR REPLACE FUNCTION clean_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Sample data for form templates
INSERT INTO form_templates (name, category, description, template_data, is_premium) VALUES
(
    'Restaurant Feedback',
    'Food & Beverage',
    'Comprehensive feedback form for restaurants and cafes',
    '{
        "fields": [
            {"type": "rating", "label": "Overall Experience", "required": true, "max": 5},
            {"type": "rating", "label": "Food Quality", "required": true, "max": 5},
            {"type": "rating", "label": "Service Quality", "required": true, "max": 5},
            {"type": "radio", "label": "How did you hear about us?", "options": ["Social Media", "Friends", "Google", "Walk-in"]},
            {"type": "checkbox", "label": "Which items did you order?", "options": ["Appetizers", "Main Course", "Desserts", "Beverages"]},
            {"type": "textarea", "label": "Additional Comments", "placeholder": "Tell us more about your experience..."}
        ]
    }',
    false
),
(
    'Gym/Fitness Center',
    'Health & Fitness',
    'Member satisfaction and facility feedback',
    '{
        "fields": [
            {"type": "rating", "label": "Equipment Quality", "required": true, "max": 5},
            {"type": "rating", "label": "Cleanliness", "required": true, "max": 5},
            {"type": "rating", "label": "Staff Helpfulness", "required": true, "max": 5},
            {"type": "select", "label": "Membership Type", "options": ["Basic", "Premium", "VIP"]},
            {"type": "checkbox", "label": "Which facilities do you use?", "options": ["Cardio", "Weights", "Classes", "Pool", "Sauna"]},
            {"type": "textarea", "label": "Suggestions for Improvement"}
        ]
    }',
    false
),
(
    'Retail Store Feedback',
    'Retail',
    'Customer shopping experience feedback',
    '{
        "fields": [
            {"type": "rating", "label": "Product Selection", "required": true, "max": 5},
            {"type": "rating", "label": "Store Layout", "required": true, "max": 5},
            {"type": "rating", "label": "Staff Assistance", "required": true, "max": 5},
            {"type": "radio", "label": "Visit Frequency", "options": ["First time", "Monthly", "Weekly", "Daily"]},
            {"type": "number", "label": "How much did you spend today?", "min": 0},
            {"type": "textarea", "label": "What products would you like to see more of?"}
        ]
    }',
    false
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE subscription_plans IS 'Available subscription plans with features and limits';
COMMENT ON TABLE subscriptions IS 'User subscription records with Stripe integration';
COMMENT ON TABLE usage_tracking IS 'Monthly usage tracking for subscription limits';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations';
COMMENT ON TABLE analytics_events IS 'Detailed analytics events for form interactions';
COMMENT ON TABLE business_profiles IS 'Public business profile pages';
COMMENT ON TABLE form_templates IS 'Pre-built form templates for different industries';
