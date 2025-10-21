-- UP
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0)
);

-- Create indexes for faster lookups
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_material_id ON order_items(material_id);

-- Create unique constraint to prevent duplicate items in same order
CREATE UNIQUE INDEX idx_order_items_unique ON order_items(order_id, material_id);

-- DOWN
DROP INDEX IF EXISTS idx_order_items_unique;
DROP INDEX IF EXISTS idx_order_items_material_id;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP TABLE IF EXISTS order_items;