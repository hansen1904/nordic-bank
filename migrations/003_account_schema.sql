-- =====================================================
-- ACCOUNT SCHEMA - Bank Accounts & Balances
-- =====================================================

-- Accounts table - Main bank accounts
CREATE TABLE account.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer.customers(id) ON DELETE RESTRICT,
    
    -- Account Identification
    account_number VARCHAR(34) UNIQUE NOT NULL,  -- IBAN format or internal format
    account_name VARCHAR(255),  -- Customer-defined nickname
    account_type account.account_type NOT NULL,
    
    -- Currency & Balance
    currency CHAR(3) DEFAULT 'DKK',  -- ISO 4217
    balance DECIMAL(19, 4) DEFAULT 0.00 NOT NULL,
    available_balance DECIMAL(19, 4) DEFAULT 0.00 NOT NULL,  -- Balance minus holds
    reserved_amount DECIMAL(19, 4) DEFAULT 0.00 NOT NULL,  -- Amount on hold
    
    -- Limits
    daily_withdrawal_limit DECIMAL(15, 2),
    daily_transfer_limit DECIMAL(15, 2),
    overdraft_limit DECIMAL(15, 2) DEFAULT 0.00,
    minimum_balance DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Interest (for savings accounts)
    interest_rate DECIMAL(5, 4),  -- e.g., 0.0250 = 2.50%
    interest_accrued DECIMAL(15, 2) DEFAULT 0.00,
    last_interest_calculation_date DATE,
    
    -- Status & Metadata
    status account.account_status DEFAULT 'active',
    is_primary BOOLEAN DEFAULT FALSE,  -- Primary account for customer
    opened_at DATE DEFAULT CURRENT_DATE,
    closed_at TIMESTAMP WITH TIME ZONE,
    closure_reason TEXT,
    
    -- Dormancy tracking
    last_transaction_date TIMESTAMP WITH TIME ZONE,
    dormant_since DATE,  -- Auto-set if no activity for 12 months
    
    -- Security
    requires_two_factor BOOLEAN DEFAULT FALSE,  -- Require 2FA for transactions
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT positive_balance CHECK (balance >= -overdraft_limit),
    CONSTRAINT valid_available_balance CHECK (available_balance = balance - reserved_amount),
    CONSTRAINT valid_limits CHECK (
        (daily_withdrawal_limit IS NULL OR daily_withdrawal_limit >= 0) AND
        (daily_transfer_limit IS NULL OR daily_transfer_limit >= 0) AND
        overdraft_limit >= 0
    )
);

-- Account Holders - Support joint accounts (many-to-many)
CREATE TABLE account.account_holders (
    account_id UUID NOT NULL REFERENCES account.accounts(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer.customers(id) ON DELETE RESTRICT,
    
    -- Relationship
    relationship_type VARCHAR(50) DEFAULT 'owner',  -- owner, joint_owner, authorized_user
    permission_level VARCHAR(20) DEFAULT 'full',  -- full, view_only, limited
    
    -- Permissions
    can_withdraw BOOLEAN DEFAULT TRUE,
    can_transfer BOOLEAN DEFAULT TRUE,
    can_view_balance BOOLEAN DEFAULT TRUE,
    can_view_transactions BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    added_by UUID REFERENCES auth.users(id),
    removed_at TIMESTAMP WITH TIME ZONE,
    
    PRIMARY KEY (account_id, customer_id),
    
    CONSTRAINT valid_removal CHECK (
        (removed_at IS NULL) OR (removed_at > added_at)
    )
);

-- Account Activity Log - All balance changes
CREATE TABLE account.account_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES account.accounts(id) ON DELETE RESTRICT,
    transaction_id UUID,  -- Foreign key to transaction.transactions
    
    -- Ledger Entry
    entry_type VARCHAR(10) NOT NULL,  -- debit, credit
    amount DECIMAL(19, 4) NOT NULL,
    balance_before DECIMAL(19, 4) NOT NULL,
    balance_after DECIMAL(19, 4) NOT NULL,
    
    -- Description
    description TEXT,
    reference_number VARCHAR(100),
    
    -- Timestamps
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    value_date DATE,  -- When the transaction is effective
    posted_date DATE,  -- When the transaction was posted
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_amount CHECK (amount > 0),
    CONSTRAINT valid_balance_calculation CHECK (
        (entry_type = 'credit' AND balance_after = balance_before + amount) OR
        (entry_type = 'debit' AND balance_after = balance_before - amount)
    )
);

