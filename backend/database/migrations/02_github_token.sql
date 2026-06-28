-- Migration: Add github_token to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_token TEXT;
