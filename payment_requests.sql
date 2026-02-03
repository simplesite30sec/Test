-- Create payment_requests table for manual bank transfer verification
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    addon_type TEXT, -- 'site_extension', 'qna', 'domain', etc.
    amount INTEGER NOT NULL,
    deposit_name TEXT NOT NULL,
    contact TEXT NOT NULL,
    receipt_type TEXT NOT NULL DEFAULT 'none', -- 'none', 'personal', 'business'
    receipt_info TEXT, -- Phone number or Business Registration Number
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reason TEXT, -- Optional rejection reason
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- RLS policies
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Users can manage their own requests
CREATE POLICY "Users can view their own payment requests" ON payment_requests 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment requests" ON payment_requests 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can manage everything (specific email)
CREATE POLICY "Admin can view and manage all payment requests" ON payment_requests
    FOR ALL USING (auth.jwt() ->> 'email' = 'inmyeong320@naver.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'inmyeong320@naver.com');
