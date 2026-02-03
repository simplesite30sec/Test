ALTER TABLE sites ADD COLUMN IF NOT EXISTS portfolio_mode TEXT DEFAULT 'landscape'; -- 'landscape' or 'portrait'
