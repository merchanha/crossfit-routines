-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE crossfit_pro'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'crossfit_pro')\gexec
