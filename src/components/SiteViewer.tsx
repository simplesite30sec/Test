'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { supabase } from '@/utils/supabase/client';
import { Phone, MapPin, Edit, Star, Quote, Instagram, Facebook, Youtube, MessageCircle, Clock, AlertTriangle, Pause, Globe, CheckCircle, X, Mail, Construction } from 'lucide-react';
import QnABoard from './addons/QnABoard';

type SiteData = {
    name: string;
    slogan: string;
    description: string;
    phone: string;
    address: string;
    color: string;
    hero_opacity: number;
    hero_image_url: string;
    logo_url?: string;
    google_analytics_id?: string;
    map_links: { naver?: string; kakao?: string };
    google_map?: string;
    social_links?: { instagram?: string; facebook?: string; blog?: string; tiktok?: string; threads?: string; youtube?: string; email?: string };
    reviews?: { id: string; name: string; content: string; rating: number }[];
    portfolio: { title: string; desc: string; image_url: string }[];
    expires_at?: string;
    is_paid?: boolean;
    status?: 'draft' | 'active' | 'paused';
    section_order?: string[];
    section_titles?: {
        about?: string;
        menu?: string;
        reviews?: string;
        contact?: string;
        qna?: string;
    };
    font_family?: string;
    slug?: string;
    hero_height?: 'full' | 'medium' | 'small';
    portfolio_mode?: 'landscape' | 'portrait';
};

type SiteViewerProps = {
    initialData: SiteData | null;
    id: string;
    expiresAt?: string;
    isPaid?: boolean;
};

