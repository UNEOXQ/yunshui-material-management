-- UP
CREATE TYPE status_type AS ENUM ('ORDER', 'PICKUP', 'DELIVERY', 'CHECK');

CREATE TABLE status_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status_type status_type NOT NULL,
    status_value VARCHAR(100) NOT NULL,
    additional_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX idx_status_updates_project_id ON status_updates(project_id);
CREATE INDEX idx_status_updates_updated_by ON status_updates(updated_by);
CREATE INDEX idx_status_updates_status_type ON status_updates(status_type);
CREATE INDEX idx_status_updates_created_at ON status_updates(created_at);

-- Create index on JSONB column for faster queries on additional_data
CREATE INDEX idx_status_updates_additional_data ON status_updates USING GIN (additional_data);

-- DOWN
DROP INDEX IF EXISTS idx_status_updates_additional_data;
DROP INDEX IF EXISTS idx_status_updates_created_at;
DROP INDEX IF EXISTS idx_status_updates_status_type;
DROP INDEX IF EXISTS idx_status_updates_updated_by;
DROP INDEX IF EXISTS idx_status_updates_project_id;
DROP TABLE IF EXISTS status_updates;
DROP TYPE IF EXISTS status_type;