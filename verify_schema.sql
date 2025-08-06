-- ============================================================================
-- VERIFICATION QUERIES FOR NEW ORDERS SCHEMA
-- Run these queries after executing database_redesign.sql
-- ============================================================================

-- 1. Show the complete table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 2. Show all indexes created
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'orders'
ORDER BY indexname;

-- 3. Show sample data with nicely formatted JSONB
SELECT 
    id,
    order_number,
    contact_name,
    contact_phone,
    jsonb_pretty(items) as formatted_items,
    total_amount,
    subtotal,
    tax_amount,
    delivery_fee,
    status,
    jsonb_pretty(delivery_address) as formatted_address,
    created_at
FROM orders 
ORDER BY created_at DESC;

-- 4. Show count of orders by status
SELECT 
    status,
    COUNT(*) as order_count
FROM orders 
GROUP BY status
ORDER BY order_count DESC;

-- 5. Show summary of item types across all orders
SELECT 
    item->>'type' as item_type,
    COUNT(*) as item_count,
    SUM((item->>'quantity')::int) as total_quantity,
    SUM((item->>'total_price')::decimal) as total_value
FROM orders, jsonb_array_elements(items) AS item
GROUP BY item->>'type'
ORDER BY total_value DESC;

-- 6. Test JSONB querying capabilities
-- Orders containing products (not combos or addons)
SELECT 
    order_number,
    contact_name,
    total_amount
FROM orders 
WHERE items @> '[{"type": "product"}]';

-- Orders with gift-wrapped items
SELECT 
    order_number,
    contact_name,
    item->>'name' as gift_item
FROM orders, jsonb_array_elements(items) AS item
WHERE item->>'is_gift_wrapped' = 'true';

-- 7. Show trigger is working (updated_at should match created_at for new records)
SELECT 
    order_number,
    created_at,
    updated_at,
    (updated_at = created_at) as timestamps_match
FROM orders;