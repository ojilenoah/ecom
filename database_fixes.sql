-- Add missing columns to vendor_profiles table
ALTER TABLE vendor_profiles 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add some default settings if they don't exist
INSERT INTO settings (key, value) VALUES 
('site_name', 'SoftShop') 
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES 
('site_description', 'Modern E-commerce Platform') 
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES 
('contact_email', 'admin@softshop.com') 
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES 
('currency', 'USD') 
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES 
('tax_rate', '8.5') 
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES 
('shipping_fee', '9.99') 
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES 
('enable_notifications', 'true') 
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES 
('maintenance_mode', 'false') 
ON CONFLICT (key) DO NOTHING;

-- Check current orders and vendor stats
SELECT 'Orders with vendor_id:' as info;
SELECT id, user_id, vendor_id, total, status, created_at 
FROM orders 
WHERE vendor_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'Vendor stats check:' as info;
SELECT 
  v.user_id,
  u.name as vendor_name,
  COUNT(o.id) as order_count,
  COALESCE(SUM(CAST(o.total AS DECIMAL)), 0) as total_revenue
FROM vendor_profiles v
LEFT JOIN users u ON v.user_id = u.id
LEFT JOIN orders o ON o.vendor_id = v.user_id AND o.status = 'paid'
GROUP BY v.user_id, u.name;