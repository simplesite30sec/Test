-- Table to track installed add-ons per site
CREATE TABLE IF NOT EXISTS site_addons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    addon_type TEXT NOT NULL, -- 'inquiry', 'qna', 'notice'
    config JSONB DEFAULT '{}', -- { "title": "문의하기", "position": "bottom" }
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(site_id, addon_type)
);

-- Table for Q&A posts and Notices
CREATE TABLE IF NOT EXISTS site_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'qna', 'notice'
    title TEXT NOT NULL,
    content TEXT,
    author_name TEXT DEFAULT '익명',
    password TEXT, -- Simple password for editing/deleting by anonymous users
    is_secret BOOLEAN DEFAULT false, -- For secret Q&A
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table for Inquiry form submissions
CREATE TABLE IF NOT EXISTS site_inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies
ALTER TABLE site_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_inquiries ENABLE ROW LEVEL SECURITY;

-- 1. Site Addons Policies
-- Public can read active addons
CREATE POLICY "Public can view active addons"
ON site_addons FOR SELECT
USING (true);

-- Owners can manage addons
CREATE POLICY "Owners can manage addons"
ON site_addons FOR ALL
USING (EXISTS (SELECT 1 FROM sites WHERE id = site_addons.site_id AND user_id = auth.uid()));

-- 2. Site Posts Policies
-- Public can read posts (unless secret?) logic handled in app mostly, but allow select
CREATE POLICY "Public can view posts"
ON site_posts FOR SELECT
USING (true);

-- Anyone can insert posts (for Q&A)
CREATE POLICY "Public can create posts"
ON site_posts FOR INSERT
WITH CHECK (true);

-- Owners can delete/update posts
CREATE POLICY "Owners can manage posts"
ON site_posts FOR ALL
USING (EXISTS (SELECT 1 FROM sites WHERE id = site_posts.site_id AND user_id = auth.uid()));

-- 3. Site Inquiries Policies
-- Owners can read inquiries
CREATE POLICY "Owners can view inquiries"
ON site_inquiries FOR SELECT
USING (EXISTS (SELECT 1 FROM sites WHERE id = site_inquiries.site_id AND user_id = auth.uid()));

-- Public can insert inquiries
CREATE POLICY "Public can create inquiries"
ON site_inquiries FOR INSERT
WITH CHECK (true);
