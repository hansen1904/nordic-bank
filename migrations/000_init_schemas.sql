-- =====================================================
-- Nordic Bank - Database Schema
-- Version: 1.0.0
-- Date: 2025-12-25
-- Description: Complete database schema for all services
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- Encryption functions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Text search with trigrams

-- =====================================================
-- SCHEMAS
-- =====================================================

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS customer;
CREATE SCHEMA IF NOT EXISTS account;
CREATE SCHEMA IF NOT EXISTS transaction;
CREATE SCHEMA IF NOT EXISTS notification;
CREATE SCHEMA IF NOT EXISTS fraud;
CREATE SCHEMA IF NOT EXISTS reporting;
CREATE SCHEMA IF NOT EXISTS audit;

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

-- User roles
CREATE TYPE auth.user_role AS ENUM ('customer', 'employee', 'admin');

-- User status
CREATE TYPE auth.user_status AS ENUM ('active', 'inactive', 'suspended', 'locked', 'closed');

-- KYC status
CREATE TYPE customer.kyc_status AS ENUM ('pending', 'in_review', 'verified', 'rejected', 'expired');

-- Customer status
CREATE TYPE customer.customer_status AS ENUM ('active', 'inactive', 'suspended', 'closed');

-- Account types
CREATE TYPE account.account_type AS ENUM ('checking', 'savings', 'investment', 'loan');

-- Account status
CREATE TYPE account.account_status AS ENUM ('active', 'frozen', 'closed', 'dormant');

-- Transaction types
CREATE TYPE transaction.transaction_type AS ENUM ('transfer', 'deposit', 'withdrawal', 'payment', 'fee');

-- Transaction status
CREATE TYPE transaction.transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed');

-- Notification types
CREATE TYPE notification.notification_type AS ENUM ('email', 'sms', 'push', 'in_app');

-- Notification status
CREATE TYPE notification.notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');

-- Fraud alert severity
CREATE TYPE fraud.alert_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Fraud alert status
CREATE TYPE fraud.alert_status AS ENUM ('new', 'investigating', 'confirmed', 'false_positive', 'resolved');

COMMENT ON SCHEMA auth IS 'Authentication and authorization data';
COMMENT ON SCHEMA customer IS 'Customer profile and KYC data';
COMMENT ON SCHEMA account IS 'Bank accounts and balances';
COMMENT ON SCHEMA transaction IS 'Financial transactions and ledger';
COMMENT ON SCHEMA notification IS 'Notification management';
COMMENT ON SCHEMA fraud IS 'Fraud detection and monitoring';
COMMENT ON SCHEMA reporting IS 'Reports and analytics';
COMMENT ON SCHEMA audit IS 'Audit logs and compliance tracking';
