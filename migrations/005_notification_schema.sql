-- =====================================================
-- NOTIFICATION SCHEMA - User Notifications
-- =====================================================

-- Notification Templates - Email/SMS templates
CREATE TABLE notification.notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,  -- e.g., 'welcome_email', 'transaction_alert'
    description TEXT,
    
    -- Template Content
    type notification.notification_type NOT NULL,
    subject_template TEXT,  -- For emails
    body_template TEXT NOT NULL,  -- Handlebars/Mustache syntax
    
    -- Versioning
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES auth.users(id)
);

-- Notifications - Log of all notifications sent/queued
CREATE TABLE notification.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content
    template_id UUID REFERENCES notification.notification_templates(id),
    type notification.notification_type NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    data JSONB,  -- Dynamic data used in template
    
    -- Delivery Status
    status notification.notification_status DEFAULT 'pending',
    provider_id VARCHAR(100),  -- ID from SendGrid/Twilio/FCM
    error_message TEXT,
    
    -- Timing
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,  -- For in-app notifications
    
    -- Metadata
    reference_type VARCHAR(50),  -- transaction, account, security
    reference_id UUID,  -- ID of the related entity
    priority VARCHAR(10) DEFAULT 'normal',  -- low, normal, high, urgent
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Notification Settings - Preferences
CREATE TABLE notification.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Channel Preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    
    -- Category Preferences
    transaction_alerts_enabled BOOLEAN DEFAULT TRUE,
    transaction_threshold DECIMAL(15, 2),  -- Only alert if > X
    marketing_emails_enabled BOOLEAN DEFAULT FALSE,
    security_alerts_enabled BOOLEAN DEFAULT TRUE,  -- Cannot be disabled typically, but good for UI
    
    -- Do Not Disturb
    dnd_enabled BOOLEAN DEFAULT FALSE,
    dnd_start_time TIME,
    dnd_end_time TIME,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Device Tokens - For Push Notifications
CREATE TABLE notification.device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Token Details
    token VARCHAR(500) NOT NULL,
    provider VARCHAR(20) DEFAULT 'fcm',  -- fcm, apns
    device_type VARCHAR(20),  -- android, ios, web
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, token)
);

-- =====================================================
-- INDEXES - Notification Schema
-- =====================================================

CREATE INDEX idx_notifications_user ON notification.notifications(user_id);
CREATE INDEX idx_notifications_status ON notification.notifications(status);
CREATE INDEX idx_notifications_created ON notification.notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notification.notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_reference ON notification.notifications(reference_type, reference_id);

CREATE INDEX idx_device_tokens_user ON notification.device_tokens(user_id);
CREATE INDEX idx_device_tokens_active ON notification.device_tokens(token) WHERE is_active = TRUE;

-- =====================================================
-- TRIGGERS - Notification Schema
-- =====================================================

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notification.notifications
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON notification.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE notification.notification_templates IS 'Templates for email, SMS, and push messages';
COMMENT ON TABLE notification.notifications IS 'History of sent and pending notifications';
COMMENT ON TABLE notification.user_settings IS 'User preferences for notification channels and categories';
COMMENT ON TABLE notification.device_tokens IS 'FCM/APNS tokens for push notifications';
