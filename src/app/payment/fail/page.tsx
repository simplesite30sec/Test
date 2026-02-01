'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function FailContent() {
    const searchParams = useSearchParams();
    const message = searchParams.get('message') || '결제 처리에 실패했습니다.';
    const code = searchParams.get('code');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </div>
                <h1 className="text-2xl font-bold mb-2 text-gray-900">결제 실패</h1>
                <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
                {code && <p className="text-sm text-gray-400 mb-8 bg-gray-50 p-2 rounded">에러 코드: {code}</p>}

                <Link href="/" className="block w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition shadow-md hover:shadow-lg">
                    다시 시도하기
                </Link>
            </div>
        </div>
    );
}

export default function PaymentFailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">에러 정보를 불러오는 중...</div>}>
            <FailContent />
        </Suspense>
    );
}
