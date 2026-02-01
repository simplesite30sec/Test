-- Add Google Maps, Section Titles, and Font Selection
ALTER TABLE sites ADD COLUMN IF NOT EXISTS google_map TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS section_titles JSONB DEFAULT '{
  "about": "About Us",
  "menu": "Menu / Portfolio",
  "reviews": "Customer Reviews",
  "contact": "Contact & Location",
  "inquiry": "문의하기",
  "qna": "Q&A"
}'::jsonb;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) DEFAULT 'Inter';
