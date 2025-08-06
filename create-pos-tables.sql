-- Create POS orders table
CREATE TABLE IF NOT EXISTS pos_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR NOT NULL UNIQUE,
  items JSONB NOT NULL, -- Array of cart items with product details
  subtotal NUMERIC NOT NULL,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_method VARCHAR NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi')),
  amount_received NUMERIC,
  change_amount NUMERIC DEFAULT 0,
  customer_name VARCHAR,
  customer_phone VARCHAR,
  status VARCHAR DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'cancelled')),
  cashier_id UUID, -- For future user management
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add barcode field to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR UNIQUE;

-- Create indexes for better performance
CREATE INDEX idx_pos_orders_order_number ON pos_orders(order_number);
CREATE INDEX idx_pos_orders_created_at ON pos_orders(created_at);
CREATE INDEX idx_pos_orders_payment_method ON pos_orders(payment_method);
CREATE INDEX idx_pos_orders_status ON pos_orders(status);
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

-- Create updated_at trigger for pos_orders
CREATE TRIGGER update_pos_orders_updated_at
BEFORE UPDATE ON pos_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "POS orders are viewable by authenticated users" ON pos_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert POS orders" ON pos_orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update POS orders" ON pos_orders
  FOR UPDATE TO authenticated USING (true);

-- Grant permissions
GRANT ALL ON pos_orders TO authenticated;
GRANT SELECT ON pos_orders TO anon;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS pos_order_number_seq START 1001;

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_pos_order_number()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'POS' || LPAD(nextval('pos_order_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Update some sample products with barcodes for testing
UPDATE products SET barcode = '123456789001' WHERE name LIKE '%Chocolate Cake%' AND barcode IS NULL;
UPDATE products SET barcode = '123456789002' WHERE name LIKE '%Vanilla Cupcake%' AND barcode IS NULL;
UPDATE products SET barcode = '123456789003' WHERE name LIKE '%Red Velvet%' AND barcode IS NULL;
UPDATE products SET barcode = '123456789004' WHERE name LIKE '%Blueberry Muffin%' AND barcode IS NULL;
UPDATE products SET barcode = '123456789005' WHERE name LIKE '%Croissant%' AND barcode IS NULL;

SELECT 'POS tables and barcode support created successfully!' as status;
SELECT COUNT(*) as total_products_with_barcodes FROM products WHERE barcode IS NOT NULL;