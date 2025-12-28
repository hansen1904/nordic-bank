-- =====================================================
-- CUSTOMER SCHEMA - Customer Information & KYC
-- =====================================================

-- Customers table - Main customer profile data
CREATE TABLE customer.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(30),  -- male, female, other, prefer_not_to_say
    nationality CHAR(2),  -- ISO 3166-1 alpha-2 country code
    
    -- Government IDs (ENCRYPTED)
    national_id_type VARCHAR(50),  -- passport, drivers_license, national_id
    national_id_number VARCHAR(255),  -- Store encrypted using pgcrypto
    national_id_expiry_date DATE,
    social_security_number VARCHAR(255),  -- Encrypted, nullable
    tax_id_number VARCHAR(255),  -- Encrypted, nullable
    
    -- Contact Information
    primary_phone VARCHAR(20) NOT NULL,
    secondary_phone VARCHAR(20),
    email VARCHAR(255) NOT NULL,  -- Duplicated from auth.users for convenience
    
    -- Current Address
    address_street VARCHAR(255),
    address_apartment VARCHAR(50),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_postal_code VARCHAR(20),
    address_country CHAR(2),  -- ISO 3166-1 alpha-2
    
    -- Permanent Address (if different)
    permanent_address_same BOOLEAN DEFAULT TRUE,
    permanent_address_street VARCHAR(255),
    permanent_address_apartment VARCHAR(50),
    permanent_address_city VARCHAR(100),
    permanent_address_state VARCHAR(100),
    permanent_address_postal_code VARCHAR(20),
    permanent_address_country CHAR(2),
    
    -- Employment Information
    employment_status VARCHAR(30),  -- employed, self_employed, unemployed, student, retired
    employer_name VARCHAR(255),
    occupation VARCHAR(100),
    monthly_income DECIMAL(15, 2),  -- Optional, for loan applications
    
    -- Financial Profile
    source_of_funds TEXT[],  -- ['salary', 'business', 'investment']
    estimated_net_worth DECIMAL(15, 2),
    
    -- KYC/AML Compliance
    kyc_status customer.kyc_status DEFAULT 'pending',
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    kyc_verified_by UUID REFERENCES auth.users(id),
    kyc_expiry_date DATE,  -- KYC needs to be renewed
    kyc_notes TEXT,
    
    -- Risk Assessment
    risk_level VARCHAR(20) DEFAULT 'medium',  -- low, medium, high
    risk_assessment_date DATE,
    pep_status BOOLEAN DEFAULT FALSE,  -- Politically Exposed Person
    sanctions_screening_status VARCHAR(20),  -- clean, flagged
    sanctions_screening_date DATE,
    sanctions_screening_details TEXT,
    
    -- Preferences
    preferred_language CHAR(2) DEFAULT 'en',  -- ISO 639-1
    preferred_currency CHAR(3) DEFAULT 'DKK',  -- ISO 4217
    timezone VARCHAR(50) DEFAULT 'Europe/Copenhagen',
    
    -- Marketing & Consent (GDPR)
    marketing_consent BOOLEAN DEFAULT FALSE,
    marketing_consent_date TIMESTAMP WITH TIME ZONE,
    data_processing_consent BOOLEAN NOT NULL DEFAULT TRUE,
    data_processing_consent_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    profiling_consent BOOLEAN DEFAULT FALSE,
    third_party_sharing_consent BOOLEAN DEFAULT FALSE,
    
    -- Customer Metadata
    customer_type VARCHAR(20) DEFAULT 'individual',  -- individual, business
    customer_segment VARCHAR(50),  -- retail, premium, private_banking
    join_date DATE DEFAULT CURRENT_DATE,
    status customer.customer_status DEFAULT 'active',
    closed_at TIMESTAMP WITH TIME ZONE,
    closure_reason TEXT,
    
    -- Data Retention (GDPR)
    data_retention_until DATE,
    deletion_requested BOOLEAN DEFAULT FALSE,
    deletion_requested_at TIMESTAMP WITH TIME ZONE,
    scheduled_deletion_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_dob CHECK (date_of_birth < CURRENT_DATE AND date_of_birth > CURRENT_DATE - INTERVAL '120 years'),
    CONSTRAINT valid_age CHECK (AGE(CURRENT_DATE, date_of_birth) >= INTERVAL '18 years'),
    CONSTRAINT valid_income CHECK (monthly_income >= 0 OR monthly_income IS NULL),
    CONSTRAINT valid_net_worth CHECK (estimated_net_worth >= 0 OR estimated_net_worth IS NULL)
);

