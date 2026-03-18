-- CloudCode Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- Users table (GitHub OAuth, no Supabase auth)
-- github_id is the GitHub numeric user ID
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_id   TEXT UNIQUE NOT NULL,
  login       TEXT NOT NULL,
  email       TEXT,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_github_id_idx ON users(github_id);

-- ─────────────────────────────────────────────
-- Projects table
-- user_github_id links to users.github_id
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_github_id  TEXT NOT NULL REFERENCES users(github_id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('node', 'react', 'empty')),
  status          TEXT NOT NULL DEFAULT 'creating' CHECK (status IN ('creating', 'ready', 'running', 'stopped', 'error')),
  container_id    TEXT,
  port            INTEGER,
  github_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_user_github_id_idx ON projects(user_github_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- Sessions table (terminal session tracking)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_github_id  TEXT NOT NULL REFERENCES users(github_id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS sessions_project_id_idx ON sessions(project_id);

-- ─────────────────────────────────────────────
-- Row Level Security (RLS)
-- NOTE: Since we don't use Supabase auth (auth.uid()),
-- RLS is enforced at the API level. Tables are
-- protected by service_role — anon has no access.
-- ─────────────────────────────────────────────

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

-- All access goes through the backend service role key only.
-- The backend verifies our JWT before any DB operation.
