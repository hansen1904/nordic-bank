-- =====================================================
-- AUTH SCHEMA - Authentication & Authorization
-- =====================================================

-- Users table - Core authentication data
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Security
    password_hash VARCHAR(255) NOT NULL,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Phone
    phone_number VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    phone_verification_token VARCHAR(10),
    phone_verification_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Role & Status
    role auth.user_role NOT NULL,
    status auth.user_status DEFAULT 'active',
    
    -- Multi-Factor Authentication
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),  -- Encrypted TOTP secret
    two_factor_backup_codes TEXT[],  -- Encrypted backup codes
    
    -- Password Reset
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_password_reset_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_username CHECK (length(username) >= 3),
    CONSTRAINT valid_phone CHECK (phone_number ~ '^\+?[1-9]\d{1,14}$' OR phone_number IS NULL)
);

-- Sessions table - Active user sessions
CREATE TABLE auth.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tokens
    access_token VARCHAR(500) NOT NULL UNIQUE,
    refresh_token VARCHAR(500) NOT NULL UNIQUE,
    access_token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Device Information
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    device_type VARCHAR(20),  -- mobile, tablet, desktop
    device_os VARCHAR(50),
    device_browser VARCHAR(50),
    
    -- Location (from IP)
    country_code CHAR(2),
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Session Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revocation_reason VARCHAR(100),
    
    CONSTRAINT valid_tokens CHECK (
        access_token_expires_at > created_at AND
        refresh_token_expires_at > access_token_expires_at
    )
);

-- Login History - Audit trail of all login attempts
CREATE TABLE auth.login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Login Details
    login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP WITH TIME ZONE,
    login_successful BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),  -- invalid_password, account_locked, etc.
    
    -- Device & Location
    ip_address INET NOT NULL,
    user_agent TEXT,
    country_code CHAR(2),
    city VARCHAR(100),
    
    -- Security Flags
    suspicious_activity BOOLEAN DEFAULT FALSE,
    new_device BOOLEAN DEFAULT FALSE,
    new_location BOOLEAN DEFAULT FALSE,
    
    -- 2FA
    two_factor_used BOOLEAN DEFAULT FALSE,
    two_factor_method VARCHAR(20)  -- totp, sms, email
);

-- Permissions table - For RBAC
CREATE TABLE auth.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,  -- e.g., 'customer', 'account', 'transaction'
    action VARCHAR(50) NOT NULL,      -- e.g., 'read', 'write', 'delete'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Role Permissions - Many-to-many relationship
CREATE TABLE auth.role_permissions (
    role auth.user_role NOT NULL,
    permission_id UUID NOT NULL REFERENCES auth.permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES auth.users(id),
    PRIMARY KEY (role, permission_id)
);

-- User Permissions - Override role permissions for specific users
CREATE TABLE auth.user_permissions (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES auth.permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT TRUE,  -- TRUE = grant, FALSE = revoke
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, permission_id)
);

-- =====================================================
-- INDEXES - Auth Schema
-- =====================================================

CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_username ON auth.users(username);
CREATE INDEX idx_users_role ON auth.users(role);
CREATE INDEX idx_users_status ON auth.users(status);
CREATE INDEX idx_users_phone ON auth.users(phone_number) WHERE phone_number IS NOT NULL;

CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_sessions_access_token ON auth.sessions(access_token);
CREATE INDEX idx_sessions_refresh_token ON auth.sessions(refresh_token);
CREATE INDEX idx_sessions_expires ON auth.sessions(access_token_expires_at);
CREATE INDEX idx_sessions_active ON auth.sessions(user_id, revoked_at) WHERE revoked_at IS NULL;

CREATE INDEX idx_login_history_user_id ON auth.login_history(user_id);
CREATE INDEX idx_login_history_time ON auth.login_history(login_time DESC);
CREATE INDEX idx_login_history_ip ON auth.login_history(ip_address);
CREATE INDEX idx_login_history_suspicious ON auth.login_history(user_id) WHERE suspicious_activity = TRUE;

CREATE INDEX idx_permissions_resource_action ON auth.permissions(resource, action);

-- =====================================================
-- TRIGGERS - Auth Schema
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION auth.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

-- Auto-lock account after failed login attempts
CREATE OR REPLACE FUNCTION auth.check_failed_login_attempts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.failed_login_attempts >= 5 AND OLD.failed_login_attempts < 5 THEN
        NEW.account_locked_until = CURRENT_TIMESTAMP + INTERVAL '30 minutes';
        NEW.status = 'locked';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lock_account
    BEFORE UPDATE OF failed_login_attempts ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.check_failed_login_attempts();

-- Update last_activity_at on session access
CREATE OR REPLACE FUNCTION auth.update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_activity
    BEFORE UPDATE ON auth.sessions
    FOR EACH ROW
    WHEN (NEW.revoked_at IS NULL)
    EXECUTE FUNCTION auth.update_session_activity();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE auth.users IS 'Core user authentication and authorization data';
COMMENT ON TABLE auth.sessions IS 'Active user sessions with JWT tokens';
COMMENT ON TABLE auth.login_history IS 'Audit trail of all login attempts';
COMMENT ON TABLE auth.permissions IS 'System permissions for RBAC';
COMMENT ON TABLE auth.role_permissions IS 'Role-based permission assignments';
COMMENT ON TABLE auth.user_permissions IS 'User-specific permission overrides';

COMMENT ON COLUMN auth.users.password_hash IS 'Bcrypt or Argon2 hashed password';
COMMENT ON COLUMN auth.users.two_factor_secret IS 'Encrypted TOTP secret for 2FA';
COMMENT ON COLUMN auth.sessions.device_fingerprint IS 'Browser fingerprint for device tracking';
