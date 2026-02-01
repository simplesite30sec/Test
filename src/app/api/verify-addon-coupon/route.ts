import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { couponCode } = await req.json();

        if (!couponCode) {
            return NextResponse.json({ error: '쿠폰 코드를 입력해주세요.' }, { status: 400 });
        }

        // Fetch coupon from database
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', couponCode)
            .single();

        if (error || !coupon) {
            return NextResponse.json({ error: '유효하지 않은 쿠폰 코드입니다.' }, { status: 404 });
        }

        // Check if coupon is for addon (not site payment)
        // We'll use description or a new field to mark addon coupons
        // For now, let's check if description contains "애드온" or value is 3000
        const isAddonCoupon = coupon.value === 3000 || (coupon.description && coupon.description.includes('애드온'));

        if (!isAddonCoupon) {
            return NextResponse.json({ error: '이 쿠폰은 애드온에 사용할 수 없습니다.' }, { status: 400 });
        }

        // Check if coupon is expired
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return NextResponse.json({ error: '만료된 쿠폰입니다.' }, { status: 400 });
        }

        // Check usage limit
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
            return NextResponse.json({ error: '쿠폰 사용 횟수가 초과되었습니다.' }, { status: 400 });
        }

        // Increment usage count
        await supabase
            .from('coupons')
            .update({ used_count: coupon.used_count + 1 })
            .eq('code', couponCode);

        return NextResponse.json({
            success: true,
            discount: coupon.value,
            message: '쿠폰이 적용되었습니다!'
        });

    } catch (e) {
        const error = e as Error;
        console.error('Coupon verification error:', error);
        return NextResponse.json({
            error: '쿠폰 검증 중 오류가 발생했습니다.',
            details: error.message || '알 수 없는 오류',
            envExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }, { status: 500 });
    }
}
