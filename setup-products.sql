-- SQL script to set up the products table with proper structure and sample data
-- This ensures the products page works correctly

-- First, let's ensure the product_type field exists (if not already there)
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type text;

-- Insert sample products if the table is empty
INSERT INTO products (
  id,
  name,
  description,
  price,
  image_url,
  category,
  product_type,
  is_active,
  is_featured,
  stock_quantity
) VALUES 
  -- Regular Products
  ('prod_001', 'Chocolate Cake', 'Rich chocolate cake with dark chocolate frosting', 35.99, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587', 'Cakes', 'product', true, true, 10),
  ('prod_002', 'Vanilla Cupcake', 'Classic vanilla cupcake with buttercream', 4.99, 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7', 'Cupcakes', 'product', true, false, 25),
  ('prod_003', 'Red Velvet Cake', 'Moist red velvet with cream cheese frosting', 42.99, 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f', 'Cakes', 'product', true, true, 8),
  ('prod_004', 'Blueberry Muffin', 'Fresh blueberry muffin with streusel topping', 3.99, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa', 'Muffins', 'product', true, false, 30),
  ('prod_005', 'Croissant', 'Buttery French croissant', 4.50, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a', 'Pastries', 'product', true, false, 20),
  
  -- Combos
  ('combo_001', 'Birthday Special', 'Cake + 6 Cupcakes + Balloons', 65.99, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3', 'Combos', 'combo', true, true, null),
  ('combo_002', 'Tea Time Bundle', '2 Muffins + 2 Croissants + Tea', 18.99, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35', 'Combos', 'combo', true, false, null),
  ('combo_003', 'Party Pack', 'Large Cake + 12 Cupcakes', 89.99, 'https://images.unsplash.com/photo-1535141192574-5d4897c12636', 'Combos', 'combo', true, true, null),
  
  -- Add-ons
  ('addon_001', 'Extra Frosting', 'Additional frosting portion', 2.99, null, 'Add-ons', 'addon', true, false, null),
  ('addon_002', 'Custom Message', 'Personalized cake message', 5.00, null, 'Add-ons', 'addon', true, false, null),
  ('addon_003', 'Gift Wrapping', 'Premium gift wrapping service', 7.99, null, 'Add-ons', 'addon', true, false, null),
  ('addon_004', 'Candles Set', 'Birthday candles (numbered)', 3.99, null, 'Add-ons', 'addon', true, false, 50)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  product_type = EXCLUDED.product_type;

-- Insert sample categories if they don't exist
INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active) VALUES
  ('cat_001', 'Cakes', 'cakes', 'Delicious cakes for all occasions', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587', 1, true),
  ('cat_002', 'Cupcakes', 'cupcakes', 'Individual cupcakes', 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7', 2, true),
  ('cat_003', 'Muffins', 'muffins', 'Fresh baked muffins', 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa', 3, true),
  ('cat_004', 'Pastries', 'pastries', 'French pastries and more', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a', 4, true),
  ('cat_005', 'Combos', 'combos', 'Value bundles and combos', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3', 5, true),
  ('cat_006', 'Add-ons', 'addons', 'Extra services and items', null, 6, true)
ON CONFLICT (id) DO NOTHING;

-- Update category_id for products that have categories
UPDATE products SET category_id = 'cat_001' WHERE category = 'Cakes' AND category_id IS NULL;
UPDATE products SET category_id = 'cat_002' WHERE category = 'Cupcakes' AND category_id IS NULL;
UPDATE products SET category_id = 'cat_003' WHERE category = 'Muffins' AND category_id IS NULL;
UPDATE products SET category_id = 'cat_004' WHERE category = 'Pastries' AND category_id IS NULL;
UPDATE products SET category_id = 'cat_005' WHERE category = 'Combos' AND category_id IS NULL;
UPDATE products SET category_id = 'cat_006' WHERE category = 'Add-ons' AND category_id IS NULL;

-- Set combo_items for combo products (as JSONB)
UPDATE products 
SET combo_items = '[
  {"product_id": "prod_001", "quantity": 1, "name": "Chocolate Cake"},
  {"product_id": "prod_002", "quantity": 6, "name": "Vanilla Cupcake"}
]'::jsonb
WHERE id = 'combo_001';

UPDATE products 
SET combo_items = '[
  {"product_id": "prod_004", "quantity": 2, "name": "Blueberry Muffin"},
  {"product_id": "prod_005", "quantity": 2, "name": "Croissant"}
]'::jsonb
WHERE id = 'combo_002';

UPDATE products 
SET combo_items = '[
  {"product_id": "prod_003", "quantity": 1, "name": "Red Velvet Cake"},
  {"product_id": "prod_002", "quantity": 12, "name": "Vanilla Cupcake"}
]'::jsonb
WHERE id = 'combo_003';

-- Create a view if needed for easier querying
CREATE OR REPLACE VIEW products_with_categories AS
SELECT 
  p.*,
  c.name as category_name,
  c.slug as category_slug
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Grant permissions
GRANT ALL ON products TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT SELECT ON products_with_categories TO authenticated;

-- Output confirmation
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN product_type = 'product' OR product_type IS NULL THEN 1 END) as regular_products,
  COUNT(CASE WHEN product_type = 'combo' THEN 1 END) as combos,
  COUNT(CASE WHEN product_type = 'addon' THEN 1 END) as addons
FROM products;