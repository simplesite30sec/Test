'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

function SuccessContent() {
    const searchParams = useSearchParams();
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const id = searchParams.get('id');

    const [status, setStatus] = useState('결제 확인 중...');

    useEffect(() => {
        if (paymentKey && orderId && amount) {
            // Here you would optimally verify payment with your backend (e.g. Supabase Edge Function)
            // For MVP, we assume success if params are present and simulate verification
            setStatus('결제가 성공적으로 완료되었습니다! 이제 홈페이지가 게시됩니다.');

            // TODO: In a real app, send verification request to backend
        }
    }, [paymentKey, orderId, amount]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h1 className="text-2xl font-bold mb-2 text-gray-900">결제 성공!</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">{status}</p>

                <div className="space-y-3">
                    {id && (
                        <Link href={`/site/${id}`} className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition shadow-md hover:shadow-lg">
                            내 홈페이지로 이동
                        </Link>
                    )}
                    <Link href="/" className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition">
                        홈으로 돌아가기
                    </Link>
                </div>
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
