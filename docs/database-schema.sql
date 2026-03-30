-- =====================================================
-- SCHOLARSHIP AGGREGATOR & PREPARATION PLATFORM
-- DATABASE SCHEMA DESIGN (PostgreSQL)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('guest', 'free', 'premium', 'admin') DEFAULT 'free',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    nationality VARCHAR(100),
    current_country VARCHAR(100),
    gpa DECIMAL(3,2) CHECK (gpa >= 0.00 AND gpa <= 4.00),
    major VARCHAR(200),
    degree_level ENUM('high_school', 'bachelor', 'master', 'doctorate'),
    graduation_year INTEGER,
    profile_completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Language proficiency table
CREATE TABLE user_languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(100) NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'native') NOT NULL,
    certification VARCHAR(200),
    score VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SUBSCRIPTION MANAGEMENT
-- =====================================================

-- Subscription plans table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    billing_cycle ENUM('monthly', 'quarterly', 'yearly') NOT NULL,
    features JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions table
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status ENUM('active', 'cancelled', 'expired', 'pending') DEFAULT 'pending',
    starts_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SCHOLARSHIP MANAGEMENT
-- =====================================================

-- Scholarship providers table
CREATE TABLE scholarship_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    website VARCHAR(500),
    description TEXT,
    logo_url VARCHAR(500),
    country VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scholarships table
CREATE TABLE scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES scholarship_providers(id),
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'USD',
    type ENUM('full', 'partial', 'merit', 'need_based', 'sports', 'academic') NOT NULL,
    level ENUM('high_school', 'bachelor', 'master', 'doctorate', 'postdoc') NOT NULL,
    target_countries JSON, -- Array of country codes
    eligible_nationalities JSON, -- Array of country codes
    fields_of_study JSON, -- Array of study fields
    minimum_gpa DECIMAL(3,2),
    language_requirements JSON, -- {language: level} pairs
    application_deadline DATE NOT NULL,
    start_date DATE,
    duration_months INTEGER,
    application_url VARCHAR(1000) NOT NULL,
    requirements TEXT,
    benefits TEXT,
    selection_criteria TEXT,
    application_process TEXT,
    status ENUM('active', 'inactive', 'expired', 'draft') DEFAULT 'active',
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    scraped_at TIMESTAMP,
    last_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MATCHING SYSTEM
-- =====================================================

-- User scholarship matches table
CREATE TABLE scholarship_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2) NOT NULL, -- Percentage: 0.00 to 100.00
    criteria_met JSON, -- Details of which criteria are met
    criteria_missing JSON, -- Details of missing criteria
    recommendations TEXT, -- AI-generated recommendations
    is_bookmarked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, scholarship_id)
);

-- User match searches table (for rate limiting)
CREATE TABLE match_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_criteria JSON, -- Store search parameters
    results_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PREPARATION ROADMAPS
-- =====================================================

-- Roadmaps table
CREATE TABLE roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    target_deadline DATE NOT NULL,
    status ENUM('active', 'completed', 'paused', 'cancelled') DEFAULT 'active',
    progress_percentage INTEGER DEFAULT 0,
    estimated_hours INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roadmap milestones table
CREATE TABLE roadmap_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed', 'overdue') DEFAULT 'pending',
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily tasks table
CREATE TABLE daily_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES roadmap_milestones(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type ENUM('document', 'research', 'application', 'test_prep', 'other') DEFAULT 'other',
    estimated_duration INTEGER, -- in minutes
    due_date DATE NOT NULL,
    status ENUM('pending', 'completed', 'skipped') DEFAULT 'pending',
    completed_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document checklist table
CREATE TABLE document_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    document_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    status ENUM('not_started', 'in_progress', 'completed', 'verified') DEFAULT 'not_started',
    file_path VARCHAR(500),
    uploaded_at TIMESTAMP NULL,
    verified_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DISCUSSION FORUM
-- =====================================================

-- Forum categories table
CREATE TABLE forum_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum topics table
CREATE TABLE forum_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    status ENUM('open', 'closed', 'pinned', 'locked') DEFAULT 'open',
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP,
    last_reply_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    tags JSON, -- Array of tag strings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum replies table
CREATE TABLE forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT FALSE,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum reply likes table
CREATE TABLE forum_reply_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reply_id UUID NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reply_id, user_id)
);

-- =====================================================
-- SYSTEM LOGS & ANALYTICS
-- =====================================================

-- Activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scraping logs table
CREATE TABLE scraping_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name VARCHAR(200) NOT NULL,
    source_url VARCHAR(1000) NOT NULL,
    status ENUM('success', 'failed', 'partial') NOT NULL,
    scholarships_found INTEGER DEFAULT 0,
    scholarships_added INTEGER DEFAULT 0,
    scholarships_updated INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error', 'deadline', 'match', 'forum') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_gpa ON user_profiles(gpa);
CREATE INDEX idx_user_profiles_major ON user_profiles(major);
CREATE INDEX idx_user_profiles_degree_level ON user_profiles(degree_level);

