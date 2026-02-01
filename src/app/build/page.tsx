'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, MousePointerClick, Palette, Phone, MapPin, FileText, Image as ImageIcon, Sliders, Plus, Trash2, Globe, Instagram, Facebook, Youtube, MessageCircle, Star } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

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

    const [loading, setLoading] = useState(false);
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
                social_links: socialLinks, // includes email
                reviews: reviews,
                portfolio: portfolioWithImages,
            };

            try {
                let resultId = editId;
                if (editId) {
                    const { error } = await supabase.from('sites').update(siteData).eq('id', editId);
                    if (error) throw error;
                } else {
                    const { data, error } = await supabase.from('sites').insert([siteData]).select().single();
                    if (error) throw error;
                    resultId = data.id;
                }
                router.push(`/site/${resultId}`);
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
                router.push(`/site/${resultId}`);
            }
        } catch (error) {
            console.error('Critical Error:', error);
            alert('오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden my-10">
                <div className="bg-blue-600 p-8 text-white text-center">
                    <h1 className="text-3xl font-bold mb-2">초간단 홈페이지 빌더 v0.3</h1>
                    <p className="opacity-90">{editId ? '정보 수정' : '필요한 정보만 입력하세요.'}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* 1. Basic Info */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2">1. 기본 정보</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Building2 size={16} /> 업체명</label>
                                <input type="text" name="name" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><MousePointerClick size={16} /> 한줄 슬로건</label>
                                <input type="text" name="slogan" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" value={formData.slogan} onChange={handleChange} />
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><FileText size={16} /> 상세 설명</label>
                            <textarea name="description" rows={3} className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 resize-none" value={formData.description} onChange={handleChange} />
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
                                    <input type="tel" name="phone" placeholder="대표 전화번호" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" value={formData.phone} onChange={handleChange} />
                                    <input type="tel" name="phone2" placeholder="추가 번호 1 (선택)" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" value={formData.phone2} onChange={handleChange} />
                                    <input type="tel" name="phone3" placeholder="추가 번호 2 (선택)" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" value={formData.phone3} onChange={handleChange} />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><MessageCircle size={16} /> 이메일 (선택)</label>
                                <input type="email" name="email" placeholder="example@email.com" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 mb-4" value={socialLinks.email || ''} onChange={handleSocialChange} />

                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><MapPin size={16} /> 주소</label>
                                <input type="text" name="address" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" value={formData.address} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Globe size={16} /> 네이버 지도 링크</label>
                                <input type="text" name="naverMap" placeholder="https://map.naver.com/... (퍼가기 링크 권장)" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" value={formData.naverMap} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Globe size={16} /> 카카오 맵 링크</label>
                                <input type="text" name="kakaoMap" placeholder="https://map.kakao.com/... (퍼가기 링크 권장)" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" value={formData.kakaoMap} onChange={handleChange} />
                            </div>
                        </div>
                    </section>

                    {/* 3. Social Media */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2">3. 소셜 미디어 (선택)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Instagram size={16} /> 인스타그램</label>
                                <input type="text" name="instagram" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" value={socialLinks.instagram} onChange={handleSocialChange} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Facebook size={16} /> 페이스북</label>
                                <input type="text" name="facebook" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" value={socialLinks.facebook} onChange={handleSocialChange} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><MessageCircle size={16} /> 블로그/카페</label>
                                <input type="text" name="blog" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" value={socialLinks.blog} onChange={handleSocialChange} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Youtube size={16} /> 유튜브</label>
                                <input type="text" name="youtube" className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" value={socialLinks.youtube} onChange={handleSocialChange} />
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
                                        <input type="text" placeholder="이름 (예: 김철수)" className="w-full px-3 py-2 rounded border outline-none focus:ring-1 focus:ring-blue-500" value={review.name} onChange={(e) => updateReview(review.id, 'name', e.target.value)} />
                                        <textarea placeholder="후기 내용" className="w-full px-3 py-2 rounded border outline-none focus:ring-1 focus:ring-blue-500 resize-none h-20" value={review.content} onChange={(e) => updateReview(review.id, 'content', e.target.value)} />
                                        <div className="flex items-center gap-2">
                                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                            <input type="number" min="1" max="5" className="w-16 px-2 py-1 border rounded" value={review.rating} onChange={(e) => updateReview(review.id, 'rating', Number(e.target.value))} />
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
                                        <input type="text" placeholder="제목" className="w-full px-3 py-2 rounded border outline-none" value={item.title} onChange={(e) => updatePortfolioItem(item.id, 'title', e.target.value)} />
                                        <textarea placeholder="설명" className="w-full px-3 py-2 rounded border outline-none resize-none h-20" value={item.desc} onChange={(e) => updatePortfolioItem(item.id, 'desc', e.target.value)} />
                                        <div className="flex gap-4 items-center">
                                            {item.imageUrl && <img src={item.imageUrl} alt="" className="w-16 h-16 object-cover rounded" />}
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

                    <button type="submit" disabled={loading} className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg mt-6 ${loading ? 'opacity-70' : ''}`}>
                        {loading ? '처리 중...' : (editId ? '수정 완료하기 ✨' : '홈페이지 생성하기 ✨')}
                    </button>
                </form>
            </div>
        </main>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HomeContent />
        </Suspense>
    )
}
