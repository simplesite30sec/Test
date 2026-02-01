'use client';

import { useEffect, useState, useRef } from 'react';
import { Phone, MapPin, Edit, Star, Quote, Instagram, Facebook, Youtube, MessageCircle } from 'lucide-react';
import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";

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
};

export default function SiteViewer({ initialData, id }: { initialData: SiteData | null, id: string }) {
    const [data, setData] = useState<SiteData | null>(initialData);
    const [loading, setLoading] = useState(!initialData);
    // const [paymentWidget, setPaymentWidget] = useState<PaymentWidgetInstance | null>(null);
    const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);

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

    useEffect(() => {
        (async () => {
            const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";
            const customerKey = "ANONYMOUS";
            try {
                const loadedWidget = await loadPaymentWidget(clientKey, customerKey);
                paymentWidgetRef.current = loadedWidget;
                // setPaymentWidget(loadedWidget);
            } catch (error) {
                console.error("Failed to load payment widget:", error);
            }
        })();
    }, []);

    const handlePayment = async () => {
        if (!paymentWidgetRef.current) {
            alert("결제 시스템을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        try {
            await paymentWidgetRef.current.requestPayment({
                orderId: `ORDER_${id}_${Date.now()}`,
                orderName: "1년 이용권 (Premium)",
                customerName: data?.name || "고객",
                customerEmail: "customer@example.com",
                successUrl: `${window.location.origin}/payment/success?id=${id}`,
                failUrl: `${window.location.origin}/payment/fail`,
            });
        } catch (error) {
            console.error("Payment request failed:", error);
            alert("결제가 취소되었거나 실패했습니다.");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
    if (!data) return <div className="min-h-screen flex items-center justify-center">사이트를 찾을 수 없습니다. (로컬 저장소 확인 중...)</div>;

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
    const phones = (phone || '').split('|').map(p => p.trim()).filter(Boolean);

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-gray-200">
            {/* Header */}
            <header className="fixed w-full top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
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
                                {reviews.map((review, idx) => (
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
                    onClick={handlePayment}
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
                <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>© 2024 {name}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
