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

-- Sample data structure for reference:
-- Bilibili data: {"current_level":"6","vipDueDate":"1776700800000"}
-- Youku data: {"exptime":"2026-03-09","is_vip":"1"}