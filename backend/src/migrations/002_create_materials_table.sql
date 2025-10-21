-- UP
CREATE TYPE material_type AS ENUM ('AUXILIARY', 'FINISHED');

CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    image_url VARCHAR(500),
    supplier VARCHAR(255),
    type material_type NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_type ON materials(type);
CREATE INDEX idx_materials_supplier ON materials(supplier);
CREATE INDEX idx_materials_name ON materials(name);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_materials_updated_at 
    BEFORE UPDATE ON materials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- DOWN
DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;
DROP INDEX IF EXISTS idx_materials_name;
DROP INDEX IF EXISTS idx_materials_supplier;
DROP INDEX IF EXISTS idx_materials_type;
DROP INDEX IF EXISTS idx_materials_category;
DROP TABLE IF EXISTS materials;
DROP TYPE IF EXISTS material_type;