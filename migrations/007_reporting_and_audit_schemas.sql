-- =====================================================
-- REPORTING & AUDIT SCHEMAS
-- =====================================================

-- =====================================================
-- REPORTING SCHEMA
-- =====================================================

-- Generated Reports - Metadata for generated files
CREATE TABLE reporting.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- transaction_history, balance_sheet, kyc_summary
    
    -- Parameters
    parameters JSONB,  -- { "start_date": "...", "end_date": "..." }
    requested_by UUID REFERENCES auth.users(id),
    
    -- Output
    status VARCHAR(20) DEFAULT 'pending',  -- pending, generating, completed, failed
    file_url TEXT,  -- S3 URL
    file_format VARCHAR(10),  -- pdf, csv, xlsx
    file_size_bytes BIGINT,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled Reports - Configuration for recurring reports
CREATE TABLE reporting.scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    
    -- Schedule
    frequency VARCHAR(20) NOT NULL,  -- daily, weekly, monthly
    cron_expression VARCHAR(50),  -- Optional advanced scheduling
    
    -- Configuration
    parameters JSONB,
    recipients TEXT[],  -- Array of email addresses
    email_subject TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Dashboard Stats - Materialized stats for quick access
CREATE TABLE reporting.daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    
    -- Customer Stats
    new_customers INTEGER DEFAULT 0,
    total_active_customers INTEGER DEFAULT 0,
    
    -- Transaction Stats
    total_transactions_count INTEGER DEFAULT 0,
    total_transactions_volume DECIMAL(19, 4) DEFAULT 0,
    failed_transactions_count INTEGER DEFAULT 0,
    
    -- Fraud Stats
    fraud_alerts_count INTEGER DEFAULT 0,
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AUDIT SCHEMA
-- =====================================================

-- Audit Logs - General system audit trail
CREATE TABLE audit.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor
    user_id UUID,  -- Nullable for system actions
    username VARCHAR(100),  -- Snapshot in case user is deleted
    role VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    
    -- Action
    action VARCHAR(100) NOT NULL,  -- create_user, update_account, delete_transaction
    resource_type VARCHAR(50) NOT NULL,  -- user, account, transaction
    resource_id UUID,
    
    -- Changes
    method VARCHAR(10),  -- HTTP method if API call
    endpoint VARCHAR(255),
    status_code INTEGER,
    
    -- Data Changes (Snapshot)
    old_data JSONB,
    new_data JSONB,
    
    -- Metadata
    correlation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Access Logs - High volume request logging (optional, maybe better in ELK/Splunk)
-- Keeping structural data only for critical access patterns
CREATE TABLE audit.api_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    api_key_id UUID,
    
    method VARCHAR(10) NOT NULL,
    path VARCHAR(255) NOT NULL,
    status_code INTEGER NOT NULL,
    latency_ms INTEGER,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Partition API logs by month
CREATE TABLE audit.api_access_logs_current PARTITION OF audit.api_access_logs
    FOR VALUES FROM (NOW() - INTERVAL '1 month') TO (NOW() + INTERVAL '1 month');

-- =====================================================
-- INDEXES - Reporting & Audit
-- =====================================================

CREATE INDEX idx_reports_user ON reporting.reports(requested_by);
CREATE INDEX idx_reports_created ON reporting.reports(created_at DESC);

CREATE INDEX idx_scheduled_reports_active ON reporting.scheduled_reports(is_active);
CREATE INDEX idx_scheduled_reports_next ON reporting.scheduled_reports(next_run_at);

CREATE INDEX idx_daily_stats_date ON reporting.daily_stats(date DESC);

CREATE INDEX idx_audit_logs_user ON audit.activity_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit.activity_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit.activity_logs(action);
CREATE INDEX idx_audit_logs_created ON audit.activity_logs(created_at DESC);
CREATE INDEX idx_audit_logs_correlation ON audit.activity_logs(correlation_id);

CREATE INDEX idx_api_logs_created ON audit.api_access_logs(created_at DESC);
CREATE INDEX idx_api_logs_user ON audit.api_access_logs(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_scheduled_reports_updated_at
    BEFORE UPDATE ON reporting.scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE reporting.reports IS 'History of generated system reports';
COMMENT ON TABLE reporting.scheduled_reports IS 'Configuration for recurring automated reports';
COMMENT ON TABLE audit.activity_logs IS 'Comprehensive system-wide audit trail for compliance';
