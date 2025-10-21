-- UP
CREATE TYPE project_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    overall_status project_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX idx_projects_order_id ON projects(order_id);
CREATE INDEX idx_projects_status ON projects(overall_status);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Create unique constraint to ensure one project per order
CREATE UNIQUE INDEX idx_projects_order_unique ON projects(order_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- DOWN
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP INDEX IF EXISTS idx_projects_order_unique;
DROP INDEX IF EXISTS idx_projects_created_at;
DROP INDEX IF EXISTS idx_projects_status;
DROP INDEX IF EXISTS idx_projects_order_id;
DROP TABLE IF EXISTS projects;
DROP TYPE IF EXISTS project_status;