-- Quick fix for missing delivery_time column
-- Run this immediately in Supabase SQL editor

-- Add the missing column
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_time TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('delivery_time', 'product_type', 'combo_items');

-- Update existing products with sample delivery times
UPDATE products SET delivery_time = '1-2 hours' WHERE delivery_time IS NULL AND product_type = 'product';
UPDATE products SET delivery_time = '3-4 hours' WHERE delivery_time IS NULL AND product_type = 'combo';
UPDATE products SET delivery_time = 'Instant' WHERE delivery_time IS NULL AND product_type = 'addon';

-- Show status
SELECT 'Column added successfully!' as status;