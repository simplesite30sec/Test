ALTER TABLE sites ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS google_analytics_id TEXT;

-- Create simple analytics procedure to increment views safely
CREATE OR REPLACE FUNCTION increment_view_count(site_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE sites
  SET view_count = view_count + 1
  WHERE id = site_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
