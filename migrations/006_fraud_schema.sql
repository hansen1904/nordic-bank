-- =====================================================
-- FRAUD SCHEMA - Detection & Monitoring
-- =====================================================

-- Fraud Rules - Definable rules for detection
CREATE TABLE fraud.rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_code VARCHAR(50) UNIQUE NOT NULL,  -- e.g., 'VELOCITY_H', 'LARGE_TX'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Logic
    rule_type VARCHAR(20) NOT NULL,  -- velocity, value, location, pattern, blacklist
    parameters JSONB NOT NULL,  -- e.g., { "threshold": 10000, "window_minutes": 60 }
    risk_score_impact INTEGER NOT NULL,  -- Points to add to risk score
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    severity fraud.alert_severity DEFAULT 'medium',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Fraud Alerts - Generated when rules are triggered
CREATE TABLE fraud.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transaction.transactions(id),
    user_id UUID REFERENCES auth.users(id),
    
    -- Alert Details
    rule_id UUID REFERENCES fraud.rules(id),
    severity fraud.alert_severity NOT NULL,
    risk_score INTEGER,
    details TEXT,
    snapshot_data JSONB,  -- Snapshot of transaction/user state at detection
    
    -- Resolution
    status fraud.alert_status DEFAULT 'new',
    assigned_to UUID REFERENCES auth.users(id),  -- Investigator
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Suspicious Activities - Aggregate monitoring events
CREATE TABLE fraud.suspicious_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    session_id UUID,  -- Link to auth.sessions
    
    -- Activity
    activity_type VARCHAR(50) NOT NULL,  -- login_failed, password_reset, device_change
    description TEXT,
    ip_address INET,
    country_code CHAR(2),
    
    -- Risk
    risk_level VARCHAR(20),  -- low, medium, high
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trusted Devices - Whitelist of known good devices
CREATE TABLE fraud.trusted_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Device Info
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(100),
    last_ip_address INET,
    
    -- Status
    trust_level VARCHAR(20) DEFAULT 'trusted',  -- trusted, blocked, pending
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, device_fingerprint)
);

-- Blacklist - Known bad actors/IPs
CREATE TABLE fraud.blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Target
    type VARCHAR(20) NOT NULL,  -- ip, email, phone, country, device
    value VARCHAR(255) NOT NULL,
    
    -- Details
    reason TEXT,
    severity VARCHAR(20) DEFAULT 'high',
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(type, value)
);

-- Case Management - For investigation
CREATE TABLE fraud.cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Subject
    customer_id UUID REFERENCES customer.customers(id),
    primary_alert_id UUID REFERENCES fraud.alerts(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'open',  -- open, investigating, closed_fraud, closed_false_positive
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Assignment
    assigned_agent_id UUID REFERENCES auth.users(id),
    
    -- Notes
    summary TEXT,
    internal_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Case Evidence
CREATE TABLE fraud.case_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES fraud.cases(id) ON DELETE CASCADE,
    
    -- Content
    evidence_type VARCHAR(50),  -- logs, screenshot, document
    description TEXT,
    attachment_url TEXT,
    
    added_by UUID REFERENCES auth.users(id),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES - Fraud Schema
-- =====================================================

CREATE INDEX idx_fraud_rules_active ON fraud.rules(is_active);

CREATE INDEX idx_fraud_alerts_transaction ON fraud.alerts(transaction_id);
CREATE INDEX idx_fraud_alerts_user ON fraud.alerts(user_id);
CREATE INDEX idx_fraud_alerts_status ON fraud.alerts(status);
CREATE INDEX idx_fraud_alerts_severity ON fraud.alerts(severity);
CREATE INDEX idx_fraud_alerts_created ON fraud.alerts(created_at DESC);

CREATE INDEX idx_suspicious_user ON fraud.suspicious_activities(user_id);
CREATE INDEX idx_suspicious_created ON fraud.suspicious_activities(created_at DESC);

CREATE INDEX idx_trusted_devices_user ON fraud.trusted_devices(user_id, device_fingerprint);

CREATE INDEX idx_blacklist_value ON fraud.blacklist(type, value);
CREATE INDEX idx_blacklist_expiry ON fraud.blacklist(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_cases_customer ON fraud.cases(customer_id);
CREATE INDEX idx_cases_status ON fraud.cases(status);
CREATE INDEX idx_cases_assigned ON fraud.cases(assigned_agent_id);

-- =====================================================
-- TRIGGERS - Fraud Schema
-- =====================================================

CREATE TRIGGER update_fraud_rules_updated_at
    BEFORE UPDATE ON fraud.rules
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

CREATE TRIGGER update_fraud_alerts_updated_at
    BEFORE UPDATE ON fraud.alerts
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON fraud.cases
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE fraud.rules IS 'Configurable fraud detection rules';
COMMENT ON TABLE fraud.alerts IS 'Alerts generated by fraud rules requiring investigation';
COMMENT ON TABLE fraud.trusted_devices IS 'Known good devices for users';
COMMENT ON TABLE fraud.blacklist IS 'Blocked IPs, emails, or devices';
COMMENT ON TABLE fraud.cases IS 'Investigation cases for suspected fraud';
