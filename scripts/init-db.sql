-- =============================================================================
-- SPAC OS - Database Initialization Script
-- =============================================================================
-- This script runs when the PostgreSQL Docker container is first created
-- It sets up required extensions and initial configuration
-- =============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;

-- Grant permissions
GRANT ALL ON SCHEMA public TO spac_os;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO spac_os;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO spac_os;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO spac_os;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO spac_os;

-- Add helpful comments
COMMENT ON SCHEMA public IS 'SPAC OS application schema';

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'SPAC OS database initialized successfully';
    RAISE NOTICE 'Extensions enabled: uuid-ossp, pgcrypto, pg_trgm';
END $$;
