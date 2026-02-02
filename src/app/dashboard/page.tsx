'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { Edit, Eye, Pause, Play, Trash2, Clock, Globe, Plus, AlertCircle, Calendar, DollarSign, TrendingUp, Users, ChevronDown, ChevronRight, Filter, ShoppingBag, X, CheckCircle } from 'lucide-react';

type Site = {
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'active' | 'paused';
    expires_at: string;
    is_paid: boolean;
    hero_image_url: string;
    created_at: string;
    user_id: string;
};

type Payment = {
    id: string;
    user_id: string;
    site_id: string;
    amount: number;
    method: string;
    coupon_code: string;
    payment_id: string;
    status: string;
    created_at: string;
};

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sites, setSites] = useState<Site[]>([]);
    const [allSites, setAllSites] = useState<Site[]>([]); // For Admin
    const [payments, setPayments] = useState<Payment[]>([]); // For Admin
    const [loading, setLoading] = useState(true);
    const [filterRange, setFilterRange] = useState<'day' | 'week' | 'month' | 'all'>('all');
    const [expandedUsers, setExpandedUsers] = useState<string[]>([]);

    // Add-on Store State
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [showStore, setShowStore] = useState(false);
    const [siteAddons, setSiteAddons] = useState<string[]>([]); // Active addons for selected site
    const [purchasedAddons, setPurchasedAddons] = useState<Record<string, { type: string, purchase_type: string, coupon_code?: string }>>({}); // Purchased addons with details
    const [notificationEmail, setNotificationEmail] = useState(''); // For inquiry addon
    const [allSiteAddons, setAllSiteAddons] = useState<Record<string, string[]>>({}); // siteId -> addonTypes

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedAddon, setSelectedAddon] = useState<{ id: string, name: string, price: number } | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'coupon'>('card');
    const [couponCode, setCouponCode] = useState('');
    const [couponMessage, setCouponMessage] = useState('');
    const [couponValid, setCouponValid] = useState(false);

    const availableAddons = [
        { id: 'inquiry', name: '1:1 문의하기 폼', price: 3000, desc: '고객의 문의를 바로 받아보세요.' },
        { id: 'qna', name: 'Q&A 게시판', price: 3000, desc: '비밀글 기능이 포함된 질문 게시판입니다.' },
        // { id: 'domain', name: '개인 도메인 연결', price: 15000, desc: '나만의 도메인(com, kr)을 연결하세요.' }
    ];


    const openStore = async (siteId: string) => {
        setSelectedSiteId(siteId);
        setShowStore(true);
        // Fetch current addons (including is_active state and purchase info)
        const { data } = await supabase.from('site_addons').select('addon_type, config, is_active, is_purchased, purchase_type, coupon_code').eq('site_id', siteId);
        if (data) {
            setSiteAddons(data.filter(d => d.is_active).map(d => d.addon_type));

            // Build purchased addons map
            const purchased: Record<string, { type: string, purchase_type: string, coupon_code?: string }> = {};
            data.forEach(addon => {
                if (addon.is_purchased) {
                    purchased[addon.addon_type] = {
                        type: addon.purchase_type,
                        purchase_type: addon.purchase_type,
                        coupon_code: addon.coupon_code
                    };
                }
            });
            setPurchasedAddons(purchased);

            const inquiryAddon = data.find(d => d.addon_type === 'inquiry');
            if (inquiryAddon?.config?.notification_email) {
                setNotificationEmail(inquiryAddon.config.notification_email);
            } else {
                setNotificationEmail(user?.email || '');
            }
        }
    };

    // Toggle addon on/off (for already installed addons)
    const handleToggleAddon = async (addonId: string, currentlyActive: boolean) => {
        if (!selectedSiteId) return;

        const { error } = await supabase
            .from('site_addons')
            .update({ is_active: !currentlyActive })
            .eq('site_id', selectedSiteId)
            .eq('addon_type', addonId);

        if (!error) {
            if (currentlyActive) {
                setSiteAddons(siteAddons.filter(id => id !== addonId));
                alert('기능이 비활성화되었습니다.');
            } else {
                setSiteAddons([...siteAddons, addonId]);
                alert('기능이 활성화되었습니다.');
            }
            // Update allSiteAddons
            setAllSiteAddons(prev => ({
                ...prev,
                [selectedSiteId]: currentlyActive
                    ? (prev[selectedSiteId] || []).filter(id => id !== addonId)
                    : Array.from(new Set([...(prev[selectedSiteId] || []), addonId]))
            }));
        } else {
            alert('작업 실패');
        }
    };

    // Install new addon - opens payment modal for paid sites
    const handleInstallAddon = async (addon: { id: string, name: string, price: number }) => {
        if (!selectedSiteId) return;

        const site = sites.find(s => s.id === selectedSiteId) || allSites.find(s => s.id === selectedSiteId);
        if (!site) return;

        // Validation for inquiry addon
        if (addon.id === 'inquiry' && !notificationEmail) {
            alert('알림 받을 이메일을 입력해주세요.');
            return;
        }

        // Check if already purchased
        if (purchasedAddons[addon.id]) {
            await handleToggleAddon(addon.id, false);
            return;
        }

        // Trial sites -> Free installation
        if (!site.is_paid) {
            await installAddonFree(addon.id);
            return;
        }

        // Paid sites -> Show payment modal
        setSelectedAddon(addon);
        setShowPaymentModal(true);
        setCouponCode('');
        setCouponMessage('');
        setCouponValid(false);
        setPaymentMethod('card');
    };

    // Free installation for trial sites
    const installAddonFree = async (addonId: string) => {
        if (!selectedSiteId) return;

        const { error } = await supabase.from('site_addons').upsert({
            site_id: selectedSiteId,
            addon_type: addonId,
            config: addonId === 'inquiry' ? { notification_email: notificationEmail } : {},
            is_active: true,
            is_purchased: false // Free trial
        }, { onConflict: 'site_id,addon_type' });

        if (!error) {
            alert('무료 체험 기간 중에는 무료로 추가됩니다!');
            setSiteAddons([...siteAddons, addonId]);
            setAllSiteAddons(prev => ({
                ...prev,
                [selectedSiteId]: Array.from(new Set([...(prev[selectedSiteId] || []), addonId]))
            }));
        } else {
            alert('작업 실패');
        }
    };

    // Verify coupon code
    const handleVerifyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponMessage('쿠폰 코드를 입력해주세요.');
            return;
        }

        try {
            // Direct Supabase call (Public Read)
            const { data: coupon, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', couponCode.trim())
                .single();

            if (error || !coupon) {
                setCouponMessage('유효하지 않은 쿠폰 코드입니다.');
                setCouponValid(false);
                return;
            }

            // Check if for addon (value 3000 or description includes addon)
            const isAddonCoupon = coupon.value === 3000 || (coupon.description && coupon.description.includes('애드온'));
            if (!isAddonCoupon) {
                setCouponMessage('이 쿠폰은 애드온에 사용할 수 없습니다.');
                setCouponValid(false);
                return;
            }

            // Expiration check
            if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
                setCouponMessage('만료된 쿠폰입니다.');
                setCouponValid(false);
                return;
            }

            // Usage check
            if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
                setCouponMessage('사용 횟수가 초과된 쿠폰입니다.');
                setCouponValid(false);
                return;
            }

            setCouponMessage('쿠폰이 적용되었습니다!');
            setCouponValid(true);
        } catch (e) {
            console.error(e);
            setCouponMessage('쿠폰 확인 중 오류가 발생했습니다.');
            setCouponValid(false);
        }
    };

    // Complete addon purchase
    const handleCompletePurchase = async () => {
        if (!selectedSiteId || !selectedAddon) return;

        // Validate payment method
        if (paymentMethod === 'coupon' && !couponValid) {
            alert('유효한 쿠폰을 입력해주세요.');
            return;
        }

        try {
            const { error } = await supabase.from('site_addons').upsert({
                site_id: selectedSiteId,
                addon_type: selectedAddon.id,
                config: selectedAddon.id === 'inquiry' ? { notification_email: notificationEmail } : {},
                is_active: true,
                is_purchased: true,
                purchase_type: paymentMethod,
                purchased_at: new Date().toISOString(),
                coupon_code: paymentMethod === 'coupon' ? couponCode : null
            }, { onConflict: 'site_id,addon_type' });

            if (!error) {
                // Securely increment coupon usage count via RPC
                if (paymentMethod === 'coupon') {
                    await supabase.rpc('increment_coupon_usage', { coupon_code_param: couponCode });
                }

                alert(paymentMethod === 'coupon' ? '쿠폰으로 구매 완료!' : '결제 완료! (모의 결제)');
                setSiteAddons([...siteAddons, selectedAddon.id]);
                setPurchasedAddons(prev => ({
                    ...prev,
                    [selectedAddon.id]: {
                        type: paymentMethod,
                        purchase_type: paymentMethod,
                        coupon_code: paymentMethod === 'coupon' ? couponCode : undefined
                    }
                }));
                setAllSiteAddons(prev => ({
                    ...prev,
                    [selectedSiteId]: Array.from(new Set([...(prev[selectedSiteId] || []), selectedAddon.id]))
                }));
                setShowPaymentModal(false);
            } else {
                alert('구매 실패: ' + error.message);
            }
        } catch (e) {
            console.error(e);
            alert('구매 중 오류가 발생했습니다.');
        }
    };


    // Update addon settings (for inquiry email)
    const handleUpdateSettings = async (addonId: string) => {
        if (!selectedSiteId) return;

        if (addonId === 'inquiry' && !notificationEmail) {
            alert('알림 받을 이메일을 입력해주세요.');
            return;
        }

        const { error } = await supabase
            .from('site_addons')
            .update({ config: { notification_email: notificationEmail } })
            .eq('site_id', selectedSiteId)
            .eq('addon_type', addonId);

        if (!error) {
            alert('설정이 변경되었습니다.');
        } else {
            alert('작업 실패');
        }
    };

    const isAdmin = user?.email === 'inmyeong320@naver.com';

    useEffect(() => {
        const checkAuthAndLoadSites = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            // Fetch User's Sites
            const { data } = await supabase
                .from('sites')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setSites(data as Site[]);

            // Fetch All Sites for Admin
            if (user.email === 'inmyeong320@naver.com') {
                const { data: allData } = await supabase
                    .from('sites')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (allData) setAllSites(allData as Site[]);

                const { data: payData } = await supabase
                    .from('payments')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (payData) setPayments(payData as Payment[]);
            }

            // Fetch All Addons for User's Sites
            const siteIds = data?.map(s => s.id) || [];
            if (siteIds.length > 0) {
                const { data: addons } = await supabase
                    .from('site_addons')
                    .select('site_id, addon_type')
                    .in('site_id', siteIds)
                    .eq('is_active', true);

                if (addons) {
                    const addonMap: Record<string, string[]> = {};
                    addons.forEach(a => {
                        if (!addonMap[a.site_id]) addonMap[a.site_id] = [];
                        addonMap[a.site_id].push(a.addon_type);
                    });
                    setAllSiteAddons(addonMap);
                }
            }

            setLoading(false);
        };
        checkAuthAndLoadSites();
    }, [router]);

    // Helpers for Admin Dashboard
    const getFilteredPayments = () => {
        if (filterRange === 'all') return payments;
        const now = new Date();
        const diffDays = filterRange === 'day' ? 1 : filterRange === 'week' ? 7 : 30;
        const cutoff = new Date(now.getTime() - diffDays * 24 * 60 * 60 * 1000);
        return payments.filter(p => new Date(p.created_at) >= cutoff);
    };

    const totalRevenue = getFilteredPayments().reduce((sum, p) => sum + p.amount, 0);

    const groupSitesByUser = () => {
        const groups: Record<string, Site[]> = {};
        allSites.forEach(site => {
            if (!groups[site.user_id]) groups[site.user_id] = [];
            groups[site.user_id].push(site);
        });
        return groups;
    };

    const toggleUserExpand = (userId: string) => {
        setExpandedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const formatTimeRemaining = (expiresAt: string, isPaid: boolean) => {
        const now = new Date().getTime();
        const expireTime = new Date(expiresAt).getTime();
        const diff = expireTime - now;

        if (diff <= 0) return "만료됨";

        if (isPaid) {
            // Paid: Months and Days
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const months = Math.floor(days / 30);
            const remainingDays = days % 30;
            if (months > 0) return `${months}개월 ${remainingDays}일 남음`;
            return `${remainingDays}일 남음`;
        } else {
            // Trial: Hours and Minutes
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}시간 ${minutes}분 남음`;
        }
    };

    const getShortUserId = (userId: string) => userId.split('-')[0].toUpperCase();

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
        // Prevent pausing drafts (drafts are already not public)
        if (currentStatus === 'draft') return alert("게시되지 않은 사이트입니다. 먼저 게시해주세요.");

        const { error } = await supabase
            .from('sites')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setSites(sites.map(s => s.id === id ? { ...s, status: newStatus } : s));
            if (isAdmin) {
                setAllSites(allSites.map(s => s.id === id ? { ...s, status: newStatus } : s));
            }
        } else {
            alert("상태 변경 실패");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까? 복구할 수 없습니다.")) return;

        const { error } = await supabase.from('sites').delete().eq('id', id);
        if (!error) {
            setSites(sites.filter(s => s.id !== id));
            if (isAdmin) {
                setAllSites(allSites.filter(s => s.id !== id));
            }
        } else {
            alert("삭제 실패");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="text-xl font-bold tracking-tight">SimpleSite</Link>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Dashboard</span>
                        {isAdmin && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold">MASTER</span>}
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 hidden md:inline">{user?.email}</span>
                        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-sm font-bold text-gray-400 hover:text-red-500 transition">
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">

                {/* Admin Dashboard */}
                {isAdmin && (
                    <div className="space-y-10 mb-20 animate-fadeIn">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-purple-100 p-3 rounded-2xl text-purple-600"><Globe size={20} /></div>
                                    <span className="text-gray-500 font-medium">총 사이트</span>
                                </div>
                                <div className="text-3xl font-bold">{allSites.length}</div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><Users size={20} /></div>
                                    <span className="text-gray-500 font-medium">총 사용자</span>
                                </div>
                                <div className="text-3xl font-bold">{Object.keys(groupSitesByUser()).length}</div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-green-100 p-3 rounded-2xl text-green-600"><DollarSign size={20} /></div>
                                    <span className="text-gray-500 font-medium">총 매출 ({filterRange})</span>
                                </div>
                                <div className="text-3xl font-bold">{totalRevenue.toLocaleString()}원</div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-orange-100 p-3 rounded-2xl text-orange-600"><TrendingUp size={20} /></div>
                                    <span className="text-gray-500 font-medium">유료 비율</span>
                                </div>
                                <div className="text-3xl font-bold">
                                    {allSites.length > 0 ? Math.round((allSites.filter(s => s.is_paid).length / allSites.length) * 100) : 0}%
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3 bg-white p-2 border border-gray-200 rounded-2xl w-fit">
                            <Filter size={16} className="ml-2 text-gray-400" />
                            {(['day', 'week', 'month', 'all'] as const).map(range => (
                                <button
                                    key={range}
                                    onClick={() => setFilterRange(range)}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-bold transition ${filterRange === range ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {range === 'day' ? '오늘' : range === 'week' ? '주간' : range === 'month' ? '월간' : '전체'}
                                </button>
                            ))}
                        </div>

                        {/* Site List Grouped by User */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    📂 사용자별 사이트 현황
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {Object.entries(groupSitesByUser()).map(([userId, userSites]) => (
                                    <div key={userId} className="group">
                                        <button
                                            onClick={() => toggleUserExpand(userId)}
                                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="bg-gray-100 text-gray-500 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs">
                                                    {getShortUserId(userId)}
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-bold text-gray-900">{userId}</div>
                                                    <div className="text-xs text-gray-400">총 {userSites.length}개의 사이트 보유</div>
                                                </div>
                                            </div>
                                            {expandedUsers.includes(userId) ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                                        </button>

                                        {expandedUsers.includes(userId) && (
                                            <div className="px-6 pb-6 pt-2 bg-gray-50/50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {userSites.map(site => (
                                                        <div key={site.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <h4 className="font-bold text-gray-900 truncate flex-1">{site.name || '(무제)'}</h4>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${site.is_paid ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                                    {site.is_paid ? 'Paid' : 'Free'}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2 text-xs">
                                                                <div className="flex items-center gap-2 text-gray-500">
                                                                    <Clock size={12} />
                                                                    <span>{formatTimeRemaining(site.expires_at, site.is_paid)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-gray-500">
                                                                    <Calendar size={12} />
                                                                    <span>생성일: {new Date(site.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-2 text-blue-500 font-medium">
                                                                        <Eye size={12} />
                                                                        <a href={`/site?id=${site.id}`} target="_blank" rel="noreferrer" className="hover:underline">
                                                                            사이트 보기
                                                                        </a>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDelete(site.id);
                                                                        }}
                                                                        className="text-red-400 hover:text-red-600 transition p-1"
                                                                        title="삭제"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                                <h3 className="font-bold text-purple-900 flex items-center gap-2">
                                    💳 상세 결제 내역 ({filterRange})
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 border-b">
                                        <tr>
                                            <th className="px-6 py-3">날짜</th>
                                            <th className="px-6 py-3">소유자 ID</th>
                                            <th className="px-6 py-3">사이트</th>
                                            <th className="px-6 py-3">금액</th>
                                            <th className="px-6 py-3">수단</th>
                                            <th className="px-6 py-3">쿠폰</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {getFilteredPayments().length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">결제 내역이 없습니다.</td>
                                            </tr>
                                        ) : (
                                            getFilteredPayments().map(pay => (
                                                <tr key={pay.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-500">{new Date(pay.created_at).toLocaleString()}</td>
                                                    <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{getShortUserId(pay.user_id)}...</td>
                                                    <td className="px-6 py-4 text-gray-900 font-medium">
                                                        {allSites.find(s => s.id === pay.site_id)?.name || '삭제된 사이트'}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold">{pay.amount.toLocaleString()}원</td>
                                                    <td className="px-6 py-4 uppercase">
                                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${pay.method === 'kakaopay' ? 'bg-yellow-100 text-yellow-800' :
                                                            pay.method === 'coupon' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {pay.method}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-400">{pay.coupon_code || '-'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold">내 사이트 관리</h1>
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">
                                {sites.length} / 10
                            </span>
                        </div>
                        <p className="text-gray-500">제작한 홈페이지를 관리하고 상태를 확인하세요.</p>
                    </div>
                    <Link href="/build" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5">
                        <Plus size={20} /> 새 사이트 만들기
                    </Link>
                </div>

                {sites.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Globe className="text-blue-500 w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">아직 만든 사이트가 없습니다</h3>
                        <p className="text-gray-500 mb-8">지금 바로 나만의 멋진 홈페이지를 만들어보세요!</p>
                        <Link href="/build" className="text-blue-600 font-bold hover:underline">시작하기 &rarr;</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sites.map((site) => (
                            <div key={site.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition group">
                                <div className="h-48 bg-gray-100 relative overflow-hidden">
                                    {site.hero_image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={site.hero_image_url} alt={site.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">이미지 없음</div>
                                    )}
                                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                        {allSiteAddons[site.id]?.map(addon => (
                                            <span key={addon} className="bg-white/90 backdrop-blur-md text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm border border-gray-100 flex items-center gap-1">
                                                {addon === 'inquiry' ? '📩 문의' : addon === 'qna' ? '❓ Q&A' : addon}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${site.status === 'active' ? 'bg-green-500' :
                                            site.status === 'paused' ? 'bg-orange-500' : 'bg-gray-500'
                                            }`}>
                                            {site.status === 'active' ? '게시됨' :
                                                site.status === 'paused' ? '일시 정지' : '작성 중 (비공개)'}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h2 className="text-xl font-bold mb-2 truncate">{site.name || '제목 없음'}</h2>
                                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px]">{site.description || '설명이 없습니다.'}</p>

                                    {site.is_paid && site.expires_at ? (
                                        <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-6 bg-blue-50 p-3 rounded-lg">
                                            <Clock size={16} />
                                            <span>만료일: {new Date(site.expires_at).toLocaleDateString()}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-6 bg-gray-50 p-3 rounded-lg">
                                            <AlertCircle size={16} />
                                            <span>
                                                {site.is_paid ? '👑 프리미엄' : '🎁 무료 체험'} | {formatTimeRemaining(site.expires_at, site.is_paid)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <Link href={`/site?id=${site.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg text-sm font-bold transition">
                                            <Eye size={16} /> 보기
                                        </Link>
                                        <Link href={`/build?edit=${site.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg text-sm font-bold transition">
                                            <Edit size={16} /> 수정
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <button
                                            onClick={() => openStore(site.id)}
                                            className="col-span-2 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
                                        >
                                            <ShoppingBag size={16} /> 애드온 스토어
                                        </button>
                                        {site.status !== 'draft' && (
                                            <button
                                                onClick={() => toggleStatus(site.id, site.status)}
                                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${site.status === 'paused'
                                                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                                    }`}
                                            >
                                                {site.status === 'paused' ? <><Play size={16} /> 재개</> : <><Pause size={16} /> 일시 게시 중지</>}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(site.id)}
                                            className="flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 py-2.5 rounded-lg text-sm font-bold transition col-span-1"
                                        >
                                            <Trash2 size={16} /> 삭제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add-on Store Modal */}
                {showStore && selectedSiteId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fadeIn">
                            <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <ShoppingBag size={24} className="text-yellow-400" /> 애드온 스토어
                                    </h3>
                                    <p className="text-gray-400 text-sm mt-1">필요한 기능을 골라 사이트를 업그레이드하세요.</p>
                                </div>
                                <button onClick={() => setShowStore(false)} className="text-gray-400 hover:text-white transition">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 bg-gray-50 max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-1 gap-4">
                                    {availableAddons.map(addon => {
                                        const isInstalled = siteAddons.includes(addon.id);
                                        const isPurchased = purchasedAddons[addon.id];
                                        return (
                                            <div key={addon.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-lg text-gray-900">{addon.name}</h4>
                                                        <p className="text-sm text-gray-500 mb-2">{addon.desc}</p>

                                                        {/* Purchase Status Badge */}
                                                        {isPurchased ? (
                                                            <div className="flex items-center gap-2 mb-2">
                                                                {isPurchased.purchase_type === 'coupon' ? (
                                                                    <span className="inline-block bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-xs font-bold">
                                                                        🎟️ 소유 중 (쿠폰: {isPurchased.coupon_code})
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-block bg-green-50 text-green-600 px-2 py-0.5 rounded text-xs font-bold">
                                                                        💎 소유 중 (결제)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="inline-block bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-bold">
                                                                {addon.price.toLocaleString()}원 (소유 시) / 체험 무료
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex items-center gap-2 ml-4">
                                                        {isInstalled ? (
                                                            <>
                                                                {/* Toggle Button */}
                                                                <button
                                                                    onClick={() => handleToggleAddon(addon.id, true)}
                                                                    className="px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                                                                    title="클릭하여 비활성화"
                                                                >
                                                                    <CheckCircle size={18} /> 사용 중
                                                                </button>

                                                                {/* Settings Button (only for inquiry) */}
                                                                {addon.id === 'inquiry' && (
                                                                    <button
                                                                        onClick={() => handleUpdateSettings(addon.id)}
                                                                        className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition"
                                                                        title="설정 변경"
                                                                    >
                                                                        ⚙️
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleInstallAddon(addon)}
                                                                className="px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 bg-black text-white hover:bg-gray-800 shadow-md transform active:scale-95"
                                                            >
                                                                <Plus size={18} /> 추가하기
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Email Input for Inquiry (only show when installed or adding) */}
                                                {addon.id === 'inquiry' && (
                                                    <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">알림 받을 이메일</label>
                                                        <input
                                                            type="email"
                                                            placeholder="example@email.com"
                                                            value={notificationEmail}
                                                            onChange={(e) => setNotificationEmail(e.target.value)}
                                                            className="w-full bg-transparent text-sm border-b border-gray-200 focus:border-blue-500 outline-none pb-1"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-sm text-yellow-800">
                                    <h5 className="font-bold flex items-center gap-2 mb-1"><AlertCircle size={14} /> 안내사항</h5>
                                    <p>무료 체험 기간(소유권 미보유) 중에는 모든 애드온을 <b>무료</b>로 설치하여 테스트할 수 있습니다.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && selectedAddon && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    🛍️ 애드온 구매
                                </h3>
                                <p className="text-blue-100 text-sm mt-1">{selectedAddon.name}</p>
                            </div>

                            <div className="p-6">
                                {/* Price Display */}
                                <div className="bg-gray-50 p-4 rounded-xl mb-6 text-center">
                                    <p className="text-sm text-gray-500">가격</p>
                                    <p className="text-3xl font-bold text-gray-900">{selectedAddon.price.toLocaleString()}원</p>
                                </div>

                                {/* Payment Method Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-3">💳 결제 방식 선택</label>

                                    <div className="space-y-3">
                                        <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="card"
                                                checked={paymentMethod === 'card'}
                                                onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'coupon')}
                                                className="w-4 h-4"
                                            />
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900">카드 결제</p>
                                                <p className="text-xs text-gray-500">{selectedAddon.price.toLocaleString()}원 (모의 결제)</p>
                                            </div>
                                        </label>

                                        <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'coupon' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="coupon"
                                                checked={paymentMethod === 'coupon'}
                                                onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'coupon')}
                                                className="w-4 h-4"
                                            />
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900">쿠폰 사용</p>
                                                <p className="text-xs text-gray-500">할인 쿠폰으로 무료 사용</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Coupon Input (only shown when coupon is selected) */}
                                {paymentMethod === 'coupon' && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">쿠폰 코드 입력</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="쿠폰 코드를 입력하세요"
                                                value={couponCode}
                                                onChange={(e) => {
                                                    setCouponCode(e.target.value);
                                                    setCouponMessage('');
                                                    setCouponValid(false);
                                                }}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                            />
                                            <button
                                                onClick={handleVerifyCoupon}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
                                            >
                                                확인
                                            </button>
                                        </div>
                                        {couponMessage && (
                                            <p className={`text-sm mt-2 ${couponValid ? 'text-green-600' : 'text-red-600'}`}>
                                                {couponMessage}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Refund Policy Notice */}
                                <div className="mt-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <h5 className="font-bold text-gray-800 flex items-center gap-2 text-sm mb-2">
                                        <AlertCircle size={14} className="text-gray-500" /> 환불 정책 안내
                                    </h5>
                                    <ul className="text-xs text-gray-600 space-y-1 ml-1 list-disc list-inside">
                                        <li>결제일로부터 13일 이내: <span className="font-bold text-blue-600">100% 무상 환불</span></li>
                                        <li>결제일로부터 13일 이후: <span className="font-bold text-red-500">환불 불가</span></li>
                                    </ul>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowPaymentModal(false)}
                                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleCompletePurchase}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition shadow-md"
                                    >
                                        구매하기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
