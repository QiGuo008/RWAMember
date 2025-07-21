-- RWA Member Database Schema
-- PostgreSQL

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL, -- Ethereum address
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Platform verifications table
CREATE TABLE platform_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'bilibili', 'youku', etc.
    is_connected BOOLEAN DEFAULT TRUE,
    verification_data JSONB, -- Store the raw verification data
    attestation_data JSONB, -- Store the complete Primus attestation
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- VIP expiry if applicable
    
    UNIQUE(user_id, platform)
);

-- Platform status extracted data (for easier querying)
CREATE TABLE platform_status (
    id SERIAL PRIMARY KEY,
    verification_id INTEGER REFERENCES platform_verifications(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    vip_status VARCHAR(20), -- 'active', 'inactive', 'expired'
    level VARCHAR(10), -- For Bilibili level
    expiry_date DATE, -- Parsed expiry date
    raw_data JSONB, -- Original parsed data
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_address ON users(address);
CREATE INDEX idx_platform_verifications_user_platform ON platform_verifications(user_id, platform);
CREATE INDEX idx_platform_verifications_platform ON platform_verifications(platform);
CREATE INDEX idx_platform_status_verification_id ON platform_status(verification_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Shared memberships table
CREATE TABLE shared_memberships (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    verification_id INTEGER REFERENCES platform_verifications(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    price_mon DECIMAL(18, 8) DEFAULT 0.1, -- Price in MON tokens (fixed 0.1 MON)
    duration_days INTEGER DEFAULT 1, -- Duration in days (fixed 1 day)
    is_active BOOLEAN DEFAULT TRUE,
    times_shared INTEGER DEFAULT 0, -- Track how many times shared
    max_shares INTEGER DEFAULT 1, -- Maximum number of concurrent shares
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Membership rentals table (track who rented what)
CREATE TABLE membership_rentals (
    id SERIAL PRIMARY KEY,
    shared_membership_id INTEGER REFERENCES shared_memberships(id) ON DELETE CASCADE,
    renter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    renter_address VARCHAR(42) NOT NULL,
    price_paid DECIMAL(18, 8) NOT NULL,
    duration_days INTEGER NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'cancelled'
    transaction_hash VARCHAR(66), -- Monad transaction hash
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for shared marketplace
CREATE INDEX idx_shared_memberships_platform ON shared_memberships(platform);
CREATE INDEX idx_shared_memberships_active ON shared_memberships(is_active);
CREATE INDEX idx_shared_memberships_owner ON shared_memberships(owner_id);
CREATE INDEX idx_membership_rentals_renter ON membership_rentals(renter_id);
CREATE INDEX idx_membership_rentals_shared_membership ON membership_rentals(shared_membership_id);
CREATE INDEX idx_membership_rentals_status ON membership_rentals(status);

-- Trigger to automatically update updated_at for shared_memberships table
CREATE TRIGGER update_shared_memberships_updated_at BEFORE UPDATE ON shared_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Transaction tracking table (prevent double-spending)
CREATE TABLE used_transactions (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount_wei VARCHAR(32) NOT NULL, -- Store as string to avoid precision loss
    block_number BIGINT,
    used_for VARCHAR(50) NOT NULL, -- 'rental', 'other'
    rental_id INTEGER REFERENCES membership_rentals(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for transaction lookup
CREATE INDEX idx_used_transactions_hash ON used_transactions(transaction_hash);
CREATE INDEX idx_used_transactions_from ON used_transactions(from_address);

-- Sample data structure for reference:
-- Bilibili data: {"current_level":"6","vipDueDate":"1776700800000"}
-- Youku data: {"exptime":"2026-03-09","is_vip":"1"}