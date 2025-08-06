# Orders Database Schema Redesign

## Overview
The orders database has been completely redesigned to use a simplified, single-table approach with JSONB for storing order items. This eliminates complex joins and makes the frontend integration much simpler.

## Key Benefits
- **Simplified Structure**: Single `orders` table instead of separate `orders` and `order_items` tables
- **Flexible Items Storage**: JSONB field can store any combination of products, combos, and addons
- **Better Performance**: Fewer joins required, optimized indexes for common queries
- **Frontend Friendly**: Complete order data available in a single query
- **Scalable**: JSONB allows for easy schema evolution without migrations

## Table Structure

### `orders` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `order_number` | TEXT | Unique order identifier (e.g., "SST1234567890") |
| `contact_name` | TEXT | Customer name |
| `contact_phone` | TEXT | Customer phone number |
| `user_id` | UUID | Optional reference to registered user |
| `items` | JSONB | Array of order items (see structure below) |
| `total_amount` | DECIMAL(10,2) | Final total including all fees and taxes |
| `subtotal` | DECIMAL(10,2) | Subtotal before taxes and fees |
| `tax_amount` | DECIMAL(10,2) | Tax amount |
| `delivery_fee` | DECIMAL(10,2) | Delivery fee |
| `discount_amount` | DECIMAL(10,2) | Any discounts applied |
| `status` | TEXT | Order status (pending, confirmed, preparing, out_for_delivery, delivered, cancelled) |
| `delivery_partner_id` | UUID | Reference to delivery partner |
| `delivery_notes` | TEXT | Special delivery instructions |
| `delivery_address` | JSONB | Complete address information |
| `special_instructions` | TEXT | Order-level special instructions |
| `created_at` | TIMESTAMPTZ | Order creation time |
| `updated_at` | TIMESTAMPTZ | Last update time (auto-updated via trigger) |
| `estimated_delivery_time` | TIMESTAMPTZ | Expected delivery time |
| `payment_method` | TEXT | Payment method used |
| `payment_status` | TEXT | Payment status |

## JSONB Structure for `items`

The `items` field contains an array of objects, where each object represents an order item:

### Basic Item Structure
```json
{
  "id": "item_1",
  "type": "product|combo|addon",
  "name": "Item Name",
  "image_url": "https://example.com/image.jpg",
  "quantity": 1,
  "base_price": 500,
  "total_price": 580,
  "special_instructions": "Custom text",
  "is_gift_wrapped": true
}
```

### Product Item Example
```json
{
  "id": "item_1",
  "type": "product",
  "name": "Chocolate Cake",
  "image_url": "https://example.com/chocolate-cake.jpg",
  "quantity": 1,
  "base_price": 500,
  "total_price": 580,
  "variations": {
    "size": {"name": "Medium", "price_adjustment": 50},
    "flavor": {"name": "Dark Chocolate", "price_adjustment": 0}
  },
  "special_instructions": "Happy Birthday Sarah",
  "is_gift_wrapped": true
}
```

### Combo Item Example
```json
{
  "id": "combo_1",
  "type": "combo",
  "name": "Family Feast Combo",
  "image_url": "https://example.com/family-combo.jpg",
  "quantity": 1,
  "base_price": 1200,
  "total_price": 1350,
  "combo_items": [
    {
      "name": "Large Pizza",
      "variations": {"crust": "Thin Crust", "toppings": ["Pepperoni", "Mushrooms"]}
    },
    {
      "name": "Garlic Bread",
      "quantity": 2
    }
  ],
  "variations": {
    "pizza_size": {"name": "Large", "price_adjustment": 150}
  }
}
```

### Addon Item Example
```json
{
  "id": "addon_1",
  "type": "addon",
  "name": "Extra Cheese",
  "image_url": "https://example.com/extra-cheese.jpg",
  "quantity": 1,
  "base_price": 50,
  "total_price": 50
}
```

## JSONB Structure for `delivery_address`

```json
{
  "street": "123 Main Street",
  "apartment": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "country": "USA",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

## Indexes Created

1. `idx_orders_status` - For filtering by order status
2. `idx_orders_created_at` - For sorting by creation date (descending)
3. `idx_orders_contact_phone` - For searching by phone number
4. `idx_orders_order_number` - For quick order lookup
5. `idx_orders_delivery_partner` - For delivery partner queries
6. `idx_orders_user_id` - For user-specific queries
7. `idx_orders_items_gin` - GIN index for JSONB querying

## Common Queries

### Get All Orders with Items
```sql
SELECT 
    order_number,
    contact_name,
    total_amount,
    status,
    jsonb_pretty(items) as items,
    created_at
FROM orders 
ORDER BY created_at DESC;
```

### Find Orders by Item Type
```sql
-- Get orders containing products
SELECT * FROM orders WHERE items @> '[{"type": "product"}]';

-- Get orders with combos
SELECT * FROM orders WHERE items @> '[{"type": "combo"}]';
```

### Find Orders with Special Features
```sql
-- Orders with gift-wrapped items
SELECT * FROM orders WHERE items @> '[{"is_gift_wrapped": true}]';

-- Orders with special instructions on items
SELECT 
    order_number,
    item->>'name' as item_name,
    item->>'special_instructions' as instructions
FROM orders, jsonb_array_elements(items) AS item
WHERE item->>'special_instructions' IS NOT NULL;
```

### Calculate Order Statistics
```sql
-- Total quantity of items per order
SELECT 
    order_number,
    (SELECT SUM((item->>'quantity')::int) 
     FROM jsonb_array_elements(items) AS item) as total_items
FROM orders;

-- Revenue by item type
SELECT 
    item->>'type' as item_type,
    COUNT(*) as item_count,
    SUM((item->>'total_price')::decimal) as total_revenue
FROM orders, jsonb_array_elements(items) AS item
GROUP BY item->>'type';
```

## Migration Instructions

1. **Backup existing data** before running the migration
2. Execute `database_redesign.sql` to drop old tables and create new structure
3. Run `verify_schema.sql` to confirm everything is working correctly
4. Update your application code to work with the new schema

## Frontend Integration Benefits

- **Single Query**: Get complete order with all items in one database call
- **Flexible Display**: JSONB structure allows for dynamic rendering of different item types
- **No Joins**: Eliminates complex JOIN queries that can be slow
- **Rich Data**: Each item contains all necessary information for display
- **Easy Filtering**: Use JSONB operators for powerful filtering capabilities

## Notes

- The `updated_at` field is automatically maintained via a database trigger
- All monetary values are stored as DECIMAL(10,2) for precision
- JSONB provides excellent query performance with proper indexing
- The schema is designed to be backwards compatible with existing order workflows