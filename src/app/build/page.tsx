'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, MousePointerClick, Palette, Phone, MapPin, FileText, Image as ImageIcon, Sliders, Plus, Trash2, Globe, Instagram, Facebook, Youtube, MessageCircle, Star, LogOut, LayoutDashboard, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

type PortfolioItem = {
    id: string;
    title: string;
    desc: string;
    imageUrl?: string;
    file?: File;
};

type ReviewItem = {
    id: string;
    name: string;
    content: string;
    rating: number;
};

function HomeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    // Auth Check
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);
            setAuthLoading(false);
        };
        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.push('/login');
            } else if (session?.user) {
                setUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const [formData, setFormData] = useState({
        name: '',
        slogan: '',
        description: '',
        phone: '',
        address: '',
        color: '#000000',
        heroOpacity: 50,
        naverMap: '',
        kakaoMap: '',
        googleMap: '',
        phone2: '',
        phone3: '',
    });
    const [heroImage, setHeroImage] = useState<File | null>(null);
    const [heroImageUrl, setHeroImageUrl] = useState<string>('');

    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [socialLinks, setSocialLinks] = useState({
        instagram: '',
        facebook: '',
        blog: '',
        tiktok: '',
        youtube: '',
        email: ''
    });

    // Section Titles State
    const [sectionTitles, setSectionTitles] = useState({
        about: 'About Us',
        menu: 'Menu / Portfolio',
        reviews: 'Customer Reviews',
        contact: 'Contact & Location',
        inquiry: '문의하기',
        qna: 'Q&A'
    });

    // Font Selection State
    const [fontFamily, setFontFamily] = useState('Inter');
    const FONT_OPTIONS = [
        { value: 'Inter', label: 'Inter (기본)' },
        { value: 'Noto Sans KR', label: 'Noto Sans KR (한글)' },
        { value: 'Nanum Gothic', label: '나눔고딕' },
        { value: 'Nanum Myeongjo', label: '나눔명조' },
        { value: 'Roboto', label: 'Roboto' },
        { value: 'Open Sans', label: 'Open Sans' },
        { value: 'Montserrat', label: 'Montserrat' },
    ];

    // Section Order State
    const [sectionOrder, setSectionOrder] = useState<string[]>(['hero', 'about', 'menu', 'reviews', 'qna', 'inquiry', 'contact']);
    const SECTION_LABELS: Record<string, string> = {
        hero: '메인(Hero) 섹션',
        about: '소개(About) 섹션',
        menu: '메뉴/포트폴리오',
        reviews: '고객 후기',
        qna: 'Q&A 게시판 (애드온)',
        inquiry: '문의하기 폼 (애드온)',
        contact: '연락처/지도'
    };

    const [isPaid, setIsPaid] = useState(false);

    // Load Data
    useEffect(() => {
        if (editId) {
            const loadData = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('sites')
                    .select('*')
                    .eq('id', editId)
                    .single();

                let siteData = data;

                if (error || !data) {
                    const localData = localStorage.getItem(`site_${editId}`);
                    if (localData) {
                        siteData = JSON.parse(localData);
                    }
                }

                if (siteData) {
                    setIsPaid(siteData.is_paid || false);
                    if (siteData.section_order) setSectionOrder(siteData.section_order as string[]);
                    if (siteData.section_titles) setSectionTitles(siteData.section_titles as typeof sectionTitles);
                    if (siteData.font_family) setFontFamily(siteData.font_family);

                    // Parse Phones
                    const phoneParts = (siteData.phone || '').split('|').map((s: string) => s.trim());

                    setFormData({
                        name: siteData.name || '',
                        slogan: siteData.slogan || '',
                        description: siteData.description || '',
                        phone: phoneParts[0] || '',
                        phone2: phoneParts[1] || '',
                        phone3: phoneParts[2] || '',
                        address: siteData.address || '',
                        color: siteData.color || '#000000',
                        heroOpacity: siteData.hero_opacity ?? 50,
                        naverMap: siteData.map_links?.naver || '',
                        kakaoMap: siteData.map_links?.kakao || '',
                        googleMap: siteData.google_map || '',
                    });
                    setHeroImageUrl(siteData.hero_image_url || '');

                    if (siteData.social_links) {
                        setSocialLinks({
                            instagram: siteData.social_links.instagram || '',
                            facebook: siteData.social_links.facebook || '',
                            blog: siteData.social_links.blog || '',
                            tiktok: siteData.social_links.tiktok || '',
                            youtube: siteData.social_links.youtube || '',
                            email: siteData.social_links.email || '',
                        });
                    }

                    if (siteData.reviews && Array.isArray(siteData.reviews)) {
                        setReviews(siteData.reviews);
                    }

                    if (siteData.portfolio && Array.isArray(siteData.portfolio)) {
                        setPortfolio(siteData.portfolio.map((item: { title: string; desc: string; image_url?: string }) => ({
                            id: crypto.randomUUID(),
                            title: item.title,
                            desc: item.desc,
                            imageUrl: item.image_url
                        })));
                    }
                }
                setLoading(false);
            };
            loadData();
        }
    }, [editId]);

    // ... Handlers ...

    // (Skipping redundant handler code duplication logic by using specific chunks for the rest)


    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSocialLinks(prev => ({ ...prev, [name]: value }));
    };

    const validateImage = (file: File) => {
        const MAX_SIZE = 2 * 1024 * 1024; // 2MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            alert(`JPG, PNG 파일만 업로드 가능합니다.\n(현재 파일: ${file.name})`);
            return false;
        }
        if (file.size > MAX_SIZE) {
            alert(`이미지 크기는 2MB 이하여야 합니다.`);
            return false;
        }
        return true;
    };

    const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateImage(file)) {
                setHeroImage(file);
                const reader = new FileReader();
                reader.onload = (e) => setHeroImageUrl(e.target?.result as string);
                reader.readAsDataURL(file);
            } else {
                e.target.value = '';
            }
        }
    };

    // Portfolio Handlers
    const addPortfolioItem = () => setPortfolio([...portfolio, { id: crypto.randomUUID(), title: '', desc: '' }]);
    const removePortfolioItem = (id: string) => setPortfolio(portfolio.filter(item => item.id !== id));
    const updatePortfolioItem = (id: string, field: keyof PortfolioItem, value: string | File) => {
        setPortfolio(portfolio.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    // Review Handlers
    const addReview = () => setReviews([...reviews, { id: crypto.randomUUID(), name: '', content: '', rating: 5 }]);
    const removeReview = (id: string) => setReviews(reviews.filter(r => r.id !== id));
    const updateReview = (id: string, field: keyof ReviewItem, value: string | number) => {
        setReviews(reviews.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    // Upload Logic
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const uploadFile = async (file: File) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;
            const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (e) { throw e; }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalHeroImageUrl = heroImageUrl;
            if (heroImage) {
                try { finalHeroImageUrl = await uploadFile(heroImage); }
                catch { console.warn("Supabase upload failed."); }
            }

            const portfolioWithImages = await Promise.all(portfolio.map(async (item) => {
                let itemImageUrl = item.imageUrl || '';
                if (item.file) {
                    try { itemImageUrl = await uploadFile(item.file); }
                    catch { console.warn("Supabase portfolio upload failed."); }
                }
                return { title: item.title, desc: item.desc, image_url: itemImageUrl }
            }));

            // Combine phones
            const phones = [formData.phone, formData.phone2, formData.phone3].filter(p => p.trim() !== '').join('|');

            // Calculate expiration time (5 hours from now)
            const expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();

            const siteData = {
                name: formData.name,
                slogan: formData.slogan,
                description: formData.description,
                phone: phones,
                address: formData.address,
                color: formData.color,
                hero_opacity: formData.heroOpacity,
                hero_image_url: finalHeroImageUrl,
                map_links: { naver: formData.naverMap, kakao: formData.kakaoMap },
                google_map: formData.googleMap,
                social_links: socialLinks, // includes email
                reviews: reviews,
                portfolio: portfolioWithImages,
                section_order: sectionOrder,
                section_titles: sectionTitles,
                font_family: fontFamily
            };

            try {
                let resultId = editId;
                if (editId) {
                    const { error } = await supabase.from('sites').update(siteData).eq('id', editId);
                    if (error) throw error;
                } else {
                    // Check site limit (Max 10)
                    const { count } = await supabase
                        .from('sites')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', user?.id);

                    if (count !== null && count >= 10) {
                        alert('계정당 최대 10개의 사이트만 생성할 수 있습니다.');
                        setLoading(false);
                        return;
                    }

                    // New site: add trial fields
                    const newSiteData = {
                        ...siteData,
                        user_id: user?.id,
                        expires_at: expiresAt,
                        is_paid: false,
                    };
                    const { data, error } = await supabase.from('sites').insert([newSiteData]).select().single();
                    if (error) throw error;
                    resultId = data.id;
                }
                router.push(`/site?id=${resultId}`);
            } catch (dbError) {
                console.error("DB Operation Failed, switching to Mock Mode", dbError);
                alert('Supabase 연결/저장 실패. 로컬 저장소(LocalStorage)를 사용합니다.');
                const resultId = editId || `demo-${Date.now()}`;

                if (heroImage) { siteData.hero_image_url = await fileToBase64(heroImage); }
                siteData.portfolio = await Promise.all(portfolio.map(async (originalItem, idx) => {
                    if (originalItem.file) {
                        return { ...siteData.portfolio[idx], image_url: await fileToBase64(originalItem.file) };
                    }
                    return siteData.portfolio[idx];
                }));

                localStorage.setItem(`site_${resultId}`, JSON.stringify(siteData));
                router.push(`/site?id=${resultId}`);
            }
        } catch (error) {
            console.error('Critical Error:', error);
            alert('오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">로딩 중...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden my-10">
                <div className="bg-blue-600 p-8 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                {isPaid ? '👑 프리미엄 멤버십 (사용 중)' : '🎁 5시간 무료 체험'}
                            </h1>
                            <p className="opacity-90">
                                {isPaid ? '제한 없는 나만의 홈페이지' : (editId ? '정보 수정' : '지금 바로 홈페이지를 만들어보세요!')}
                            </p>
                        </div>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition mr-2"
                        >
                            <LayoutDashboard size={14} />
                            대시보드
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
                        >
                            <LogOut size={14} />
                            로그아웃
                        </button>
                    </div>
                    {user && (
                        <p className="mt-4 text-sm opacity-75">👤 {user.email}</p>
                    )}
                </div>

                {/* 1. Basic Info */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2">1. 기본 정보</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Building2 size={16} /> 업체명</label>
                            <input type="text" name="name" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" value={formData.name} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><MousePointerClick size={16} /> 한줄 슬로건</label>
                            <input type="text" name="slogan" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" value={formData.slogan} onChange={handleChange} />
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><FileText size={16} /> 상세 설명</label>
                        <textarea name="description" rows={3} className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 bg-white" value={formData.description} onChange={handleChange} />
                    </div>
                </section>

                {/* 2. Design & Contact */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2">2. 디자인 & 연락처</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Palette size={16} /> 테마 색상</label>
                            <div className="flex items-center gap-3">
                                <input type="color" name="color" className="h-10 w-20 cursor-pointer" value={formData.color} onChange={handleChange} />
                                <div className="h-10 w-full rounded" style={{ backgroundColor: formData.color }}></div>
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Sliders size={16} /> 배경 투명도 ({formData.heroOpacity}%)</label>
                            <input type="range" name="heroOpacity" min="0" max="100" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={formData.heroOpacity} onChange={(e) => setFormData(prev => ({ ...prev, heroOpacity: Number(e.target.value) }))} />
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><ImageIcon size={16} /> 메인 배경 이미지 (JPG/PNG)</label>
                        {heroImageUrl && (
                            <div className="mb-2 relative w-32 h-20 rounded overflow-hidden border border-gray-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={heroImageUrl} alt="Current Hero" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <input type="file" accept="image/jpeg, image/png" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-50 file:text-blue-700" onChange={handleHeroImageChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Phone size={16} /> 전화번호 (최대 3개)</label>
                            <div className="space-y-2">
                                <input type="tel" name="phone" placeholder="대표 전화번호" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" value={formData.phone} onChange={handleChange} />
                                <input type="tel" name="phone2" placeholder="추가 번호 1 (선택)" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" value={formData.phone2} onChange={handleChange} />
                                <input type="tel" name="phone3" placeholder="추가 번호 2 (선택)" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" value={formData.phone3} onChange={handleChange} />
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><MessageCircle size={16} /> 이메일 (선택)</label>
                            <input type="email" name="email" placeholder="example@email.com" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-gray-900 bg-white" value={socialLinks.email || ''} onChange={handleSocialChange} />

                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><MapPin size={16} /> 주소</label>
                            <input type="text" name="address" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" value={formData.address} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Globe size={16} /> 네이버 지도 링크</label>
                            <input type="text" name="naverMap" placeholder="https://map.naver.com/... (퍼가기 링크 권장)" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" value={formData.naverMap} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Globe size={16} /> 카카오 맵 링크</label>
                            <input type="text" name="kakaoMap" placeholder="https://map.kakao.com/... (퍼가기 링크 권장)" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" value={formData.kakaoMap} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Globe size={16} /> 구글 지도 링크</label>
                            <input type="text" name="googleMap" placeholder="https://maps.app.goo.gl/..." className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" value={formData.googleMap} onChange={handleChange} />
                        </div>
                    </div>
                </section>

                {/* 3. Social Media */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2">3. 소셜 미디어 (선택)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Instagram size={16} /> 인스타그램</label>
                            <input type="text" name="instagram" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" value={socialLinks.instagram} onChange={handleSocialChange} />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Facebook size={16} /> 페이스북</label>
                            <input type="text" name="facebook" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" value={socialLinks.facebook} onChange={handleSocialChange} />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><MessageCircle size={16} /> 블로그/카페</label>
                            <input type="text" name="blog" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" value={socialLinks.blog} onChange={handleSocialChange} />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Youtube size={16} /> 유튜브</label>
                            <input type="text" name="youtube" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" value={socialLinks.youtube} onChange={handleSocialChange} />
                        </div>
                    </div>
                </section>

                {/* 4. Reviews */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h2 className="text-xl font-bold">4. 고객 후기</h2>
                        <button type="button" onClick={addReview} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full flex items-center gap-1"><Plus size={14} /> 추가하기</button>
                    </div>
                    <div className="space-y-4">
                        {reviews.length === 0 && <p className="text-sm text-gray-400 text-center py-4">등록된 후기가 없습니다.</p>}
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-gray-50 p-4 rounded-xl relative border border-gray-200">
                                <button type="button" onClick={() => removeReview(review.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                <div className="space-y-3">
                                    <input type="text" placeholder="이름 (예: 김철수)" className="w-full px-3 py-2 rounded border outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white" value={review.name} onChange={(e) => updateReview(review.id, 'name', e.target.value)} />
                                    <textarea placeholder="후기 내용" className="w-full px-3 py-2 rounded border outline-none focus:ring-1 focus:ring-blue-500 resize-none h-20 text-gray-900 bg-white" value={review.content} onChange={(e) => updateReview(review.id, 'content', e.target.value)} />
                                    <div className="flex items-center gap-2">
                                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                        <input type="number" min="1" max="5" className="w-16 px-2 py-1 border rounded text-gray-900 bg-white" value={review.rating} onChange={(e) => updateReview(review.id, 'rating', Number(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. Portfolio */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h2 className="text-xl font-bold">5. 메뉴 / 포트폴리오</h2>
                        <button type="button" onClick={addPortfolioItem} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full flex items-center gap-1"><Plus size={14} /> 추가하기</button>
                    </div>
                    {portfolio.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">항목을 추가해주세요.</p>}
                    <div className="space-y-4">
                        {portfolio.map((item) => (
                            <div key={item.id} className="bg-gray-50 p-4 rounded-xl relative border border-gray-200">
                                <button type="button" onClick={() => removePortfolioItem(item.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                <div className="space-y-3">
                                    <input type="text" placeholder="제목" className="w-full px-3 py-2 rounded border outline-none text-gray-900 bg-white" value={item.title} onChange={(e) => updatePortfolioItem(item.id, 'title', e.target.value)} />
                                    <textarea placeholder="설명" className="w-full px-3 py-2 rounded border outline-none resize-none h-20 text-gray-900 bg-white" value={item.desc} onChange={(e) => updatePortfolioItem(item.id, 'desc', e.target.value)} />
                                    <div className="flex gap-4 items-center">
                                        {item.imageUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={item.imageUrl} alt="" className="w-16 h-16 object-cover rounded" />
                                        )}
                                        <input type="file" accept="image/jpeg, image/png" className="text-xs text-gray-500" onChange={(e) => {
                                            if (e.target.files?.[0] && validateImage(e.target.files[0])) {
                                                updatePortfolioItem(item.id, 'file', e.target.files[0]);
                                            }
                                        }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 6. Section Order */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2">6. 섹션 노출 순서</h2>
                    <p className="text-sm text-gray-500 mb-4">화살표를 눌러 섹션의 순서를 변경하세요.</p>

                    <div className="space-y-3">
                        {sectionOrder.map((section, index) => (
                            <div key={section} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-xs font-bold text-gray-400 border border-gray-200">
                                        {index + 1}
                                    </span>
                                    <span className="font-bold text-gray-700">{SECTION_LABELS[section] || section}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newOrder = [...sectionOrder];
                                            if (index > 0) {
                                                [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                                                setSectionOrder(newOrder);
                                            }
                                        }}
                                        disabled={index === 0}
                                        className="p-2 hover:bg-white rounded-lg text-gray-600 disabled:opacity-30 transition"
                                    >
                                        <ArrowUp size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newOrder = [...sectionOrder];
                                            if (index < sectionOrder.length - 1) {
                                                [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                                                setSectionOrder(newOrder);
                                            }
                                        }}
                                        disabled={index === sectionOrder.length - 1}
                                        className="p-2 hover:bg-white rounded-lg text-gray-600 disabled:opacity-30 transition"
                                    >
                                        <ArrowDown size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs">
                        💡 &apos;Q&A&apos;나 &apos;문의하기&apos;는 애드온 스토어에서 활성화해야 실제 화면에 나타납니다.
                    </div>
                </section>

                {/* 7. Section Titles */}
                <section className="bg-gray-50 p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20} /> 7. 섹션 제목 설정</h3>
                    <p className="text-sm text-gray-600 mb-6">각 섹션의 제목을 원하는 언어나 문구로 변경할 수 있습니다.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">소개 섹션 (About)</label>
                            <input
                                type="text"
                                value={sectionTitles.about}
                                onChange={(e) => setSectionTitles({ ...sectionTitles, about: e.target.value })}
                                placeholder="About Us"
                                className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">메뉴/포트폴리오 섹션</label>
                            <input
                                type="text"
                                value={sectionTitles.menu}
                                onChange={(e) => setSectionTitles({ ...sectionTitles, menu: e.target.value })}
                                placeholder="Menu / Portfolio"
                                className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">고객 후기 섹션</label>
                            <input
                                type="text"
                                value={sectionTitles.reviews}
                                onChange={(e) => setSectionTitles({ ...sectionTitles, reviews: e.target.value })}
                                placeholder="Customer Reviews"
                                className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">연락처 섹션</label>
                            <input
                                type="text"
                                value={sectionTitles.contact}
                                onChange={(e) => setSectionTitles({ ...sectionTitles, contact: e.target.value })}
                                placeholder="Contact & Location"
                                className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">문의하기 섹션 (애드온)</label>
                            <input
                                type="text"
                                value={sectionTitles.inquiry}
                                onChange={(e) => setSectionTitles({ ...sectionTitles, inquiry: e.target.value })}
                                placeholder="문의하기"
                                className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Q&A 섹션 (애드온)</label>
                            <input
                                type="text"
                                value={sectionTitles.qna}
                                onChange={(e) => setSectionTitles({ ...sectionTitles, qna: e.target.value })}
                                placeholder="Q&A"
                                className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                    </div>
                </section>

                {/* 8. Font Selection */}
                <section className="bg-gray-50 p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Palette size={20} /> 8. 글씨 폰트</h3>
                    <p className="text-sm text-gray-600 mb-4">사이트 전체에 적용될 글씨체를 선택하세요.</p>
                    <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full md:w-1/2 px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                        {FONT_OPTIONS.map(font => (
                            <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                    </select>
                </section>

                <button type="submit" disabled={loading} className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg mt-6 ${loading ? 'opacity-70' : ''}`}>
                    {loading ? '처리 중...' : (editId ? '수정 완료하기 ✨' : '홈페이지 생성하기 ✨')}
                </button>
            </form>
        </main >
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HomeContent />
        </Suspense>
    )
}
