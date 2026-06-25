
-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Agent Runs Table
CREATE TABLE IF NOT EXISTS agent_runs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_github_id      TEXT NOT NULL REFERENCES users(github_id) ON DELETE CASCADE,
  project_id          UUID REFERENCES projects(id) ON DELETE CASCADE, -- Null for global assistant
  status              TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'executing', 'waiting', 'recovering', 'paused', 'completed', 'failed')),
  model               TEXT NOT NULL,
  
  -- Run Budget Allocations
  budget_tokens       INTEGER NOT NULL DEFAULT 100000,
  budget_commands     INTEGER NOT NULL DEFAULT 10,
  budget_file_writes  INTEGER NOT NULL DEFAULT 50,
  budget_duration_sec INTEGER NOT NULL DEFAULT 1200, -- 20 minutes default
  
  -- Accumulated Consumption
  tokens_used         INTEGER NOT NULL DEFAULT 0,
  commands_run        INTEGER NOT NULL DEFAULT 0,
  file_writes_run     INTEGER NOT NULL DEFAULT 0,
  duration_sec        INTEGER NOT NULL DEFAULT 0,
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agent Steps Table (Tracks planner state, reasoning, tool calls, and responses)
CREATE TABLE IF NOT EXISTS agent_steps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id      UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  step_index  INTEGER NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('plan', 'reasoning', 'tool_call', 'tool_result', 'error')),
  content     JSONB NOT NULL, -- Stores plan checklist, reasoning event, tool arguments, or execution results
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Agent Resource Consumption Ledger (Granular tracking per action)
CREATE TABLE IF NOT EXISTS agent_resources (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id         UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  resource_type  TEXT NOT NULL CHECK (resource_type IN ('file_read', 'file_write', 'file_delete', 'command_execution', 'package_installation', 'preview_deployment', 'build_execution')),
  target_path    TEXT,
  quantity       INTEGER NOT NULL DEFAULT 1,
  cost_estimate  NUMERIC(10, 4) DEFAULT 0.0000,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Agent Event Log Table (Tracks background recoveries, model fallbacks, or budget alerts)
CREATE TABLE IF NOT EXISTS agent_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id      UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('info', 'warning', 'recovery_attempt', 'model_fallback', 'budget_alert')),
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast querying during step re-hydration and timeline rendering
CREATE INDEX IF NOT EXISTS agent_runs_user_github_id_idx ON agent_runs(user_github_id);
CREATE INDEX IF NOT EXISTS agent_steps_run_id_idx ON agent_steps(run_id);
CREATE INDEX IF NOT EXISTS agent_resources_run_id_idx ON agent_resources(run_id);
CREATE INDEX IF NOT EXISTS agent_events_run_id_idx ON agent_events(run_id);

-- Auto-update updated_at for agent_runs
CREATE OR REPLACE FUNCTION update_agent_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_runs_updated_at
  BEFORE UPDATE ON agent_runs
  FOR EACH ROW EXECUTE FUNCTION update_agent_runs_updated_at();