-- Account Statements - Monthly/quarterly statements
CREATE TABLE account.account_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES account.accounts(id) ON DELETE CASCADE,
    
    -- Statement Period
    statement_date DATE NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    
    -- Balances
    opening_balance DECIMAL(19, 4) NOT NULL,
    closing_balance DECIMAL(19, 4) NOT NULL,
    
    -- Transaction Summary
    total_credits DECIMAL(19, 4) DEFAULT 0.00,
    total_debits DECIMAL(19, 4) DEFAULT 0.00,
    transaction_count INTEGER DEFAULT 0,
    
    -- Interest (for savings)
    interest_earned DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Document
    document_url TEXT,  -- PDF statement stored in S3
    document_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_finalized BOOLEAN DEFAULT FALSE,
    finalized_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(account_id, statement_date),
    
    CONSTRAINT valid_period CHECK (period_end_date > period_start_date),
    CONSTRAINT valid_balance CHECK (
        closing_balance = opening_balance + total_credits - total_debits + interest_earned
    )
);

-- Fund Reservations - For 2-phase commits
CREATE TABLE account.fund_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES account.accounts(id) ON DELETE RESTRICT,
    transaction_id UUID NOT NULL,  -- Reference to pending transaction
    
    -- Reservation Details
    amount DECIMAL(19, 4) NOT NULL,
    reserved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',  -- active, released, consumed, expired
    released_at TIMESTAMP WITH TIME ZONE,
    release_reason VARCHAR(100),
    
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_expiry CHECK (expires_at > reserved_at)
);

