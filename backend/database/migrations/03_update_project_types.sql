-- Migration: Update projects_type_check constraint to support new templates
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_type_check;

ALTER TABLE projects ADD CONSTRAINT projects_type_check CHECK (
  type IN ('node', 'react', 'empty', 'flask', 'fastapi', 'rust', 'gin', 'nextjs')
);
