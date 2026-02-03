'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Palette, Image as ImageIcon, Sliders, Plus, Trash2, Instagram, Facebook, Youtube, MessageCircle, Star, LogOut, LayoutDashboard, ArrowUp, ArrowDown, Mail, Type, ChevronDown, ChevronUp, CheckCircle2, Globe, RectangleHorizontal, Square } from 'lucide-react';
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
    avatar_url?: string;
    avatar_file?: File;
    date?: string;
};

// Accordion Component (Moved outside to prevent re-renders)
const AccordionSection = ({
    title,
    icon: Icon,
    children,
    isOpen,
    onToggle,
    isOptional = false,
    subtitle = ''
}: {
    title: string,
    icon: React.ElementType,
    children: React.ReactNode,
    isOpen: boolean,
    onToggle: () => void,
    isOptional?: boolean,
    subtitle?: string
}) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${isOpen ? 'ring-2 ring-blue-100' : ''}`}>
        <button
            type="button"
            onClick={onToggle}
            className={`w-full flex items-center justify-between p-5 text-left transition-colors ${isOpen ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h2 className={`font-bold text-lg flex items-center gap-2 ${isOpen ? 'text-blue-900' : 'text-gray-700'}`}>
                        {title}
                        {isOptional && <span className="text-xs font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">선택 사항</span>}
                    </h2>
                    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <div className="flex items-center gap-3">
                {isOpen ? <ChevronUp size={20} className="text-blue-500" /> : <ChevronDown size={20} className="text-gray-400" />}
            </div>
        </button>

        {isOpen && (
            <div className="p-6 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                {children}
            </div>
        )}
    </div>
);

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

    const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic', 'design']));

    const toggleSection = (section: string) => {
        const newSet = new Set(openSections);
        if (newSet.has(section)) {
            newSet.delete(section);
        } else {
            newSet.add(section);
        }
        setOpenSections(newSet);
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
        slug: '',
        seo_title: '',
        seo_description: '',
        google_analytics_id: '',
    });
    const [heroImage, setHeroImage] = useState<File | null>(null);
    const [heroImageUrl, setHeroImageUrl] = useState<string>('');
    const [portfolioMode, setPortfolioMode] = useState<'landscape' | 'portrait'>('landscape');

    // Logo State
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoUrl, setLogoUrl] = useState<string>('');

    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [socialLinks, setSocialLinks] = useState({
        instagram: '',
        facebook: '',
        blog: '',
        tiktok: '',
        threads: '',
        youtube: '',
        email: ''
    });

    // Section Titles State
    const [sectionTitles, setSectionTitles] = useState({
        about: 'About Us',
        menu: 'Menu / Portfolio',
        reviews: 'Customer Reviews',
        contact: 'Contact & Location',
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
        { value: 'Gowun Dodum', label: '고운돋움' },
        { value: 'Gowun Batang', label: '고운바탕' },
    ];

    // Construct Google Fonts URL
    const fontNames = FONT_OPTIONS.filter(f => f.value !== 'Inter').map(f => f.value.replace(/ /g, '+'));
    const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontNames.join(':wght@400;700&family=')}:wght@400;700&display=swap`;

    // Section Order State
    const [sectionOrder, setSectionOrder] = useState<string[]>(['hero', 'about', 'menu', 'reviews', 'qna', 'contact']);
    const SECTION_LABELS: Record<string, string> = {
        hero: '메인(Hero) 섹션',
        about: '소개(About) 섹션',
        menu: '메뉴/포트폴리오',
        reviews: '고객 후기',
        qna: 'Q&A 게시판 (애드온)',
        contact: '연락처/지도'
    };

    const [isPaid, setIsPaid] = useState(false);
    const [heroHeight, setHeroHeight] = useState<'full' | 'medium' | 'small'>('full');

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
                    if (siteData.hero_height) setHeroHeight(siteData.hero_height as 'full' | 'medium' | 'small');
                    if (siteData.portfolio_mode) setPortfolioMode(siteData.portfolio_mode as 'landscape' | 'portrait');

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
                        slug: siteData.slug || '',
                        seo_title: siteData.seo_title || '',
                        seo_description: siteData.seo_description || '',
                        google_analytics_id: siteData.google_analytics_id || '',
                    });
                    setHeroImageUrl(siteData.hero_image_url || '');
                    setLogoUrl(siteData.logo_url || '');

                    if (siteData.social_links) {
                        setSocialLinks({
                            instagram: siteData.social_links.instagram || '',
                            facebook: siteData.social_links.facebook || '',
                            blog: siteData.social_links.blog || '',
                            tiktok: siteData.social_links.tiktok || '',
                            threads: siteData.social_links.threads || '',
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
        const MAX_SIZE = 7 * 1024 * 1024; // 7MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            alert(`JPG, PNG, WebP, GIF, SVG 파일만 업로드 가능합니다.\n(현재 파일: ${file.name})`);
            return false;
        }
        if (file.size > MAX_SIZE) {
            alert(`이미지 크기는 7MB 이하여야 합니다.`);
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
    const addPortfolioItem = () => {
        if (portfolio.length >= 15) {
            alert('포트폴리오는 최대 15개까지 추가할 수 있습니다.');
            return;
        }
        setPortfolio([...portfolio, { id: crypto.randomUUID(), title: '', desc: '' }]);
    };
    const removePortfolioItem = (id: string) => setPortfolio(portfolio.filter(item => item.id !== id));
    const updatePortfolioItem = (id: string, field: keyof PortfolioItem, value: string | File) => {
        setPortfolio(portfolio.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    // Review Handlers
    const addReview = () => setReviews([...reviews, { id: crypto.randomUUID(), name: '', content: '', rating: 5, date: '' }]);
    const removeReview = (id: string) => setReviews(reviews.filter(r => r.id !== id));
    const updateReview = (id: string, field: keyof ReviewItem, value: string | number | File) => {
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
            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw new Error(`Upload failed: ${uploadError.message}`);
            }
            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (e) {
            console.error('File upload error:', e);
            throw e;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalHeroImageUrl = heroImageUrl;
            if (heroImage) {
                try {
                    finalHeroImageUrl = await uploadFile(heroImage);
                }
                catch (error) {
                    console.error("Hero image upload failed:", error);
                    alert(`히어로 이미지 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}.\n\nSupabase Storage 버킷 설정을 확인해주세요.`);
                    setLoading(false);
                    return;
                }
            }

            const portfolioWithImages = await Promise.all(portfolio.map(async (item) => {
                let itemImageUrl = item.imageUrl || '';
                if (item.file) {
                    try {
                        itemImageUrl = await uploadFile(item.file);
                    }
                    catch (error) {
                        console.error("Portfolio image upload failed:", error);
                        alert(`포트폴리오 이미지 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}.\n\nSupabase Storage 버킷 설정을 확인해주세요.`);
                    }
                }
                return { title: item.title, desc: item.desc, image_url: itemImageUrl }
            }));

            // Process review avatars
            const reviewsWithAvatars = await Promise.all(reviews.map(async (review) => {
                let avatarUrl = review.avatar_url || '';
                if (review.avatar_file) {
                    try {
                        avatarUrl = await uploadFile(review.avatar_file);
                    } catch (error) {
                        console.error("Review avatar upload failed:", error);
                    }
                }
                return {
                    name: review.name,
                    content: review.content,
                    rating: review.rating,
                    avatar_url: avatarUrl,
                    date: review.date || ''
                }
            }));

            // Combine phones
            const phones = [formData.phone, formData.phone2, formData.phone3].filter(p => p.trim() !== '').join('|');

            // Process logo upload
            let finalLogoUrl = logoUrl || '';
            if (logoFile) {
                try {
                    finalLogoUrl = await uploadFile(logoFile);
                } catch (error) {
                    console.error("Logo upload failed:", error);
                }
            }

            // Calculate expiration time (30 days from now)
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            // Auto-generate slug if empty
            const finalSlug = formData.slug?.trim() || Math.random().toString(36).substring(2, 10);

            const siteData = {
                slug: finalSlug,
                seo_title: formData.seo_title,
                seo_description: formData.seo_description,
                google_analytics_id: formData.google_analytics_id,
                name: formData.name,
                slogan: formData.slogan,
                description: formData.description,
                phone: phones,
                address: formData.address,
                color: formData.color,
                hero_opacity: formData.heroOpacity,
                hero_image_url: finalHeroImageUrl,
                logo_url: finalLogoUrl,
                map_links: { naver: formData.naverMap, kakao: formData.kakaoMap },
                google_map: formData.googleMap,
                social_links: socialLinks, // includes email
                reviews: reviewsWithAvatars,
                portfolio: portfolioWithImages,
                section_order: sectionOrder,
                section_titles: sectionTitles,
                font_family: fontFamily,
                hero_height: heroHeight,
                portfolio_mode: portfolioMode
            };

            try {
                // 1. Slug Validation (Check if slug is already taken by another site)
                const { data: existingSite } = await supabase
                    .from('sites')
                    .select('id')
                    .eq('slug', finalSlug)
                    .neq('id', editId || '00000000-0000-0000-0000-000000000000') // Exclude current site if editing
                    .single();

                if (existingSite) {
                    alert('이미 사용 중인 주소입니다. 다른 주소를 입력해주세요.');
                    setLoading(false);
                    return;
                }

                // 2. Trial Abuse Prevention (Check if user already used their free trial)
                let canUseTrial = true;
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('has_used_trial')
                    .eq('id', user?.id)
                    .single();

                if (profile?.has_used_trial && !editId) {
                    // If user has used trial and is creating a NEW site
                    canUseTrial = false;
                }

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
                        expires_at: canUseTrial ? expiresAt : new Date(0).toISOString(), // Set to epoch if not eligible
                        is_paid: false,
                    };
                    const { data, error } = await supabase.from('sites').insert([newSiteData]).select().single();
                    if (error) throw error;
                    resultId = data.id;

                    // If it was a first trial, mark it as used in profile
                    if (canUseTrial) {
                        try {
                            const { error: profileError } = await supabase.from('profiles').upsert({
                                id: user?.id,
                                has_used_trial: true,
                                email: user?.email // Ensure email is saved
                            });
                            if (profileError) {
                                // Fallback: If email column doesn't exist, try updating just has_used_trial
                                // This handles the case where schema hasn't been updated yet
                                await supabase.from('profiles').upsert({ id: user?.id, has_used_trial: true });
                            }
                        } catch (e) {
                            // Ignore profile update errors to ensure site creation succeeds
                            console.warn('Profile update failed:', e);
                        }
                    } else {
                        // Update email for existing users too
                        try {
                            await supabase.from('profiles').upsert({
                                id: user?.id,
                                email: user?.email,
                                has_used_trial: true
                            });
                        } catch (e) { }
                    }
                }

                // Open in new window if editing, otherwise navigate
                const targetUrl = siteData.slug ? `/${siteData.slug}` : `/site?id=${resultId}`;

                if (editId) {
                    window.open(targetUrl, '_blank');
                    alert(`수정이 완료되었습니다! \n 주소: ${window.location.origin}${targetUrl}`);
                } else {
                    router.push(targetUrl);
                }
            } catch (dbError) {
                console.error("DB Operation Failed, switching to Mock Mode", dbError);
                let errorMessage = 'Unknown error';
                if (dbError instanceof Error) {
                    errorMessage = dbError.message;
                } else if (typeof dbError === 'object' && dbError !== null) {
                    errorMessage = JSON.stringify(dbError, null, 2);
                } else {
                    errorMessage = String(dbError);
                }
                alert(`Supabase 오류:\n${errorMessage}\n\n로컬 저장소(LocalStorage)를 사용합니다.`);
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
            {/* Load Google Fonts for Preview */}
            <link rel="stylesheet" href={googleFontsUrl} />

            {/* Force Font Application to Inputs */}
            <style jsx global>{`
                input, textarea, select, button {
                    font-family: '${fontFamily}', sans-serif !important;
                }
            `}</style>

            <form onSubmit={handleSubmit} className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden my-10 flex flex-col gap-8 p-8" style={{ fontFamily: fontFamily }}>
                <div className="bg-blue-600 p-8 text-white rounded-t-2xl -mt-8 -mx-8 mb-8 shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                {isPaid ? '👑 프리미엄 멤버십 (사용 중)' : '🎁 1개월 무료 체험'}
                            </h1>
                            <p className="opacity-90">
                                {isPaid ? '제한 없는 나만의 홈페이지' : (editId ? '정보 수정' : '지금 바로 홈페이지를 만들어보세요!')}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
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
                    </div>
                    {user && (
                        <p className="mt-4 text-sm opacity-75">👤 {user.email}</p>
                    )}
                    <div className="mt-6 bg-blue-500/30 p-4 rounded-lg flex items-start gap-3 backdrop-blur-sm">
                        <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                            <p className="font-bold">🎁 1개월 동안 모든 기능을 마음껏 써보세요!</p>
                            <p className="opacity-90">모든 칸을 채울 필요가 없습니다. 비워둔 항목은 실제 홈페이지에서 자동으로 숨겨집니다.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* 1. Basic Info */}
                    <AccordionSection
                        title="1. 기본 정보"
                        icon={Building2}
                        isOpen={openSections.has('basic')}
                        onToggle={() => toggleSection('basic')}
                        subtitle="업체명, 슬로건 등 기본적인 정보를 입력합니다."
                    >
                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                <Globe size={16} /> 사이트 주소 설정 (선택 사항)
                            </label>
                            <div className="flex items-center">
                                <span className="bg-gray-100 text-gray-500 px-3 py-3 rounded-l-lg border border-r-0 text-sm">
                                    https://30site.com/
                                </span>
                                <input
                                    type="text"
                                    name="slug"
                                    placeholder="haru (영문 소문자, 숫자, 하이픈만 가능)"
                                    className="w-full px-4 py-3 rounded-r-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                * 설정하면 <b>https://30site.com/설정값</b> 주소로 접속할 수 있습니다. (비워두면 자동 ID 사용)
                            </p>
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                                💡 나만의 도메인(.com 등) 구매 및 연결은 사이트 제작 완료 후 대시보드에서 가능합니다.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">업체명</label>
                                <input type="text" name="name" placeholder="예: 하루 식당" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm" value={formData.name} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">한줄 슬로건</label>
                                <input type="text" name="slogan" placeholder="예: 정성을 담은 따뜻한 한 끼" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm" value={formData.slogan} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">상세 설명</label>
                            <textarea name="description" rows={3} placeholder="업체에 대한 자세한 소개를 적어주세요." className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 bg-white shadow-sm" value={formData.description} onChange={handleChange} />
                        </div>
                    </AccordionSection>

                    {/* 2. Design & Contact */}
                    <AccordionSection
                        title="2. 디자인 & 연락처"
                        icon={Palette}
                        isOpen={openSections.has('design')}
                        onToggle={() => toggleSection('design')}
                        subtitle="브랜드 컬러와 연락처 정보를 설정합니다."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">테마 색상</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" name="color" className="h-10 w-20 cursor-pointer rounded overflow-hidden shadow-sm border border-gray-200" value={formData.color} onChange={handleChange} />
                                    <div className="h-10 w-full rounded shadow-sm border border-gray-200" style={{ backgroundColor: formData.color }}></div>
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">배경 투명도 ({formData.heroOpacity}%)</label>
                                <input type="range" name="heroOpacity" min="0" max="100" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2" style={{ touchAction: 'none' }} value={formData.heroOpacity} onChange={(e) => setFormData(prev => ({ ...prev, heroOpacity: Number(e.target.value) }))} />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <ArrowUp size={16} /> 배경 이미지 높이
                            </label>
                            <div className="flex gap-2">
                                {['full', 'medium', 'small'].map(h => (
                                    <button
                                        type="button"
                                        key={h}
                                        onClick={() => setHeroHeight(h as 'full' | 'medium' | 'small')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${heroHeight === h ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {h === 'full' ? '전체 (100%)' : h === 'medium' ? '중간 (75%)' : '작게 (50%)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">메인 배경 이미지 (최대 7MB)</label>
                            {heroImageUrl && (
                                <div className="mb-2 relative w-full h-40 rounded-lg overflow-hidden border border-gray-200">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={heroImageUrl} alt="Current Hero" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-50 file:text-blue-700 font-semibold file:border-0 hover:file:bg-blue-100 transition" onChange={handleHeroImageChange} />
                        </div>
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">로고 이미지 (헤더/파비콘)</label>
                            <div className="flex items-center gap-4">
                                {(logoUrl || logoFile) && (
                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={logoFile ? URL.createObjectURL(logoFile) : logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-green-50 file:text-green-700 font-semibold file:border-0 hover:file:bg-green-100 transition"
                                    onChange={(e) => {
                                        if (e.target.files?.[0] && validateImage(e.target.files[0])) {
                                            setLogoFile(e.target.files[0]);
                                        }
                                    }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">등록시 헤더 좌측 상단에 표시되며, 브라우저 탭 아이콘(Favicon)으로도 사용됩니다.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 mb-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">대표 전화번호</label>
                                <input type="tel" name="phone" placeholder="010-1234-5678" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm" value={formData.phone} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="tel" name="phone2" placeholder="추가 번호 1 (선택)" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm text-sm" value={formData.phone2} onChange={handleChange} />
                                <input type="tel" name="phone3" placeholder="추가 번호 2 (선택)" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm text-sm" value={formData.phone3} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">주소</label>
                            <input type="text" name="address" placeholder="상세 주소를 입력하세요" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm" value={formData.address} onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">네이버 지도 링크</label>
                                <input type="text" name="naverMap" placeholder="URL 입력" className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm" value={formData.naverMap} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">카카오 맵 링크</label>
                                <input type="text" name="kakaoMap" placeholder="URL 입력" className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm" value={formData.kakaoMap} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">구글 지도 링크</label>
                                <input type="text" name="googleMap" placeholder="URL 입력" className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm" value={formData.googleMap} onChange={handleChange} />
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 3. Social Media */}
                    <AccordionSection
                        title="3. 소셜 미디어"
                        icon={Instagram}
                        isOpen={openSections.has('social')}
                        onToggle={() => toggleSection('social')}
                        isOptional={true}
                        subtitle="운영 중인 SNS가 있다면 링크를 입력하세요."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Instagram size={16} /> 인스타그램</label>
                                <input type="text" name="instagram" placeholder="@username or URL" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm" value={socialLinks.instagram} onChange={handleSocialChange} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Facebook size={16} /> 페이스북</label>
                                <input type="text" name="facebook" placeholder="URL" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm" value={socialLinks.facebook} onChange={handleSocialChange} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><MessageCircle size={16} /> 블로그/카페</label>
                                <input type="text" name="blog" placeholder="URL" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm" value={socialLinks.blog} onChange={handleSocialChange} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Youtube size={16} /> 유튜브</label>
                                <input type="text" name="youtube" placeholder="URL" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm" value={socialLinks.youtube} onChange={handleSocialChange} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                                    틱톡
                                </label>
                                <input type="text" name="tiktok" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm" value={socialLinks.tiktok} onChange={handleSocialChange} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-2-2-2-5 0-7s4-2 6 0"></path><path d="M12 12c2 2 2 5 0 7s-4 2-6 0"></path><path d="M12 12c-2 2-5 2-7 0s-2-4 0-6"></path><path d="M12 12c2-2 5-2 7 0s2 4 0 6"></path></svg>
                                    스레드
                                </label>
                                <input type="text" name="threads" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm" value={socialLinks.threads} onChange={handleSocialChange} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Mail size={16} /> 이메일</label>
                                <input type="email" name="email" placeholder="example@email.com" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm" value={socialLinks.email} onChange={handleSocialChange} />
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 4. Reviews */}
                    <AccordionSection
                        title="4. 고객 후기"
                        icon={Star}
                        isOpen={openSections.has('reviews')}
                        onToggle={() => toggleSection('reviews')}
                        isOptional={true}
                        subtitle="고객들의 좋은 평가를 자랑해보세요."
                    >
                        <div className="flex justify-end mb-4">
                            <button type="button" onClick={addReview} className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition"><Plus size={16} /> 후기 추가하기</button>
                        </div>
                        <div className="space-y-4">
                            {reviews.length === 0 && <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-lg">등록된 후기가 없습니다. &#39;추가하기&#39; 버튼을 눌러 작성해보세요.</p>}
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-gray-50 p-4 rounded-xl relative border border-gray-200 hover:border-blue-200 transition">
                                    <button type="button" onClick={() => removeReview(review.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                                    <div className="space-y-3">
                                        <div className="flex gap-4 items-start">
                                            {/* Avatar Upload (Optional) */}
                                            <div className="flex-shrink-0 text-center">
                                                <div className="w-14 h-14 rounded-full bg-white overflow-hidden border border-gray-200 mb-1 shadow-sm">
                                                    {review.avatar_url || review.avatar_file ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={review.avatar_file ? URL.createObjectURL(review.avatar_file) : review.avatar_url}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">👤</div>
                                                    )}
                                                </div>
                                                <label className="text-xs text-blue-600 cursor-pointer hover:underline block">
                                                    사진 변경
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                updateReview(review.id, 'avatar_file', e.target.files[0]);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <input type="text" placeholder="이름 (예: 김철수)" className="w-full px-3 py-2 rounded border outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white" value={review.name} onChange={(e) => updateReview(review.id, 'name', e.target.value)} />
                                                <input type="date" className="w-full px-3 py-2 rounded border outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white text-sm" value={review.date || ''} onChange={(e) => updateReview(review.id, 'date', e.target.value)} />
                                            </div>
                                        </div>
                                        <textarea placeholder="후기 내용" className="w-full px-3 py-2 rounded border outline-none focus:ring-1 focus:ring-blue-500 resize-none h-20 text-gray-900 bg-white" value={review.content} onChange={(e) => updateReview(review.id, 'content', e.target.value)} />
                                        <div className="flex items-center gap-2">
                                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                            <input type="number" min="1" max="5" className="w-16 px-2 py-1 border rounded text-gray-900 bg-white" value={review.rating} onChange={(e) => updateReview(review.id, 'rating', Number(e.target.value))} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionSection>

                    {/* 5. Portfolio */}
                    <AccordionSection
                        title="5. 메뉴 / 포트폴리오"
                        icon={ImageIcon}
                        isOpen={openSections.has('portfolio')}
                        onToggle={() => toggleSection('portfolio')}
                        isOptional={true}
                        subtitle="판매하는 상품이나 작업물을 소개하세요."
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setPortfolioMode('landscape')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${portfolioMode === 'landscape' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    <RectangleHorizontal size={14} /> 가로형 (기본)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPortfolioMode('portrait')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${portfolioMode === 'portrait' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    <Square size={14} /> 세로형 (크게)
                                </button>
                            </div>
                            <button type="button" onClick={addPortfolioItem} className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition"><Plus size={16} /> 항목 추가하기</button>
                        </div>
                        {portfolio.length === 0 && <p className="text-center text-gray-400 py-6 bg-gray-50 rounded-lg text-sm">등록된 항목이 없습니다.</p>}
                        <div className="space-y-4">
                            {portfolio.map((item) => (
                                <div key={item.id} className="bg-gray-50 p-4 rounded-xl relative border border-gray-200 hover:border-blue-200 transition">
                                    <button type="button" onClick={() => removePortfolioItem(item.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                                    <div className="space-y-3">
                                        <input type="text" placeholder="제목 (예: 대표 메뉴 A)" className="w-full px-3 py-2 rounded border outline-none text-gray-900 bg-white focus:ring-1 focus:ring-blue-500 font-medium" value={item.title} onChange={(e) => updatePortfolioItem(item.id, 'title', e.target.value)} />
                                        <textarea placeholder="설명 (가격, 특징 등)" className="w-full px-3 py-2 rounded border outline-none resize-none h-20 text-gray-900 bg-white focus:ring-1 focus:ring-blue-500" value={item.desc} onChange={(e) => updatePortfolioItem(item.id, 'desc', e.target.value)} />
                                        <div className="flex gap-4 items-center mt-2">
                                            {item.imageUrl && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={item.imageUrl} alt="" className="w-16 h-16 object-cover rounded shadow-sm" />
                                            )}
                                            <input type="file" accept="image/*" className="text-xs text-gray-500" onChange={(e) => {
                                                if (e.target.files?.[0] && validateImage(e.target.files[0])) {
                                                    updatePortfolioItem(item.id, 'file', e.target.files[0]);
                                                }
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionSection>

                    {/* 6. Section Order */}
                    <AccordionSection
                        title="6. 섹션 순서 / 제목 설정"
                        icon={Sliders}
                        isOpen={openSections.has('order')}
                        onToggle={() => toggleSection('order')}
                        subtitle="화면에 표시될 순서와 각 섹션의 제목을 변경합니다."
                    >
                        <h4 className="font-bold text-gray-700 mb-3 text-sm">섹션 노출 순서</h4>
                        <div className="space-y-2 mb-8">
                            {sectionOrder.map((section, index) => (
                                <div key={section} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <span className="w-5 h-5 flex items-center justify-center bg-white rounded-full text-[10px] font-bold text-gray-400 border border-gray-200">
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-gray-700 text-sm">{SECTION_LABELS[section] || section}</span>
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
                                            className="p-1.5 hover:bg-white rounded-md text-gray-500 disabled:opacity-30 transition"
                                        >
                                            <ArrowUp size={16} />
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
                                            className="p-1.5 hover:bg-white rounded-md text-gray-500 disabled:opacity-30 transition"
                                        >
                                            <ArrowDown size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="mt-2 text-[11px] text-blue-600 bg-blue-50 p-2 rounded">
                                * &apos;Q&A&apos; 섹션은 애드온 구매 또는 체험 활성화 후 표시됩니다.
                            </div>
                        </div>

                        <h4 className="font-bold text-gray-700 mb-3 text-sm border-t pt-6">섹션 제목 설정 (커스텀)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">소개 섹션</label>
                                <input
                                    type="text"
                                    value={sectionTitles.about}
                                    onChange={(e) => setSectionTitles({ ...sectionTitles, about: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">메뉴/포트폴리오 섹션</label>
                                <input
                                    type="text"
                                    value={sectionTitles.menu}
                                    onChange={(e) => setSectionTitles({ ...sectionTitles, menu: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">리뷰 섹션</label>
                                <input
                                    type="text"
                                    value={sectionTitles.reviews}
                                    onChange={(e) => setSectionTitles({ ...sectionTitles, reviews: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">연락처 섹션</label>
                                <input
                                    type="text"
                                    value={sectionTitles.contact}
                                    onChange={(e) => setSectionTitles({ ...sectionTitles, contact: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Q&A 섹션 (애드온)</label>
                                <input
                                    type="text"
                                    value={sectionTitles.qna}
                                    onChange={(e) => setSectionTitles({ ...sectionTitles, qna: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                        </div>
                    </AccordionSection>

                    {/* SEO Settings */}
                    <AccordionSection
                        title="검색 엔진 최적화 (SEO) & Google Analytics"
                        icon={Globe}
                        isOpen={openSections.has('seo')}
                        onToggle={() => toggleSection('seo')}
                        subtitle="네이버/구글 검색 노출 및 방문자 통계 설정"
                    >
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    검색 노출 제목 (Page Title)
                                </label>
                                <input
                                    type="text"
                                    name="seo_title"
                                    value={formData.seo_title}
                                    onChange={handleChange}
                                    placeholder={formData.name ? `${formData.name} - 공식 홈페이지` : "예: 하루 식당 - 정통 한식 맛집"}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-2">입력하지 않으면 사이트 이름이 기본 사용됩니다.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    검색 설명 (Meta Description)
                                </label>
                                <textarea
                                    name="seo_description"
                                    value={formData.seo_description}
                                    onChange={handleChange}
                                    placeholder="사이트에 대한 간략한 설명을 입력하세요. 검색 결과 미리보기에 표시됩니다."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-orange-100 text-orange-600 p-1 rounded-md"><Globe size={14} /></span>
                                        Google Analytics 측정 ID (선택)
                                    </div>
                                    <a
                                        href="https://analytics.google.com/analytics/web/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-500 hover:text-blue-700 underline flex items-center gap-1"
                                    >
                                        구글 애널리틱스 바로가기 ↗
                                    </a>
                                </label>
                                <input
                                    type="text"
                                    name="google_analytics_id"
                                    value={formData.google_analytics_id}
                                    onChange={handleChange}
                                    placeholder="G-XXXXXXXXXX"
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                />
                                <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed">
                                    <p className="font-bold text-gray-700 mb-1">💡 측정 ID는 어디서 찾나요?</p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>구글 애널리틱스 접속 후 <b>[관리]</b> → <b>[데이터 스트림]</b> 클릭</li>
                                        <li>내 사이트를 선택하면 <b>측정 ID</b>(G-로 시작)를 복사할 수 있습니다.</li>
                                        <li>이곳에 붙여넣기 하면 방문자 통계가 자동 연결됩니다!</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 7. Font Selection */}
                    <AccordionSection
                        title="7. 글씨 폰트"
                        icon={Type}
                        isOpen={openSections.has('font')}
                        onToggle={() => toggleSection('font')}
                        subtitle="사이트 전체에 적용될 글씨체를 선택하세요."
                    >
                        <div className="grid grid-cols-2 gap-3">
                            {FONT_OPTIONS.map(font => (
                                <button
                                    key={font.value}
                                    type="button"
                                    onClick={() => setFontFamily(font.value)}
                                    className={`px-4 py-3 rounded-lg border text-left transition relative ${fontFamily === font.value ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                                    style={{ fontFamily: font.value }}
                                >
                                    <span className="block text-sm font-medium mb-1">{font.label}</span>
                                    <span className="block text-xs opacity-70">모던하고 깔끔한 느낌</span>
                                    {fontFamily === font.value && (
                                        <div className="absolute top-3 right-3 text-blue-500">
                                            <CheckCircle2 size={16} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </AccordionSection>
                </div>

                <button type="submit" disabled={loading} className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg mt-6 ${loading ? 'opacity-70' : ''}`}>
                    {loading ? '처리 중...' : (editId ? '수정 완료하기 ✨' : '홈페이지 생성하기 ✨')}
                </button>
            </form >
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
