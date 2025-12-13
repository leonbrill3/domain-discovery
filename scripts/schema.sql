-- Schema for pre-checked domain pool
-- Run this on Neon PostgreSQL

-- Main table: stores available domains
CREATE TABLE IF NOT EXISTS available_domains (
    domain VARCHAR(100) PRIMARY KEY,
    word VARCHAR(50) NOT NULL,
    tld VARCHAR(10) NOT NULL,
    length INT NOT NULL,
    pattern VARCHAR(20),  -- CVCV, CVCVC, CCVCV, etc.
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Denormalized for fast queries
    starts_with CHAR(1) GENERATED ALWAYS AS (LEFT(word, 1)) STORED,
    ends_with CHAR(1) GENERATED ALWAYS AS (RIGHT(word, 1)) STORED
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_available_tld ON available_domains(tld);
CREATE INDEX IF NOT EXISTS idx_available_length ON available_domains(length);
CREATE INDEX IF NOT EXISTS idx_available_pattern ON available_domains(pattern);
CREATE INDEX IF NOT EXISTS idx_available_starts ON available_domains(starts_with);
CREATE INDEX IF NOT EXISTS idx_available_ends ON available_domains(ends_with);
CREATE INDEX IF NOT EXISTS idx_available_checked ON available_domains(checked_at);

-- Composite index for typical searches: tld + length
CREATE INDEX IF NOT EXISTS idx_available_tld_length ON available_domains(tld, length);

-- Track domains that were verified taken (for cleanup)
CREATE TABLE IF NOT EXISTS taken_domains (
    domain VARCHAR(100) PRIMARY KEY,
    word VARCHAR(50) NOT NULL,
    tld VARCHAR(10) NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metadata table for tracking check progress
CREATE TABLE IF NOT EXISTS check_progress (
    id SERIAL PRIMARY KEY,
    tld VARCHAR(10) NOT NULL,
    total_checked INT DEFAULT 0,
    available_count INT DEFAULT 0,
    taken_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    last_word VARCHAR(50),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Helper view for quick stats
CREATE OR REPLACE VIEW domain_stats AS
SELECT
    tld,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE length = 4) as len_4,
    COUNT(*) FILTER (WHERE length = 5) as len_5,
    COUNT(*) FILTER (WHERE length = 6) as len_6,
    MIN(checked_at) as oldest_check,
    MAX(checked_at) as newest_check
FROM available_domains
GROUP BY tld;

-- Example queries that will be fast:
--
-- Get 50 random 5-letter .ai domains:
-- SELECT domain FROM available_domains
-- WHERE tld = 'ai' AND length = 5
-- ORDER BY RANDOM() LIMIT 50;
--
-- Get domains starting with 'z':
-- SELECT domain FROM available_domains
-- WHERE tld = 'ai' AND starts_with = 'z'
-- LIMIT 100;
--
-- Get CVCV pattern domains:
-- SELECT domain FROM available_domains
-- WHERE tld = 'ai' AND pattern = 'CVCV'
-- LIMIT 100;