export default function SiteViewer({ initialData, id, expiresAt, isPaid }: SiteViewerProps) {
    const [data, setData] = useState<SiteData | null>(initialData);
    const [loading, setLoading] = useState(!initialData);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [couponMessage, setCouponMessage] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [finalPrice, setFinalPrice] = useState(9900);
    const [isCouponApplied, setIsCouponApplied] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [activeAddons, setActiveAddons] = useState<string[]>([]);
    const [canManage, setCanManage] = useState(false); // Check if current user is owner
    const [isEditMode, setIsEditMode] = useState(false); // Check if in edit mode

    // Lightbox state for image expansion
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Check edit mode from URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const editParam = urlParams.get('edit');
        if (editParam) {
            setIsEditMode(true);
        }
    }, []);

    // Set favicon from logo_url
    useEffect(() => {
        if (data?.logo_url) {
            const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
            link.rel = 'icon';
            link.href = data.logo_url;
            if (!document.querySelector("link[rel~='icon']")) {
                document.head.appendChild(link);
            }
        }
    }, [data?.logo_url]);

    // Check ownership and fetch addons
    useEffect(() => {
        const checkOwnershipAndAddons = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && data && id) {
                const { data: site } = await supabase.from('sites').select('user_id').eq('id', id).single();
                if (site && site.user_id === user.id) {
                    setCanManage(true);
                }
            }

            // Fetch Addons
            if (id) {
                const { data: addons } = await supabase
                    .from('site_addons')
                    .select('addon_type')
                    .eq('site_id', id)
                    .eq('is_active', true);

                if (addons) {
                    setActiveAddons(addons.map(a => a.addon_type));
                }
            }
        };
        checkOwnershipAndAddons();
    }, [id, data]);

    // Initial Data Loading from LocalStorage (Backup)
    useEffect(() => {
        if (!data) {
            const localData = localStorage.getItem(`site_${id}`);
            if (localData) {
                try {
                    setData(JSON.parse(localData));
                } catch (e) {
                    console.error("Failed to parse local data", e);
                }
            }
            setLoading(false);
        }
    }, [data, id]);

    // Countdown timer for trial expiration
    useEffect(() => {
        if (isPaid || !expiresAt) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const expireTime = new Date(expiresAt).getTime();
            const diff = expireTime - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft('만료됨');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${hours}시간 ${minutes}분 ${seconds}초`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiresAt, isPaid]);

    const verifyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponMessage('쿠폰 코드를 입력해주세요.');
            return;
        }

        try {
            // 1. Check if valid coupon
            const { data: coupon, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', couponCode.trim())
                .single();

            if (error || !coupon) {
                setCouponMessage('유효하지 않은 쿠폰입니다.');
                setIsCouponApplied(false);
                setDiscountAmount(0);
                setFinalPrice(9900);
                return;
            }

            // 2. Check if already used by this user
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: usage } = await supabase
                    .from('coupon_usages')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('coupon_code', couponCode.trim())
                    .single();

                if (usage) {
                    setCouponMessage('이미 사용한 쿠폰입니다.');
                    setIsCouponApplied(false);
                    return;
                }
            }

            if (coupon.type === 'free') {
                setDiscountAmount(9900);
                setFinalPrice(0);
                setCouponMessage('무료 이용권이 적용되었습니다! (100% 할인)');
                setIsCouponApplied(true);
            } else if (coupon.type === 'discount') {
                const discount = coupon.value || 0;
                const price = Math.max(0, 9900 - discount);
                setDiscountAmount(discount);
                setFinalPrice(price);
                setCouponMessage(`${discount.toLocaleString()}원 할인이 적용되었습니다.`);
                setIsCouponApplied(true);
            }
        } catch (e) {
            console.error(e);
            setCouponMessage('쿠폰 확인 중 오류가 발생했습니다.');
        }
    };

    // ... (useEffect for timer skipped) ...

    const handlePayment = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        // If price is 0 (Free Coupon), skip PortOne and activate directly
        if (finalPrice === 0 && isCouponApplied) {
            if (!confirm('무료 이용권을 사용하여 기간을 연장하시겠습니까?')) return;

            try {
                // 1. Update Site (Activate)
                const oneYearLater = new Date();
                oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

                const { error: updateError } = await supabase
                    .from('sites')
                    .update({
                        is_paid: true,
                        expires_at: oneYearLater.toISOString(),
                        status: 'active', // Ensure active status
                        published_at: new Date().toISOString()
                    })
                    .eq('id', id);

                if (updateError) throw updateError;

                // 2. Record Coupon Usage
                if (user && couponCode) {
                    await supabase.from('coupon_usages').insert({
                        user_id: user.id,
                        coupon_code: couponCode,
                        site_id: id
                    });
                }

                // 3. Record Payment (for Admin Dashboard)
                if (user) {
                    await supabase.from('payments').insert({
                        user_id: user.id,
                        site_id: id,
                        amount: 0,
                        method: finalPrice === 0 ? 'coupon' : 'free_pass',
                        coupon_code: couponCode || null,
                        status: 'success'
                    });
                }

                alert("무료 이용권이 적용되었습니다!");
                window.location.reload();
                return;
            } catch (e) {
                console.error("Free Activation Failed", e);
                alert("이용권 적용에 실패했습니다.");
                return;
            }
        }

        const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "store-c539d171-6af5-4238-be7d-9aea0279ae15";
        const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "channel-key-9355d9b2-e369-4737-9f64-1623f95ae009";

        try {
            // Check if PortOne V2 SDK is loaded
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const PortOne = (window as any).PortOne;

            if (!PortOne) {
                alert("결제 SDK가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
                return;
            }

            // Store coupon code in localStorage to record usage after success redirect
            if (isCouponApplied && couponCode) {
                localStorage.setItem('pending_coupon', couponCode);
            } else {
                localStorage.removeItem('pending_coupon');
            }

            const paymentId = `PAY-${id}-${Date.now()}`;

            const response = await PortOne.requestPayment({
                storeId: storeId,
                channelKey: channelKey,
                paymentId: paymentId,
                orderName: "1년 사이트 소유권 (Ownership)",
                totalAmount: finalPrice, // Use discounted price
                currency: "CURRENCY_KRW",
                payMethod: "EASY_PAY",
                customer: {
                    fullName: data?.name || "고객",
                    email: "customer@example.com",
                    phoneNumber: "010-0000-0000"
                },
                redirectUrl: `${window.location.origin}/payment/success?id=${id}` // PortOne V2 redirects directly
            });

            // If response is returned (e.g. for popup/iframe modes that don't redirect), check code
            if (response) {
                if (response.code != null) {
                    // Payment Failed
                    console.error("Payment error:", response);
                    alert(`결제 처리 중 오류가 발생했습니다: ${response.message || "알 수 없는 오류"}`);
                } else {
                    // Payment Success (Manual Redirect for Desktop)
                    // If response.paymentId exists or code is null, it means success.
                    // For safety, pass paymentId to success page.
                    const pid = response.paymentId || paymentId; // Fallback to generated ID
                    window.location.href = `/payment/success?id=${id}&paymentId=${pid}`;
                }
            }
        } catch (error: unknown) {
            console.error("Payment request failed:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`결제 창 호출 실패: ${errorMessage}`);
        }
    };



    if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
    if (!data) return <div className="min-h-screen flex items-center justify-center">사이트를 찾을 수 없습니다. (로컬 저장소 확인 중...)</div>;

    // Expired or Paused site blocking screen
    const isPaused = data?.status === 'paused';
    // Drafts should be visible to owner (implied if we are here? No, we need to check ownership or let RLS handle it,
    // but client side we show 'Not Published' if draft and not owner?
    // For now, let's assume if data loads, RLS allowed it.
    // But we need a UI for 'Paused'.

    if (isPaused) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Pause className="w-10 h-10 text-orange-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">일시 정지된 사이트</h1>
                    <p className="text-gray-500 mb-6">
                        관리자에 의해 일시적으로 운영이 중단된 페이지입니다.<br />
                        나중에 다시 방문해주세요.
                    </p>
                    <Link href="/" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition">
                        메인으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    if (isExpired && !isPaid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md text-center w-full">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">체험 시간이 만료되었습니다</h1>
                    <p className="text-gray-500 mb-8">
                        1개월 무료 체험이 종료되었습니다.<br />
                        결제하시면 사이트를 계속 이용하실 수 있습니다.
                    </p>

                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-lg hover:shadow-xl"
                    >
                        프리미엄 업그레이드 (9,900원)
                    </button>
                </div>
            </div>
        );
    }

    const {
        name,
        slogan,
        description,
        phone,
        address,
        color,
        hero_opacity = 50,
        hero_image_url,
        map_links = {},
        social_links = {},
        reviews = [],
        portfolio = [],
        hero_height = 'full',
        portfolio_mode = 'landscape',
    } = data;

    // Helper to convert hex to rgba
    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const overlayOpacity = hero_opacity / 100;
    const phones = (phone || '').split('|').map((p: string) => p.trim()).filter(Boolean);

    // If no image, apply transparency to the background color itself using hero_opacity
    // If image exists, apply hero_opacity to the black overlay (existing logic)
    const sectionStyle = hero_image_url
        ? { backgroundColor: color }
        : { backgroundColor: hexToRgba(color, overlayOpacity) };

    const handlePublish = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user already used their free trial
        const { data: profile } = await supabase
            .from('profiles')
            .select('has_used_trial')
            .eq('id', user.id)
            .single();

        const canUseTrial = !profile?.has_used_trial;

        if (canUseTrial) {
            if (!confirm('사이트를 게시하시겠습니까?\n게시 후 1개월 동안 무료 체험이 시작됩니다.')) return;
        } else {
            if (!confirm('이미 무료 체험을 사용하셨습니다. 사이트를 게시하려면 결제가 필요합니다.\n지금 결제하시겠습니까?')) return;
            handlePayment(); // Open payment modal
            return;
        }

        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { error } = await supabase
            .from('sites')
            .update({
                status: 'active',
                expires_at: expiresAt,
                published_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            alert('게시 실패: ' + error.message);
        } else {
            // Mark trial as used
            await supabase.from('profiles').upsert({ id: user.id, has_used_trial: true });
            alert('사이트가 성공적으로 게시되었습니다! 1개월 무료 체험이 시작됩니다.');
            window.location.reload();
        }
    };

    // Draft Logic: Block Visitors, Show Publish Screen to Owners
    if (data?.status === 'draft') {
        if (!canManage) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Construction className="w-10 h-10 text-gray-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">사이트 준비 중</h1>
                        <p className="text-gray-500 mb-8">
                            현재 사이트 제작이 진행 중입니다.<br />
                            완성된 모습으로 곧 찾아뵙겠습니다!
                        </p>
                        <Link href="/" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition">
                            SimpleSite 홈으로 이동
                        </Link>
                    </div>
                </div>
            );
        }

        // Owner View
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full text-center border border-blue-100">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                        <Globe className="w-10 h-10 text-blue-500" />
                        <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 border-4 border-white">
                            <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">사이트 제작이 완료되었습니다!</h1>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        현재 사이트는 <strong>비공개(Draft)</strong> 상태입니다.<br />
                        [사이트 게시하기] 버튼을 누르면 즉시 공개되며,<br />
                        <span className="text-blue-600 font-bold">1개월 무료 체험</span>이 시작됩니다.
                    </p>

                    <div className="bg-blue-50 p-6 rounded-2xl mb-8 text-left">
                        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <Clock size={18} /> 게시 전 체크리스트
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-center gap-2">✓ 오타나 틀린 정보는 없나요?</li>
                            <li className="flex items-center gap-2">✓ 연락처와 지도가 정확한가요?</li>
                            <li className="flex items-center gap-2">✓ 게시 후에는 링크를 공유할 수 있습니다.</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handlePublish}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
                        >
                            사이트 게시하기 (1개월 시작 🚀)
                        </button>
                        <Link href={`/build?edit=${id}`} className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 transition">
                            내용 다시 수정하기
                        </Link>
                    </div>
                </div>
            </div>
        );
    }


    // Extract needed data
    const { section_titles, google_map, font_family } = data;

    // Default section titles
    const titles = {
        about: section_titles?.about || 'About Us',
        menu: section_titles?.menu || 'Menu / Portfolio',
        reviews: section_titles?.reviews || 'Customer Reviews',
        contact: section_titles?.contact || 'Contact & Location',
        qna: section_titles?.qna || 'Q&A'
    };

    // Google Fonts import
    const fontLink = font_family && font_family !== 'Inter'
        ? `https://fonts.googleapis.com/css2?family=${font_family.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`
        : null;


    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-gray-200" style={{ fontFamily: font_family || 'Inter, sans-serif' }}>
            {fontLink && (
                <link rel="stylesheet" href={fontLink} />
            )}

            {/* User Custom GA (Only if different from global admin GA) */}
            {data?.google_analytics_id && data.google_analytics_id !== 'G-PZ73QVCM4J' && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${data.google_analytics_id}`}
                        strategy="afterInteractive"
                    />
                    <Script id="user-google-analytics" strategy="afterInteractive">
                        {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${data.google_analytics_id}');
                        `}
                    </Script>
                </>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative animate-fadeIn">
                        <button
                            onClick={() => setShowPaymentModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">프리미엄 멤버십 업그레이드</h2>
                            <p className="text-gray-500">1년 동안 제한 없이 홈페이지를 운영하세요!</p>
                        </div>

                        {/* Product Info */}
                        <div className="bg-gray-50 p-4 rounded-xl mb-6 flex justify-between items-center border border-gray-100">
                            <span className="font-medium text-gray-700">1년 이용권</span>
                            <span className="font-bold text-gray-900">9,900원</span>
                        </div>

                        {/* Coupon Section */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">쿠폰 코드</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="쿠폰 번호를 입력하세요"
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                />
                                <button
                                    onClick={verifyCoupon}
                                    className="bg-gray-800 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-900 transition whitespace-nowrap"
                                >
                                    적용
                                </button>
                            </div>
                            {couponMessage && <p className={`text-sm ${isCouponApplied ? 'text-green-600 font-medium' : 'text-red-500'}`}>{couponMessage}</p>}
                        </div>

                        {/* Refund Policy Notice */}
                        <div className="bg-blue-50 p-4 rounded-xl mb-6">
                            <h5 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> 혜택: 남은 체험기간 + 1년 증정
                            </h5>
                            <ul className="text-xs text-blue-800 space-y-1 ml-1 list-disc list-inside leading-relaxed">
                                <li>지금 결제해도 <b>남은 체험 기간이 사라지지 않고</b> 1년 뒤로 연장됩니다.</li>
                                <li>결제일로부터 13일 이내: <span className="font-bold underline">100% 무상 환불</span></li>
                            </ul>
                        </div>

                        <div className="border-t border-gray-100 pt-6 mb-8">
                            <div className="flex justify-between text-gray-500 mb-2">
                                <span>상품 금액</span>
                                <span>9,900원</span>
                            </div>
                            {isCouponApplied && (
                                <div className="flex justify-between text-green-600 mb-2">
                                    <span>쿠폰 할인</span>
                                    <span>- {discountAmount.toLocaleString()}원</span>
                                </div>
                            )}
                            <div className="flex justify-between items-end mt-4">
                                <span className="text-lg font-bold text-gray-900">최종 결제 금액</span>
                                <span className="text-3xl font-bold text-blue-600">{finalPrice.toLocaleString()}원</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePayment}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 ${finalPrice === 0
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                                : 'bg-[#FAE100] text-[#3b1e1e] hover:bg-[#F7D600]'
                                }`}
                        >
                            {finalPrice === 0 ? "무료로 시작하기" : "카카오페이로 3초 만에 결제"}
                        </button>
                    </div>
                </div>
            )}

            {/* Premium Status now shown in footer instead of top banner */}

            {/* Trial Timer Banner */}
            {/* Premium Status now shown in footer instead of top banner */}

            {/* Header */}
            <header className={`fixed w-full top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100`}>
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {data?.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={data.logo_url} alt={name} className="h-10 w-auto object-contain" />
                        ) : null}
                        <h1 className="text-xl font-bold tracking-tight">{name}</h1>
                    </div>
                    <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
                        <a href="#" className="hover:text-black transition">{section_titles?.about || '소개'}</a>
                        {portfolio.length > 0 && <a href="#menu" className="hover:text-black transition">{section_titles?.menu || '메뉴/상품'}</a>}
                        {reviews.length > 0 && <a href="#reviews" className="hover:text-black transition">{section_titles?.reviews || '후기'}</a>}
                        <a href="#contact" className="hover:text-black transition">{section_titles?.contact || '연락처'}</a>
                    </nav>
                </div>
            </header>

            <main>
                {/* Dynamic Section Rendering */}
                {(() => {
                    const order = data?.section_order || ['hero', 'about', 'menu', 'reviews', 'qna', 'contact'];

                    // Render Functions for each section
                    const renderSection = (section: string) => {
                        switch (section) {
                            case 'hero':
                                const heroHeightClass = hero_height === 'small' ? 'min-h-[50vh]' : hero_height === 'medium' ? 'min-h-[75vh]' : 'min-h-screen';
                                return (
                                    <section key="hero" className={`relative flex flex-col items-center justify-center text-center px-6 overflow-hidden ${heroHeightClass}`} style={sectionStyle}>
                                        {hero_image_url && (
                                            <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url(${hero_image_url})` }} />
                                        )}
                                        <div className="absolute inset-0 bg-black z-10" style={{ opacity: overlayOpacity }} />
                                        <div className="relative z-20 max-w-4xl mx-auto text-white">
                                            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight drop-shadow-lg">{slogan}</h2>
                                            {description && (
                                                <p className="text-xl md:text-2xl opacity-90 font-light max-w-2xl mx-auto mb-10 drop-shadow-md">
                                                    {description.slice(0, 60)}...
                                                </p>
                                            )}
                                        </div>
                                    </section>
                                );
                            case 'about':
                                return description ? (
                                    <section key="about" className="py-24 px-6">
                                        <div className="max-w-3xl mx-auto text-center">
                                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 block">{titles.about}</span>
                                            <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">{description}</p>
                                        </div>
                                    </section>
                                ) : null;
                            case 'menu':
                                const isPortrait = portfolio_mode === 'portrait';
                                return portfolio && portfolio.length > 0 ? (
                                    <section key="menu" id="menu" className="py-24 bg-gray-50 overflow-hidden">
                                        <div className="max-w-6xl mx-auto px-6">
                                            <h3 className="text-3xl font-bold mb-12 text-center">{titles.menu}</h3>
                                            {isPortrait ? (
                                                <div className="flex flex-col gap-16">
                                                    {portfolio.map((item: { title: string; desc: string; image_url: string }, idx: number) => (
                                                        <div key={idx} className="w-full bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition group">
                                                            {item.image_url ? (
                                                                <div
                                                                    className="w-full cursor-pointer relative"
                                                                    onClick={() => setLightboxImage(item.image_url)}
                                                                >
                                                                    <img
                                                                        src={item.image_url}
                                                                        alt={item.title}
                                                                        className="w-full h-auto object-contain max-h-[1200px]"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition duration-300 flex items-center justify-center">
                                                                        <div className="opacity-0 group-hover:opacity-100 bg-white/90 text-gray-900 px-4 py-2 rounded-full font-bold shadow-sm transform translate-y-4 group-hover:translate-y-0 transition">
                                                                            크게 보기
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400">
                                                                    <span className="text-sm">이미지 없음</span>
                                                                </div>
                                                            )}
                                                            <div className="p-8">
                                                                <h4 className="font-bold text-2xl mb-3 text-gray-900">{item.title}</h4>
                                                                <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">{item.desc}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scrollbar-hide">
                                                    {portfolio.map((item: { title: string; desc: string; image_url: string }, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className="min-w-[300px] md:min-w-[400px] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group snap-center flex-shrink-0"
                                                        >
                                                            {item.image_url ? (
                                                                <div
                                                                    className="h-64 overflow-hidden bg-gray-200 cursor-pointer flex items-center justify-center"
                                                                    onClick={() => setLightboxImage(item.image_url)}
                                                                >
                                                                    <img
                                                                        src={item.image_url}
                                                                        alt={item.title}
                                                                        className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400"><span className="text-sm">이미지 없음</span></div>
                                                            )}
                                                            <div className="p-6">
                                                                <h4 className="font-bold text-xl mb-2">{item.title}</h4>
                                                                <p className="text-gray-600 text-sm line-clamp-3">{item.desc}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {!isPortrait && <p className="text-center text-gray-400 text-sm mt-4 md:hidden">좌우로 넘겨보세요</p>}
                                        </div>
                                    </section>
                                ) : null;
                            case 'reviews':
                                return reviews && reviews.length > 0 ? (
                                    <section key="reviews" id="reviews" className="py-24 px-6 bg-white">
                                        <div className="max-w-5xl mx-auto">
                                            <h3 className="text-3xl font-bold mb-12 text-center">{titles.reviews}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {reviews.map((review: { id: string; name: string; content: string; rating: number; avatar_url?: string; date?: string }, idx: number) => (
                                                    <div key={idx} className="p-8 bg-gray-50 rounded-2xl relative border border-gray-100">
                                                        <Quote className="text-blue-200 mb-4 absolute top-6 right-6" size={40} />
                                                        <div className="flex gap-1 mb-4">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={16} className={`${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                            ))}
                                                        </div>
                                                        <p className="text-gray-700 mb-6 leading-relaxed">&quot;{review.content}&quot;</p>
                                                        <div className="border-t border-gray-200 pt-4 flex items-center gap-3">
                                                            {review.avatar_url ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={review.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-lg">👤</div>
                                                            )}
                                                            <div>
                                                                <p className="font-bold text-gray-900 text-sm">{review.name}</p>
                                                                {review.date && <p className="text-xs text-gray-500">{review.date}</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                ) : null;
                            case 'qna':
                                return activeAddons.includes('qna') ? <QnABoard key="qna" siteId={id} canManage={canManage} title={titles.qna} /> : null;
                            case 'contact':
                                return (
                                    <section key="contact" id="contact" className="py-24 px-6 lg:pb-32 bg-gray-50">
                                        <div className="max-w-4xl mx-auto text-center">
                                            <h3 className="text-3xl font-bold mb-12">{titles.contact}</h3>
                                            {(social_links.instagram || social_links.facebook || social_links.blog || social_links.youtube || social_links.tiktok || social_links.threads || social_links.email) && (
                                                <div className="flex justify-center gap-8 mb-12 flex-wrap">
                                                    {social_links.instagram && (
                                                        <a href={social_links.instagram} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                                                            <div className="p-3 bg-white rounded-full shadow group-hover:text-pink-600 transition"><Instagram /></div>
                                                            <span className="text-xs font-medium text-gray-500">Instagram</span>
                                                        </a>
                                                    )}
                                                    {social_links.facebook && (
                                                        <a href={social_links.facebook} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                                                            <div className="p-3 bg-white rounded-full shadow group-hover:text-blue-600 transition"><Facebook /></div>
                                                            <span className="text-xs font-medium text-gray-500">Facebook</span>
                                                        </a>
                                                    )}
                                                    {social_links.blog && (
                                                        <a href={social_links.blog} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                                                            <div className="p-3 bg-white rounded-full shadow group-hover:text-green-600 transition"><MessageCircle /></div>
                                                            <span className="text-xs font-medium text-gray-500">Blog</span>
                                                        </a>
                                                    )}
                                                    {social_links.youtube && (
                                                        <a href={social_links.youtube} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                                                            <div className="p-3 bg-white rounded-full shadow group-hover:text-red-600 transition"><Youtube /></div>
                                                            <span className="text-xs font-medium text-gray-500">YouTube</span>
                                                        </a>
                                                    )}
                                                    {social_links.tiktok && (
                                                        <a href={social_links.tiktok} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                                                            <div className="p-3 bg-white rounded-full shadow group-hover:text-black transition">
                                                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-500">TikTok</span>
                                                        </a>
                                                    )}
                                                    {social_links.threads && (
                                                        <a href={social_links.threads} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                                                            <div className="p-3 bg-white rounded-full shadow group-hover:text-black transition">
                                                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-2-2-2-5 0-7s4-2 6 0"></path><path d="M12 12c2 2 2 5 0 7s-4 2-6 0"></path><path d="M12 12c-2 2-5 2-7 0s-2-4 0-6"></path><path d="M12 12c2-2 5-2 7 0s2 4 0 6"></path></svg>
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-500">Threads</span>
                                                        </a>
                                                    )}
                                                    {social_links.email && (
                                                        <a href={`mailto:${social_links.email}`} className="flex flex-col items-center gap-2 group">
                                                            <div className="p-3 bg-white rounded-full shadow group-hover:text-gray-600 transition"><Mail /></div>
                                                            <span className="text-xs font-medium text-gray-500">Email</span>
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-2xl mx-auto mb-12">
                                                {phones.length > 0 && (
                                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                                        <Phone className="mb-4 text-gray-400" size={32} />
                                                        <h4 className="font-bold text-lg mb-2">Phone</h4>
                                                        <div className="space-y-1">{phones.map((p, i) => <p key={i} className="text-xl font-semibold">{p}</p>)}</div>
                                                    </div>
                                                )}
                                                {address && (
                                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                                        <MapPin className="mb-4 text-gray-400" size={32} />
                                                        <h4 className="font-bold text-lg mb-2">Location</h4>
                                                        <p className="text-lg font-medium break-keep">{address}</p>
                                                    </div>
                                                )}
                                            </div>
                                            {(map_links?.naver || map_links?.kakao || google_map) && (
                                                <div className="flex flex-col items-center gap-6 mb-12 w-full">
                                                    <div className="flex justify-center gap-4 flex-wrap">
                                                        {map_links.naver && <a href={map_links.naver} target="_blank" rel="noopener noreferrer" className="bg-[#03C75A] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition flex items-center gap-2">N 네이버 지도</a>}
                                                        {map_links.kakao && <a href={map_links.kakao} target="_blank" rel="noopener noreferrer" className="bg-[#FAE100] text-[#3b1e1e] px-6 py-3 rounded-xl font-bold hover:opacity-90 transition flex items-center gap-2">K 카카오맵</a>}
                                                        {google_map && <a href={google_map} target="_blank" rel="noopener noreferrer" className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition flex items-center gap-2"><Globe size={18} /> 구글 지도</a>}
                                                    </div>
                                                    {/* Only show map iframe if we have an embeddable URL */}
                                                    {(map_links.naver || map_links.kakao || google_map?.includes('/embed')) && (
                                                        <div className="w-full max-w-4xl h-96 bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200">
                                                            {map_links.naver ? <iframe src={map_links.naver} className="w-full h-full border-0" title="Map" allowFullScreen /> :
                                                                map_links.kakao ? <iframe src={map_links.kakao} className="w-full h-full border-0" title="Map" allowFullScreen /> :
                                                                    google_map?.includes('/embed') ? <iframe src={google_map} className="w-full h-full border-0" title="Map" allowFullScreen /> : null}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                );
                            default:
                                return null;
                        }
                    };

                    return order.map(section => renderSection(section));
                })()}
            </main>

            {/* Actions - Only show for site owner in edit mode */}
            {canManage && isEditMode && (
                <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-50">
                    {/* Payment button removed as per user request */}

                    <a
                        href={`/build?edit=${id}`}
                        className="bg-black/80 hover:bg-black text-white p-4 rounded-full shadow-lg backdrop-blur transition transform hover:scale-110"
                        title="수정하기"
                    >
                        <Edit size={24} />
                    </a>
                </div>
            )}

            {/* Lightbox Modal for Image Expansion */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Expanded view"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <footer className="bg-gray-50 py-12 border-t border-gray-200">
                <div className="container mx-auto text-center text-gray-500 text-sm">
                    &copy; 2026 {name}. All rights reserved.
                    {/* Logo in footer with 50% opacity */}
                    {data?.logo_url && (
                        <div className="mt-6 opacity-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={data.logo_url} alt={name} className="h-12 mx-auto object-contain" />
                        </div>
                    )}
                </div>
                {/* Viral Loop: Powered by Banner for Free Users */}
                {!isPaid && (
                    <div className="mt-8 text-center pb-8 animate-bounce-subtle">
                        <a
                            href="https://simplesite.com" // Replace with actual landing page URL
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-white/80 hover:bg-white backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-100 transition transform hover:-translate-y-1 group"
                        >
                            <span className="text-xs font-medium text-gray-500 group-hover:text-gray-900">Powered by</span>
                            <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">SimpleSite</span>
                        </a>
                    </div>
                )}
            </footer>
            {/* Ownership badge as blue bar at 70% opacity */}
            {/* Ownership banner removed as per user request */}
        </div>
    );
}