-- KYC Documents table - Document uploads for verification
CREATE TABLE customer.kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    
    -- Document Details
    document_type VARCHAR(50) NOT NULL,  -- id_front, id_back, proof_of_address, selfie, tax_document
    document_category VARCHAR(50),  -- identity, address, financial
    document_url TEXT NOT NULL,  -- S3/Cloud storage URL
    document_format VARCHAR(10),  -- pdf, jpg, png
    file_size_bytes BIGINT,
    
   -- Verification
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    verification_status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
    rejection_reason TEXT,
    
    -- Document Metadata
    document_number VARCHAR(100),  -- For ID documents
    issue_date DATE,
    expiry_date DATE,
    issuing_country CHAR(2),
    
    -- Security
    checksum VARCHAR(64),  -- SHA-256 hash for integrity
    encrypted BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_dates CHECK (
        (expiry_date IS NULL) OR 
        (issue_date IS NULL) OR 
        (expiry_date > issue_date)
    )
);

-- Customer Notes - Internal notes about customers
CREATE TABLE customer.customer_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    
    -- Note Content
    note_type VARCHAR(50),  -- general, kyc, risk, complaint, interaction
    subject VARCHAR(255),
    content TEXT NOT NULL,
    priority VARCHAR(20),  -- low, normal, high
    
    -- Visibility
    internal_only BOOLEAN DEFAULT TRUE,
    visible_to_customer BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES auth.users(id)
);

-- Customer Interactions - Track all customer touchpoints
CREATE TABLE customer.customer_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    
    -- Interaction Details
    interaction_type VARCHAR(50) NOT NULL,  -- call, email, chat, visit, complaint
    channel VARCHAR(50),  -- phone, email, web, mobile_app, branch
    subject VARCHAR(255),
    description TEXT,
    sentiment VARCHAR(20),  -- positive, neutral, negative
    
    -- Resolution
    status VARCHAR(20) DEFAULT 'open',  -- open, in_progress, resolved, closed
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Staff
    handled_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    
    -- Timestamps
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Beneficiaries - Trusted recipients for transfers
CREATE TABLE customer.beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    
    -- Beneficiary Details
    beneficiary_name VARCHAR(255) NOT NULL,
    beneficiary_account_number VARCHAR(34) NOT NULL,  -- IBAN format
    beneficiary_bank_name VARCHAR(255),
    beneficiary_bank_code VARCHAR(20),  -- SWIFT/BIC code
    beneficiary_country CHAR(2),
    
    -- Metadata
    nickname VARCHAR(100),  -- Customer's friendly name for beneficiary
    is_favorite BOOLEAN DEFAULT FALSE,
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(customer_id, beneficiary_account_number)
);

-- =====================================================
-- INDEXES - Customer Schema
-- =====================================================

CREATE INDEX idx_customers_user_id ON customer.customers(user_id);
CREATE INDEX idx_customers_email ON customer.customers(email);
CREATE INDEX idx_customers_phone ON customer.customers(primary_phone);
CREATE INDEX idx_customers_national_id ON customer.customers(national_id_number);
CREATE INDEX idx_customers_kyc_status ON customer.customers(kyc_status);
CREATE INDEX idx_customers_status ON customer.customers(status);
CREATE INDEX idx_customers_name ON customer.customers(first_name, last_name);
CREATE INDEX idx_customers_join_date ON customer.customers(join_date DESC);
CREATE INDEX idx_customers_pep ON customer.customers(pep_status) WHERE pep_status = TRUE;
CREATE INDEX idx_customers_deletion ON customer.customers(scheduled_deletion_date) WHERE scheduled_deletion_date IS NOT NULL;

