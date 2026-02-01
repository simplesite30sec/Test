-- Create payments table to track revenue and transaction details
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    method TEXT NOT NULL, -- 'kakaopay', 'coupon', 'free_pass'
    coupon_code TEXT,
    payment_id TEXT, -- PortOne paymentId
    status TEXT DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Only admins can view all payments
-- Replace 'inmyeong320@naver.com' check with appropriate RBAC or a simple email check if profiles table exists
-- For now, we'll keep it simple for the Master account logic.
CREATE POLICY "Admins can view all payments"
ON payments FOR SELECT
USING (auth.jwt() ->> 'email' = 'inmyeong320@naver.com');

-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
ON payments FOR SELECT
USING (auth.uid() = user_id);
