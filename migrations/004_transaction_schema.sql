-- =====================================================
-- TRANSACTION SCHEMA - Financial Transactions
-- =====================================================

-- Transactions table - All financial transactions
CREATE TABLE transaction.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Idempotency
    idempotency_key VARCHAR(255) UNIQUE,  -- Prevent duplicate transactions
    
    -- Transaction Type & Details
    transaction_type transaction.transaction_type NOT NULL,
    from_account_id UUID REFERENCES account.accounts(id) ON DELETE RESTRICT,
    to_account_id UUID REFERENCES account.accounts(id) ON DELETE RESTRICT,
    
    -- Amount
    amount DECIMAL(19, 4) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'DKK',
    exchange_rate DECIMAL(12, 6),  -- If currency conversion
    original_currency CHAR(3),
    original_amount DECIMAL(19, 4),
    
    -- Description & Reference
    description TEXT NOT NULL,
    reference_number VARCHAR(100) UNIQUE,
    external_reference VARCHAR(255),  -- Reference from external system
    category VARCHAR(50),  -- groceries, utilities, entertainment, etc.
    
    -- Status & Timing
    status transaction.transaction_status DEFAULT 'pending',
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Failure/Cancellation
    error_code VARCHAR(50),
    error_message TEXT,
    cancellation_reason TEXT,
    
    -- Fees
    fee_amount DECIMAL(15, 2) DEFAULT 0.00,
    fee_currency CHAR(3),
    
    -- Reversal
    is_reversal BOOLEAN DEFAULT FALSE,
    reversed_transaction_id UUID REFERENCES transaction.transactions(id),
    reversed_at TIMESTAMP WITH TIME ZONE,
    reversal_reason TEXT,
    
    -- Security & Fraud
    ip_address INET,
    device_fingerprint VARCHAR(255),
    geo_location JSONB,  -- {lat, lng, country, city}
    risk_score DECIMAL(5, 2),  -- 0.00 to 100.00
    fraud_check_passed BOOLEAN,
    fraud_check_details JSONB,
    
    -- Authorization
    initiated_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    approved_by_user_id UUID REFERENCES auth.users(id),
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB,  -- Flexible storage for additional data
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_accounts CHECK (
        (transaction_type = 'deposit' AND from_account_id IS NULL AND to_account_id IS NOT NULL) OR
        (transaction_type = 'withdrawal' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
        (transaction_type IN ('transfer', 'payment') AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL) OR
        (transaction_type = 'fee' AND from_account_id IS NOT NULL)
    ),
    CONSTRAINT different_accounts CHECK (
        from_account_id IS NULL OR 
        to_account_id IS NULL OR 
        from_account_id != to_account_id
    ),
    CONSTRAINT valid_status_timing CHECK (
        (status != 'completed' OR completed_at IS NOT NULL) AND
        (status != 'failed' OR failed_at IS NOT NULL) AND
        (status != 'cancelled' OR cancelled_at IS NOT NULL)
    )
);

-- Transaction Approvals - For multi-step approval workflows
CREATE TABLE transaction.transaction_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transaction.transactions(id) ON DELETE CASCADE,
    
    -- Approver
    approver_id UUID NOT NULL REFERENCES auth.users(id),
    approval_level INTEGER NOT NULL,  -- 1, 2, 3 for multi-level approval
    
    -- Decision
    decision VARCHAR(20) NOT NULL,  -- approved, rejected, pending
    decision_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(transaction_id, approver_id, approval_level)
);

-- Scheduled Transactions - Recurring or future-dated transactions
CREATE TABLE transaction.scheduled_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    
    -- Template
    from_account_id UUID NOT NULL REFERENCES account.accounts(id) ON DELETE CASCADE,
    to_account_id UUID REFERENCES account.accounts(id) ON DELETE SET NULL,
    beneficiary_id UUID REFERENCES customer.beneficiaries(id) ON DELETE SET NULL,
    
    -- Amount
    amount DECIMAL(19, 4) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'DKK',
    description TEXT,
    
    -- Schedule
    frequency VARCHAR(20),  -- once, daily, weekly, biweekly, monthly, yearly
    start_date DATE NOT NULL,
    end_date DATE,
    next_execution_date DATE NOT NULL,
    last_execution_date DATE,
    execution_count INTEGER DEFAULT 0,
    max_executions INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    paused_at TIMESTAMP WITH TIME ZONE,
    pause_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_frequency CHECK (
        frequency IN ('once', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly')
    ),
    CONSTRAINT valid_dates CHECK (
        next_execution_date >= start_date AND
        (end_date IS NULL OR end_date >= start_date)
    ),
    CONSTRAINT has_recipient CHECK (
        to_account_id IS NOT NULL OR beneficiary_id IS NOT NULL
    )
);

-- Transaction Limits - Daily/monthly transaction limits per customer
CREATE TABLE transaction.transaction_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    
    -- Limits
    daily_transfer_limit DECIMAL(15, 2),
    monthly_transfer_limit DECIMAL(15, 2),
    daily_withdrawal_limit DECIMAL(15, 2),
    single_transaction_limit DECIMAL(15, 2),
    
    -- Usage Tracking
    daily_transfers_used DECIMAL(15, 2) DEFAULT 0.00,
    monthly_transfers_used DECIMAL(15, 2) DEFAULT 0.00,
    daily_withdrawals_used DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Reset Dates
    daily_limit_reset_at DATE DEFAULT CURRENT_DATE,
    monthly_limit_reset_at DATE DEFAULT date_trunc('month', CURRENT_DATE)::DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(customer_id)
);

