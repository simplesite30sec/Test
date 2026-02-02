'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';

function SuccessContent() {
    const searchParams = useSearchParams();
    // Toss Payments params
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    // PortOne params
    const paymentId = searchParams.get('paymentId');

    const id = searchParams.get('id');

    const [status, setStatus] = useState('결제 확인 중...');
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        const verifyAndActivate = async () => {
            // Check for either Toss (paymentKey) or PortOne (paymentId)
            const isValidPayment = (paymentKey && orderId && amount) || paymentId;

            if (!id || !isValidPayment) {
                setStatus('결제 정보가 올바르지 않습니다.');
                setIsProcessing(false);
                return;
            }

            try {
                // 1. In a real app, verify payment with Toss Payments API via backend
                // For MVP/Test, we assume the redirection with valid params allows us to proceed

                // 2. Update Subscription in Supabase
                // Fetch current expiration to add "Trial + 1 Year"
                const { data: currentSite } = await supabase
                    .from('sites')
                    .select('expires_at')
                    .eq('id', id)
                    .single();

                let newExpiresAt = new Date();
                const now = new Date();

                if (currentSite?.expires_at) {
                    const currentExpireDate = new Date(currentSite.expires_at);
                    if (currentExpireDate > now) {
                        // If trial is still active, add 365 days to the existing expiration
                        newExpiresAt = new Date(currentExpireDate.getTime() + 365 * 24 * 60 * 60 * 1000);
                    } else {
                        // Already expired, start from now
                        newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
                    }
                } else {
                    newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
                }

                const { error } = await supabase
                    .from('sites')
                    .update({
                        is_paid: true,
                        expires_at: newExpiresAt.toISOString()
                    })
                    .eq('id', id);

                if (error) throw error;

                // 3. Record Coupon Usage (if exists in localStorage)
                const pendingCoupon = localStorage.getItem('pending_coupon');
                if (pendingCoupon) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase.from('coupon_usages').insert({
                            user_id: user.id,
                            coupon_code: pendingCoupon,
                            site_id: id
                        });
                    }
                    localStorage.removeItem('pending_coupon');
                }

                // 4. Record Payment in the database
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Extract payment method from searchParams if possible or use default
                    // PortOne V2 doesn't always return method in redirect URL unless configured
                    // For now, we'll label it 'portone' (KakaoPay usually falls under easy_pay)
                    await supabase.from('payments').insert({
                        user_id: user.id,
                        site_id: id,
                        amount: amount ? parseInt(amount) : 9900, // Fallback to default
                        method: 'kakaopay', // User specifically mentioned KakaoPay
                        coupon_code: pendingCoupon || null,
                        payment_id: paymentId,
                        status: 'success'
                    });
                }

                setStatus('결제가 성공적으로 완료되었습니다! 이제 홈페이지가 게시됩니다.');
            } catch (error) {
                console.error('Payment verification failed:', error);
                setStatus('결제 처리에 실패했습니다. 관리자에게 문의해주세요.');
            } finally {
                setIsProcessing(false);
            }
        };

        verifyAndActivate();
    }, [paymentKey, orderId, amount, paymentId, id]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
                {isProcessing ? (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
                        <h1 className="text-2xl font-bold mb-2 text-gray-900">결제 확인 중...</h1>
                        <p className="text-gray-600 mb-8 leading-relaxed">잠시만 기다려주세요.</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2 text-gray-900">결제 성공!</h1>
                        <p className="text-gray-600 mb-8 leading-relaxed">{status}</p>

                        <div className="space-y-3">
                            {id && (
                                <Link href={`/site?id=${id}`} className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition shadow-md hover:shadow-lg">
                                    내 홈페이지로 이동
                                </Link>
                            )}
                            <Link href="/" className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition">
                                홈으로 돌아가기
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">결제 정보를 불러오는 중...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