-- Full-text search on customer names
CREATE INDEX idx_customers_fulltext ON customer.customers 
    USING gin(to_tsvector('english', first_name || ' ' || COALESCE(middle_name, '') || ' ' || last_name));

CREATE INDEX idx_kyc_documents_customer ON customer.kyc_documents(customer_id);
CREATE INDEX idx_kyc_documents_status ON customer.kyc_documents(verification_status);
CREATE INDEX idx_kyc_documents_expiry ON customer.kyc_documents(expiry_date) WHERE expiry_date IS NOT NULL;

CREATE INDEX idx_customer_notes_customer ON customer.customer_notes(customer_id);
CREATE INDEX idx_customer_notes_type ON customer.customer_notes(note_type);
CREATE INDEX idx_customer_notes_created ON customer.customer_notes(created_at DESC);

CREATE INDEX idx_interactions_customer ON customer.customer_interactions(customer_id);
CREATE INDEX idx_interactions_type ON customer.customer_interactions(interaction_type);
CREATE INDEX idx_interactions_status ON customer.customer_interactions(status);
CREATE INDEX idx_interactions_date ON customer.customer_interactions(interaction_date DESC);

CREATE INDEX idx_beneficiaries_customer ON customer.beneficiaries(customer_id);
CREATE INDEX idx_beneficiaries_active ON customer.beneficiaries(customer_id) WHERE is_active = TRUE;

-- =====================================================
-- TRIGGERS - Customer Schema
-- =====================================================

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customer.customers
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

CREATE TRIGGER update_customer_notes_updated_at
    BEFORE UPDATE ON customer.customer_notes
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at
    BEFORE UPDATE ON customer.customer_interactions
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at
    BEFORE UPDATE ON customer.beneficiaries
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

-- =====================================================
-- FUNCTIONS - Customer Schema
-- =====================================================

-- Function to encrypt sensitive fields
CREATE OR REPLACE FUNCTION customer.encrypt_sensitive_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.national_id_number IS NOT NULL AND NEW.national_id_number NOT LIKE '\\x%' THEN
        NEW.national_id_number = encode(encrypt(NEW.national_id_number::bytea, 'encryption_key', 'aes'), 'hex');
    END IF;
    
    IF NEW.social_security_number IS NOT NULL AND NEW.social_security_number NOT LIKE '\\x%' THEN
        NEW.social_security_number = encode(encrypt(NEW.social_security_number::bytea, 'encryption_key', 'aes'), 'hex');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TODO: Enable this trigger after implementing proper key management
-- CREATE TRIGGER encrypt_customer_sensitive_data
--     BEFORE INSERT OR UPDATE ON customer.customers
--     FOR EACH ROW
--     EXECUTE FUNCTION customer.encrypt_sensitive_data();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE customer.customers IS 'Main customer profile and KYC data';
COMMENT ON TABLE customer.kyc_documents IS 'KYC document uploads and verification status';
COMMENT ON TABLE customer.customer_notes IS 'Internal employee notes about customers';
COMMENT ON TABLE customer.customer_interactions IS 'Customer service interactions and touchpoints';
COMMENT ON TABLE customer.beneficiaries IS 'Trusted beneficiaries for money transfers';

COMMENT ON COLUMN customer.customers.national_id_number IS 'Encrypted government ID number';
COMMENT ON COLUMN customer.customers.pep_status IS 'Politically Exposed Person flag for enhanced due diligence';
COMMENT ON COLUMN customer.customers.data_retention_until IS 'Date until which data must be retained for legal compliance';
