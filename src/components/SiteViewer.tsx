'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Phone, MapPin, Edit, Star, Quote, Instagram, Facebook, Youtube, MessageCircle, Clock, AlertTriangle } from 'lucide-react';

type SiteData = {
    name: string;
    slogan: string;
    description: string;
    phone: string;
    address: string;
    color: string;
    hero_opacity: number;
    hero_image_url: string;
    map_links: { naver?: string; kakao?: string };
    social_links?: { instagram?: string; facebook?: string; blog?: string; tiktok?: string; youtube?: string; email?: string };
    reviews?: { id: string; name: string; content: string; rating: number }[];
    portfolio: { title: string; desc: string; image_url: string }[];
    expires_at?: string;
    is_paid?: boolean;
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

    const verifyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponMessage('쿠폰 코드를 입력해주세요.');
            return;
        }

        try {
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

    const handlePayment = async () => {
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
                        expires_at: oneYearLater.toISOString()
                    })
                    .eq('id', id);

                if (updateError) throw updateError;

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

            const paymentId = `PAY-${id}-${Date.now()}`;

            const response = await PortOne.requestPayment({
                storeId: storeId,
                channelKey: channelKey,
                paymentId: paymentId,
                orderName: "1년 이용권 (Premium)",
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
            if (response && response.code !== undefined) {
                if (response.code != null) {
                    // Payment failed or cancelled logic if SDK returns immediately (depends on browser environment)
                    // But V2 usually redirects or returns a promise for non-redirect methods.
                    // For simply redirectUrl configured, it might not return here if redirected.
                    // If it returns an error here:
                    console.error("Payment error:", response);
                    alert(`결제 처리 중 오류가 발생했습니다: ${response.message || "알 수 없는 오류"}`);
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

    // Expired site blocking screen
    if (isExpired && !isPaid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md text-center w-full">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">체험 시간이 만료되었습니다</h1>
                    <p className="text-gray-500 mb-8">
                        5시간 무료 체험이 종료되었습니다.<br />
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
    } = data;

    const overlayOpacity = hero_opacity / 100;
    const phones = (phone || '').split('|').map((p: string) => p.trim()).filter(Boolean);

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-gray-200">
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

            {/* Premium Status Banner */}
            {isPaid && expiresAt && (
                <div className="fixed top-0 left-0 right-0 bg-blue-600/90 backdrop-blur-md text-white py-2 px-6 text-center text-sm font-medium z-[60] shadow-sm flex justify-center items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <span>프리미엄 멤버십 이용 중</span>
                    <span className="opacity-75 mx-1">|</span>
                    <span className="opacity-90">만료일: {new Date(expiresAt).toLocaleDateString()}</span>
                    <span className="bg-blue-500 px-2 py-0.5 rounded text-xs ml-2">
                        D-{Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                    </span>
                </div>
            )}

            {/* Trial Timer Banner */}
            {!isPaid && timeLeft && (
                <div className="fixed top-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md text-white py-3 px-6 text-center text-sm font-medium z-[60] shadow-md flex justify-center items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span className="text-gray-300">무료 체험 종료까지:</span>
                        <span className="font-mono font-bold text-orange-400 text-base tabular-nums">{timeLeft}</span>
                    </div>
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="bg-white text-gray-900 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition shadow-sm"
                    >
                        지금 결제하고 평생 소장하기
                    </button>
                </div>
            )}

            {/* Header */}
            <header className={`fixed w-full ${!isPaid && timeLeft ? 'top-10' : 'top-0'} bg-white/80 backdrop-blur-md z-50 border-b border-gray-100`}>
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight">{name}</h1>
                    <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
                        <a href="#" className="hover:text-black transition">소개</a>
                        {portfolio.length > 0 && <a href="#menu" className="hover:text-black transition">메뉴/상품</a>}
                        {reviews.length > 0 && <a href="#reviews" className="hover:text-black transition">후기</a>}
                        <a href="#contact" className="hover:text-black transition">연락처</a>
                    </nav>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section
                    className="relative h-[80vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden"
                    style={{ backgroundColor: color }}
                >
                    {hero_image_url && (
                        <div
                            className="absolute inset-0 bg-cover bg-center z-0"
                            style={{ backgroundImage: `url(${hero_image_url})` }}
                        />
                    )}
                    <div className="absolute inset-0 bg-black z-10" style={{ opacity: overlayOpacity }} />

                    <div className="relative z-20 max-w-4xl mx-auto text-white">
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight drop-shadow-lg">
                            {slogan}
                        </h2>
                        {description && (
                            <p className="text-xl md:text-2xl opacity-90 font-light max-w-2xl mx-auto mb-10 drop-shadow-md">
                                {description.slice(0, 60)}...
                            </p>
                        )}
                        <div className="h-4"></div>
                    </div>
                </section>

                {/* About Section */}
                {description && (
                    <section className="py-24 px-6">
                        <div className="max-w-3xl mx-auto">
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 block">About Us</span>
                            <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {description}
                            </p>
                        </div>
                    </section>
                )}

                {/* Portfolio / Menu Section (Carousel) */}
                {portfolio && portfolio.length > 0 && (
                    <section id="menu" className="py-24 bg-gray-50 overflow-hidden">
                        <div className="max-w-6xl mx-auto px-6">
                            <h3 className="text-3xl font-bold mb-12 text-center">Menu / Portfolio</h3>

                            {/* Carousel Container */}
                            <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scrollbar-hide">
                                {portfolio.map((item: { title: string; desc: string; image_url: string }, idx: number) => (
                                    <div key={idx} className="min-w-[300px] md:min-w-[350px] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group snap-center flex-shrink-0">
                                        {item.image_url ? (
                                            <div className="h-64 overflow-hidden bg-gray-200">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={item.image_url}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                                                <span className="text-sm">이미지 없음</span>
                                            </div>
                                        )}
                                        <div className="p-6">
                                            <h4 className="font-bold text-xl mb-2">{item.title}</h4>
                                            <p className="text-gray-600 text-sm line-clamp-3">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-center text-gray-400 text-sm mt-4 md:hidden">좌우로 넘겨보세요</p>
                        </div>
                    </section>
                )}

                {/* Reviews Section */}
                {reviews && reviews.length > 0 && (
                    <section id="reviews" className="py-24 px-6 bg-white">
                        <div className="max-w-5xl mx-auto">
                            <h3 className="text-3xl font-bold mb-12 text-center">Customer Reviews</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {reviews.map((review: { id: string; name: string; content: string; rating: number }, idx: number) => (
                                    <div key={idx} className="p-8 bg-gray-50 rounded-2xl relative border border-gray-100">
                                        <Quote className="text-blue-200 mb-4 absolute top-6 right-6" size={40} />
                                        <div className="flex gap-1 mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={16} className={`${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                        <p className="text-gray-700 mb-6 leading-relaxed">&quot;{review.content}&quot;</p>
                                        <p className="font-bold text-gray-900 border-t border-gray-200 pt-4 text-sm">{review.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Contact / CTA Section */}
                <section id="contact" className="py-24 px-6 lg:pb-32 bg-gray-50">
                    <div className="max-w-4xl mx-auto text-center">
                        <h3 className="text-3xl font-bold mb-12">Contact & Location</h3>

                        {/* Social Links */}
                        {(social_links.instagram || social_links.facebook || social_links.blog || social_links.youtube) && (
                            <div className="flex justify-center gap-6 mb-12">
                                {social_links.instagram && (
                                    <a href={social_links.instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-full shadow hover:text-pink-600 transition"><Instagram /></a>
                                )}
                                {social_links.facebook && (
                                    <a href={social_links.facebook} target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-full shadow hover:text-blue-600 transition"><Facebook /></a>
                                )}
                                {social_links.blog && (
                                    <a href={social_links.blog} target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-full shadow hover:text-green-600 transition"><MessageCircle /></a>
                                )}
                                {social_links.youtube && (
                                    <a href={social_links.youtube} target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-full shadow hover:text-red-600 transition"><Youtube /></a>
                                )}
                                {social_links.email && (
                                    <a href={`mailto:${social_links.email}`} className="p-3 bg-white rounded-full shadow hover:text-gray-600 transition"><MessageCircle /></a>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-2xl mx-auto mb-12">
                            {phones.length > 0 && (
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                    <Phone className="mb-4 text-gray-400" size={32} />
                                    <h4 className="font-bold text-lg mb-2">Phone</h4>
                                    <div className="space-y-1">
                                        {phones.map((p, i) => (
                                            <p key={i} className="text-xl font-semibold">{p}</p>
                                        ))}
                                    </div>
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

                        {/* Map Links & Iframe */}
                        {(map_links?.naver || map_links?.kakao) && (
                            <div className="flex flex-col items-center gap-6 mb-12 w-full">
                                <div className="flex justify-center gap-4">
                                    {map_links.naver && (
                                        <a href={map_links.naver} target="_blank" rel="noopener noreferrer" className="bg-[#03C75A] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition flex items-center gap-2">
                                            N 네이버 지도
                                        </a>
                                    )}
                                    {map_links.kakao && (
                                        <a href={map_links.kakao} target="_blank" rel="noopener noreferrer" className="bg-[#FAE100] text-[#3b1e1e] px-6 py-3 rounded-xl font-bold hover:opacity-90 transition flex items-center gap-2">
                                            K 카카오맵
                                        </a>
                                    )}
                                </div>
                                <div className="w-full max-w-4xl h-96 bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200">
                                    {map_links.naver ? (
                                        <iframe src={map_links.naver} className="w-full h-full border-0" title="Naver Map" allowFullScreen />
                                    ) : map_links.kakao ? (
                                        <iframe src={map_links.kakao} className="w-full h-full border-0" title="Kakao Map" allowFullScreen />
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Actions */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-50">
                <button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-[#3182F6] hover:bg-[#1b64da] text-white p-4 rounded-full shadow-lg backdrop-blur transition transform hover:scale-110 group flex items-center gap-2"
                    title="결제 및 게시"
                >
                    <span className="font-bold hidden group-hover:block whitespace-nowrap">결제 & 사이트 게시 (9,900원)</span>
                    <Star size={24} className="fill-white" />
                </button>

                <a
                    href={`/build?edit=${id}`}
                    className="bg-black/80 hover:bg-black text-white p-4 rounded-full shadow-lg backdrop-blur transition transform hover:scale-110"
                    title="수정하기"
                >
                    <Edit size={24} />
                </a>
            </div>

            <footer className="bg-gray-50 py-12 border-t border-gray-200">
                <div className="container mx-auto text-center text-gray-500 text-sm">
                    &copy; 2026 {name}. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
