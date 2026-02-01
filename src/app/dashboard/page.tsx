'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { Edit, Eye, Pause, Play, Trash2, Clock, Globe, Plus, AlertCircle } from 'lucide-react';

type Site = {
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'active' | 'paused';
    expires_at: string;
    is_paid: boolean;
    hero_image_url: string;
    created_at: string;
};

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuthAndLoadSites = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            const { data, error } = await supabase
                .from('sites')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setSites(data as Site[]);
            setLoading(false);
        };
        checkAuthAndLoadSites();
    }, [router]);

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
        } else {
            alert("상태 변경 실패");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까? 복구할 수 없습니다.")) return;

        const { error } = await supabase.from('sites').delete().eq('id', id);
        if (!error) {
            setSites(sites.filter(s => s.id !== id));
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">내 사이트 관리</h1>
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
                                            <span>무료 체험 / 결제 필요</span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <Link href={`/site?id=${site.id}`} className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg text-sm font-bold transition">
                                            <Eye size={16} /> 보기
                                        </Link>
                                        <Link href={`/build?edit=${site.id}`} className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg text-sm font-bold transition">
                                            <Edit size={16} /> 수정
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        {site.status !== 'draft' && (
                                            <button
                                                onClick={() => toggleStatus(site.id, site.status)}
                                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${site.status === 'paused'
                                                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                                    }`}
                                            >
                                                {site.status === 'paused' ? <><Play size={16} /> 재개</> : <><Pause size={16} /> 일시 정지</>}
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
            </main>
        </div>
    );
}
