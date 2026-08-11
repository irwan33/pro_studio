-- Pro Studio PostgreSQL Setup Script
-- Run this with: psql -U postgres -f scripts/setup-postgres.sql

-- Create database
CREATE DATABASE prostudio;

-- Create user
CREATE USER prostudio WITH PASSWORD 'prostudio';

-- Grant privileges on database
GRANT ALL PRIVILEGES ON DATABASE prostudio TO prostudio;

-- Connect to the database
\c prostudio

-- Grant schema privileges (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO prostudio;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO prostudio;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO prostudio;

-- Show success message
SELECT 'PostgreSQL setup complete! Database: prostudio, User: prostudio' AS status;