-- Account Cards - Associated debit/credit cards
CREATE TABLE account.account_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES account.accounts(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customer.customers(id) ON DELETE RESTRICT,
    
    -- Card Details (PCI-DSS compliant - use tokenization in production)
    card_number_token VARCHAR(255) UNIQUE NOT NULL,  -- Tokenized card number
    card_last_four CHAR(4) NOT NULL,
    card_type VARCHAR(20),  -- debit, credit
    card_brand VARCHAR(20),  -- visa, mastercard
    
    -- Validity
    expiry_month SMALLINT NOT NULL,
    expiry_year SMALLINT NOT NULL,
    
    -- Limits
    daily_limit DECIMAL(15, 2),
    monthly_limit DECIMAL(15, 2),
    atm_daily_limit DECIMAL(15, 2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',  -- active, blocked, expired, cancelled
    blocked_at TIMESTAMP WITH TIME ZONE,
    block_reason VARCHAR(255),
    
    -- Security
    pin_hash VARCHAR(255),  -- Hashed PIN
    pin_attempts INTEGER DEFAULT 0,
    pin_locked_until TIMESTAMP WITH TIME ZONE,
    
    -- 3D Secure
    three_d_secure_enabled BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_expiry CHECK (
        expiry_month BETWEEN 1 AND 12 AND
        expiry_year >= EXTRACT(YEAR FROM CURRENT_DATE)
    ),
    CONSTRAINT valid_pin_attempts CHECK (pin_attempts >= 0 AND pin_attempts <= 10)
);

-- =====================================================
-- INDEXES - Account Schema
-- =====================================================

CREATE INDEX idx_accounts_customer ON account.accounts(customer_id);
CREATE INDEX idx_accounts_number ON account.accounts(account_number);
CREATE INDEX idx_accounts_status ON account.accounts(status);
CREATE INDEX idx_accounts_type ON account.accounts(account_type);
CREATE INDEX idx_accounts_primary ON account.accounts(customer_id) WHERE is_primary = TRUE;
CREATE INDEX idx_accounts_dormant ON account.accounts(dormant_since) WHERE dormant_since IS NOT NULL;
CREATE INDEX idx_accounts_last_transaction ON account.accounts(last_transaction_date DESC NULLS LAST);

CREATE INDEX idx_account_holders_account ON account.account_holders(account_id);
CREATE INDEX idx_account_holders_customer ON account.account_holders(customer_id);
CREATE INDEX idx_account_holders_active ON account.account_holders(account_id) WHERE removed_at IS NULL;

CREATE INDEX idx_ledger_account ON account.account_ledger(account_id);
CREATE INDEX idx_ledger_transaction ON account.account_ledger(transaction_id);
CREATE INDEX idx_ledger_date ON account.account_ledger(entry_date DESC);
CREATE INDEX idx_ledger_value_date ON account.account_ledger(value_date DESC);

CREATE INDEX idx_statements_account ON account.account_statements(account_id);
CREATE INDEX idx_statements_date ON account.account_statements(statement_date DESC);

CREATE INDEX idx_reservations_account ON account.fund_reservations(account_id);
CREATE INDEX idx_reservations_transaction ON account.fund_reservations(transaction_id);
CREATE INDEX idx_reservations_status ON account.fund_reservations(status);
CREATE INDEX idx_reservations_expires ON account.fund_reservations(expires_at) WHERE status = 'active';

CREATE INDEX idx_cards_account ON account.account_cards(account_id);
CREATE INDEX idx_cards_customer ON account.account_cards(customer_id);
CREATE INDEX idx_cards_token ON account.account_cards(card_number_token);
CREATE INDEX idx_cards_status ON account.account_cards(status);

-- =====================================================
-- TRIGGERS - Account Schema
-- =====================================================

CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON account.accounts
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON account.account_cards
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

-- Auto-calculate available balance
CREATE OR REPLACE FUNCTION account.update_available_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.available_balance = NEW.balance - NEW.reserved_amount;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_available_balance
    BEFORE INSERT OR UPDATE OF balance, reserved_amount ON account.accounts
    FOR EACH ROW
    EXECUTE FUNCTION account.update_available_balance();

-- Update last_transaction_date
CREATE OR REPLACE FUNCTION account.update_last_transaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE account.accounts
    SET last_transaction_date = NEW.entry_date
    WHERE id = NEW.account_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_account_last_transaction
    AFTER INSERT ON account.account_ledger
    FOR EACH ROW
    EXECUTE FUNCTION account.update_last_transaction();

-- Auto-expire fund reservations
CREATE OR REPLACE FUNCTION account.expire_fund_reservations()
RETURNS void AS $$
BEGIN
    UPDATE account.fund_reservations
    SET status = 'expired',
        released_at = CURRENT_TIMESTAMP,
        release_reason = 'automatic_expiration'
    WHERE status = 'active'
      AND expires_at < CURRENT_TIMESTAMP;
      
    -- Release reserved amounts from accounts
    UPDATE account.accounts a
    SET reserved_amount = reserved_amount - COALESCE(
        (SELECT SUM(amount) FROM account.fund_reservations fr
         WHERE fr.account_id = a.id
           AND fr.status = 'expired'
           AND fr.released_at >= CURRENT_TIMESTAMP - INTERVAL '1 second'),
        0
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTIONS - Account Schema
-- =====================================================

-- Generate unique account number
CREATE SEQUENCE account.account_number_seq START 1000000000;

CREATE OR REPLACE FUNCTION account.generate_account_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    number_exists BOOLEAN;
BEGIN
    LOOP
        new_number := 'DK' || LPAD(nextval('account.account_number_seq')::TEXT, 12, '0');
        
        SELECT EXISTS(
            SELECT 1 FROM account.accounts WHERE account_number = new_number
        ) INTO number_exists;
        
        EXIT WHEN NOT number_exists;
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE account.accounts IS 'Bank accounts with balances and limits';
COMMENT ON TABLE account.account_holders IS 'Account ownership and joint accounts';
COMMENT ON TABLE account.account_ledger IS 'Double-entry ledger for all account transactions';
COMMENT ON TABLE account.account_statements IS 'Periodic account statements';
COMMENT ON TABLE account.fund_reservations IS 'Temporary holds on account funds for 2-phase commits';
COMMENT ON TABLE account.account_cards IS 'Debit/credit cards linked to accounts';

COMMENT ON COLUMN account.accounts.available_balance IS 'Balance minus reserved/held amounts';
COMMENT ON COLUMN account.accounts.reserved_amount IS 'Total amount currently on hold';
COMMENT ON COLUMN account.account_ledger.entry_type IS 'Debit decreases balance, Credit increases balance';
COMMENT ON COLUMN account.fund_reservations.expires_at IS 'Reservation auto-expires and releases funds';
