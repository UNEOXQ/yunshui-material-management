-- Initialize Yun Shui Material Management Database
-- This script sets up the database with proper permissions and extensions

-- Create database user if not exists (for manual setup)
-- Note: This will be handled by Docker environment variables in containerized setup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- Grant necessary permissions to the application user
-- Note: In Docker setup, the user is already the owner of the database
GRANT ALL PRIVILEGES ON DATABASE yun_shui_db TO yun_shui_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO yun_shui_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yun_shui_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yun_shui_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yun_shui_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yun_shui_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO yun_shui_user;

-- Create a function to update timestamps (will be used by migrations)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
END $$;