-- Scholarships indexes
CREATE INDEX idx_scholarships_provider_id ON scholarships(provider_id);
CREATE INDEX idx_scholarships_level ON scholarships(level);
CREATE INDEX idx_scholarships_type ON scholarships(type);
CREATE INDEX idx_scholarships_deadline ON scholarships(application_deadline);
CREATE INDEX idx_scholarships_status ON scholarships(status);
CREATE INDEX idx_scholarships_featured ON scholarships(is_featured);
CREATE INDEX idx_scholarships_amount ON scholarships(amount);

-- Scholarship matches indexes
CREATE INDEX idx_matches_user_id ON scholarship_matches(user_id);
CREATE INDEX idx_matches_scholarship_id ON scholarship_matches(scholarship_id);
CREATE INDEX idx_matches_score ON scholarship_matches(match_score DESC);
CREATE INDEX idx_matches_bookmarked ON scholarship_matches(user_id, is_bookmarked) WHERE is_bookmarked = TRUE;

-- Roadmaps indexes
CREATE INDEX idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX idx_roadmaps_scholarship_id ON roadmaps(scholarship_id);
CREATE INDEX idx_roadmaps_status ON roadmaps(status);
CREATE INDEX idx_roadmaps_deadline ON roadmaps(target_deadline);

-- Daily tasks indexes
CREATE INDEX idx_tasks_roadmap_id ON daily_tasks(roadmap_id);
CREATE INDEX idx_tasks_due_date ON daily_tasks(due_date);
CREATE INDEX idx_tasks_status ON daily_tasks(status);

-- Forum indexes
CREATE INDEX idx_forum_topics_category_id ON forum_topics(category_id);
CREATE INDEX idx_forum_topics_user_id ON forum_topics(user_id);
CREATE INDEX idx_forum_topics_status ON forum_topics(status);
CREATE INDEX idx_forum_topics_last_reply ON forum_topics(last_reply_at DESC);
CREATE INDEX idx_forum_replies_topic_id ON forum_replies(topic_id);
CREATE INDEX idx_forum_replies_user_id ON forum_replies(user_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =====================================================
-- SAMPLE DATA INSERTIONS
-- =====================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, billing_cycle, features) VALUES
('Free', 'Basic scholarship matching and preparation tools', 0.00, 'monthly', 
 '["top_3_matches", "1_roadmap_per_3_months", "basic_forum_access", "scholarship_calendar"]'),
('Premium Monthly', 'Unlimited access to all features', 19.99, 'monthly', 
 '["unlimited_matches", "unlimited_roadmaps", "priority_support", "advanced_filters", "export_features"]'),
('Premium Yearly', 'Unlimited access to all features with yearly discount', 199.99, 'yearly', 
 '["unlimited_matches", "unlimited_roadmaps", "priority_support", "advanced_filters", "export_features", "yearly_discount"]');

-- Insert forum categories
INSERT INTO forum_categories (name, description, slug, icon, order_index) VALUES
('General Discussion', 'General scholarship and education discussions', 'general', 'chat', 1),
('Scholarship Help', 'Help with specific scholarships and applications', 'scholarship-help', 'help-circle', 2),
('Test Preparation', 'Discussions about standardized tests and preparation', 'test-prep', 'book-open', 3),
('Success Stories', 'Share your scholarship success stories', 'success-stories', 'trophy', 4),
('Country-Specific', 'Discussions organized by target countries', 'country-specific', 'globe', 5);

-- =====================================================
-- CONSTRAINTS AND TRIGGERS
-- =====================================================

-- Ensure user can only have one active subscription
CREATE UNIQUE INDEX idx_unique_active_subscription 
ON user_subscriptions (user_id) 
WHERE status = 'active';

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scholarships_updated_at BEFORE UPDATE ON scholarships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update subscription plan trigger
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update user subscriptions trigger
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update forum topic reply counts
CREATE OR REPLACE FUNCTION update_topic_reply_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_topics 
        SET reply_count = reply_count + 1,
            last_reply_at = NEW.created_at,
            last_reply_user_id = NEW.user_id
        WHERE id = NEW.topic_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_topics 
        SET reply_count = reply_count - 1
        WHERE id = OLD.topic_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trigger_update_topic_reply_stats
    AFTER INSERT OR DELETE ON forum_replies
    FOR EACH ROW EXECUTE FUNCTION update_topic_reply_stats();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active scholarships view
CREATE VIEW active_scholarships AS
SELECT s.*, sp.name as provider_name, sp.website as provider_website
FROM scholarships s
JOIN scholarship_providers sp ON s.provider_id = sp.id
WHERE s.status = 'active' 
AND s.application_deadline > CURRENT_DATE;

-- User dashboard view
CREATE VIEW user_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    up.first_name,
    up.last_name,
    up.profile_completion_percentage,
    COUNT(DISTINCT sm.id) as total_matches,
    COUNT(DISTINCT r.id) as active_roadmaps,
    COUNT(DISTINCT dt.id) as pending_tasks
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN scholarship_matches sm ON u.id = sm.user_id
LEFT JOIN roadmaps r ON u.id = r.user_id AND r.status = 'active'
LEFT JOIN daily_tasks dt ON r.id = dt.roadmap_id AND dt.status = 'pending'
GROUP BY u.id, u.email, u.role, up.first_name, up.last_name, up.profile_completion_percentage;