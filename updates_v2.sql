-- 1. Add status columns to sites table
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused'
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- 2. Create coupon_usages table to prevent abuse
CREATE TABLE IF NOT EXISTS coupon_usages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    coupon_code TEXT NOT NULL,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, coupon_code) -- User can use a specific coupon code only once
);

-- 3. Row Level Security (RLS) Policies
-- Enable RLS on sites if not already enabled
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public can view 'active' sites
CREATE POLICY "Public can view active sites" 
ON sites FOR SELECT 
USING (status = 'active');

-- Policy 2: Owners can view/edit their own sites (regardless of status)
CREATE POLICY "Users can manage their own sites" 
ON sites FOR ALL 
USING (auth.uid() = user_id);

-- Note: You might need to drop existing policies if they conflict.
-- DROP POLICY IF EXISTS "Enable read access for all users" ON sites;

-- 4. Update existing sites to 'active' if they are already created (optional migration)
UPDATE sites SET status = 'active' WHERE status = 'draft';
