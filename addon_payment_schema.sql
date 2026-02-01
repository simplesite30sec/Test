-- Add payment tracking to site_addons table
-- This tracks whether an addon was purchased (one-time) vs just activated for free trial

ALTER TABLE site_addons 
ADD COLUMN IF NOT EXISTS is_purchased BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS purchase_type VARCHAR(20), -- 'payment' or 'coupon'
ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);

-- Add a comment explaining the logic
COMMENT ON COLUMN site_addons.is_purchased IS 'True if user paid or used coupon for this addon (one-time purchase)';
COMMENT ON COLUMN site_addons.purchase_type IS 'How the addon was acquired: "payment" or "coupon"';
COMMENT ON COLUMN site_addons.purchased_at IS 'When the addon was purchased';
COMMENT ON COLUMN site_addons.coupon_code IS 'Coupon code used if purchase_type is "coupon"';
