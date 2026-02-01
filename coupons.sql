-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('discount', 'free')),
    value INTEGER DEFAULT 0,
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_count INTEGER DEFAULT 0
);

-- Insert sample coupons for testing
INSERT INTO coupons (code, type, value, description, max_uses) VALUES 
('FRIEND_EVENT', 'free', 0, '지인용 무료 패스', 999), 
('WELCOME_3000', 'discount', 3000, '3,000원 할인 (애드온 무료)', 999),
('TEST_100', 'discount', 9800, '100원 결제 테스트용', 999),
('FRIEND_ADD1', 'discount', 3000, '친구 초대 애드온 무료 쿠폰', 1),
('FRIEND_ADD2', 'discount', 3000, '친구 초대 애드온 무료 쿠폰', 1);

-- RLS policies (Optional for public read, strictly should be secure but for MVP public read is okay for checking validity)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON coupons FOR SELECT USING (true);