-- Batch Transactions - For bulk payment processing
CREATE TABLE transaction.batch_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_reference VARCHAR(100) UNIQUE NOT NULL,
    
    -- Batch Details
    created_by UUID NOT NULL REFERENCES auth.users(id),
    total_transactions INTEGER NOT NULL,
    successful_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    total_amount  DECIMAL(19, 4) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_counts CHECK (
        successful_transactions + failed_transactions <= total_transactions
    )
);

-- =====================================================
-- INDEXES - Transaction Schema
-- =====================================================

CREATE INDEX idx_transactions_from_account ON transaction.transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON transaction.transactions(to_account_id);
CREATE INDEX idx_transactions_type ON transaction.transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transaction.transactions(status);
CREATE INDEX idx_transactions_initiated_at ON transaction.transactions(initiated_at DESC);
CREATE INDEX idx_transactions_completed_at ON transaction.transactions(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_transactions_initiated_by ON transaction.transactions(initiated_by_user_id);
CREATE INDEX idx_transactions_idempotency ON transaction.transactions(idempotency_key);
CREATE INDEX idx_transactions_reference ON transaction.transactions(reference_number);
CREATE INDEX idx_transactions_pending ON transaction.transactions(status, initiated_at) WHERE status = 'pending';
CREATE INDEX idx_transactions_risk ON transaction.transactions(risk_score DESC) WHERE risk_score > 50;

-- Composite index for account transaction history
CREATE INDEX idx_transactions_account_history ON transaction.transactions(from_account_id, completed_at DESC) WHERE status = 'completed';
CREATE INDEX idx_transactions_to_account_history ON transaction.transactions(to_account_id, completed_at DESC) WHERE status = 'completed';

CREATE INDEX idx_approvals_transaction ON transaction.transaction_approvals(transaction_id);
CREATE INDEX idx_approvals_approver ON transaction.transaction_approvals(approver_id);
CREATE INDEX idx_approvals_pending ON transaction.transaction_approvals(approver_id) WHERE decision = 'pending';

CREATE INDEX idx_scheduled_customer ON transaction.scheduled_transactions(customer_id);
CREATE INDEX idx_scheduled_next_execution ON transaction.scheduled_transactions(next_execution_date) WHERE is_active = TRUE;
CREATE INDEX idx_scheduled_active ON transaction.scheduled_transactions(is_active, next_execution_date);

CREATE INDEX idx_limits_customer ON transaction.transaction_limits(customer_id);
CREATE INDEX idx_limits_daily_reset ON transaction.transaction_limits(daily_limit_reset_at);

CREATE INDEX idx_batch_status ON transaction.batch_transactions(status);
CREATE INDEX idx_batch_created_at ON transaction.batch_transactions(created_at DESC);

-- =====================================================
-- TRIGGERS - Transaction Schema
-- =====================================================

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transaction.transactions
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

CREATE TRIGGER update_scheduled_updated_at
    BEFORE UPDATE ON transaction.scheduled_transactions
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

CREATE TRIGGER update_limits_updated_at
    BEFORE UPDATE ON transaction.transaction_limits
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

-- Auto-generate reference number
CREATE SEQUENCE transaction.reference_number_seq START 1000000;

CREATE OR REPLACE FUNCTION transaction.generate_reference_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL THEN
        NEW.reference_number := 'TXN' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || 
                                LPAD(nextval('transaction.reference_number_seq')::TEXT, 8, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transaction_reference
    BEFORE INSERT ON transaction.transactions
    FOR EACH ROW
    EXECUTE FUNCTION transaction.generate_reference_number();

-- Update transaction status timestamps
CREATE OR REPLACE FUNCTION transaction.update_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'processing' AND OLD.status = 'pending' THEN
        NEW.processing_started_at = CURRENT_TIMESTAMP;
    ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
    ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        NEW.failed_at = CURRENT_TIMESTAMP;
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        NEW.cancelled_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transaction_status_timestamps
    BEFORE UPDATE OF status ON transaction.transactions
    FOR EACH ROW
    EXECUTE FUNCTION transaction.update_status_timestamps();

-- =====================================================
-- FUNCTIONS - Transaction Schema
-- =====================================================

-- Reset daily transaction limits
CREATE OR REPLACE FUNCTION transaction.reset_daily_limits()
RETURNS void AS $$
BEGIN
    UPDATE transaction.transaction_limits
    SET daily_transfers_used = 0.00,
        daily_withdrawals_used = 0.00,
        daily_limit_reset_at = CURRENT_DATE
    WHERE daily_limit_reset_at < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Reset monthly transaction limits
CREATE OR REPLACE FUNCTION transaction.reset_monthly_limits()
RETURNS void AS $$
BEGIN
    UPDATE transaction.transaction_limits
    SET monthly_transfers_used = 0.00,
        monthly_limit_reset_at = date_trunc('month', CURRENT_DATE)::DATE
    WHERE monthly_limit_reset_at < date_trunc('month', CURRENT_DATE)::DATE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE transaction.transactions IS 'All financial transactions including transfers, deposits, withdrawals, and payments';
COMMENT ON TABLE transaction.transaction_approvals IS 'Multi-level approval workflow for transactions';
COMMENT ON TABLE transaction.scheduled_transactions IS 'Recurring and future-dated transactions';
COMMENT ON TABLE transaction.transaction_limits IS 'Daily and monthly transaction limits per customer';
COMMENT ON TABLE transaction.batch_transactions IS 'Bulk payment processing batches';

COMMENT ON COLUMN transaction.transactions.idempotency_key IS 'Unique key to prevent duplicate transactions';
COMMENT ON COLUMN transaction.transactions.risk_score IS 'Fraud risk score from 0 to 100';
COMMENT ON COLUMN transaction.transactions.is_reversal IS 'TRUE if this transaction reverses a previous one';
COMMENT ON COLUMN transaction.scheduled_transactions.frequency IS 'How often the transaction should execute';
