-- Add shipping_address_id to orders to link with saved customer addresses
ALTER TABLE orders ADD COLUMN shipping_address_id INTEGER REFERENCES addresses(id);

CREATE INDEX IF NOT EXISTS idx_orders_shipping_address_id ON orders(shipping_address_id);

