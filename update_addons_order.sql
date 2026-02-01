-- Add sort_order column to site_addons to control display sequence
ALTER TABLE site_addons ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
