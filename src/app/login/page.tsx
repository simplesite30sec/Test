'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [isKakao, setIsKakao] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        const kakao = userAgent.includes('kakaotalk');
        setIsKakao(kakao);

        if (kakao) {
            // Auto redirect to external browser for KakaoTalk
            // This solves the 'disallowed_useragent' error for Google Login
            const url = window.location.href;
            if (!url.includes('openExternal=true')) {
                const targetUrl = url.includes('?') ? `${url}&openExternal=true` : `${url}?openExternal=true`;
                window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`;
            }
        }
    }, []);

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });
        if (error) {
            console.error('Login error:', error.message);
            setLoading(false);
        }
    };

    // Redirect if already logged in
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                window.location.href = '/dashboard';
            }
        };
        checkUser();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">SimpleSite</h1>
                    <p className="text-gray-500">30초 만에 홈페이지를 만들어보세요</p>
                </div>

                <div className="mb-8">
                    <div className="bg-blue-50 rounded-2xl p-6 mb-6">
                        <div className="text-4xl mb-2">🎁</div>
                        <h2 className="text-xl font-bold text-blue-900 mb-1">1개월 무료 체험</h2>
                        <p className="text-blue-700 text-sm">로그인하고 바로 홈페이지를 만들어보세요!</p>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-4 px-6 rounded-xl transition-all disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {loading ? '로그인 중...' : 'Google로 시작하기'}
                </button>

                {isKakao && (
                    <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-left">
                        <p className="text-orange-800 text-sm font-bold flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4" /> 카카오톡 이용자 안내
                        </p>
                        <p className="text-orange-700 text-xs leading-relaxed">
                            카카오톡 내 브라우저에서는 구글 로그인이 차단될 수 있습니다.
                            자동으로 이동되지 않는다면 아래 버튼을 눌러 외부 브라우저(Chrome/Safari)로 열어주세요.
                        </p>
                        <button
                            onClick={() => {
                                const url = window.location.href.split('?')[0] + '?openExternal=true';
                                window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
                            }}
                            className="mt-3 w-full flex items-center justify-center gap-2 bg-orange-500 text-white text-sm font-bold py-2 rounded-lg hover:bg-orange-600 transition"
                        >
                            <ExternalLink size={14} /> 외부 브라우저로 열기
                        </button>
                    </div>
                )}

                <p className="mt-6 text-xs text-gray-400">
                    로그인하면 서비스 이용약관에 동의하게 됩니다.
                </p>
            </div>
        </div>
    );
}
