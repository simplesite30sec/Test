'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        // Check for specific admin email
        if (user?.email !== 'inmyeong320@naver.com') {
            alert('관리자만 접근 가능합니다.');
            router.push('/');
        } else {
            setIsAdmin(true);
            fetchRequests();
        }
    };

    const fetchRequests = async () => {
        // Fetch domain addons + site info
        const { data, error } = await supabase
            .from('site_addons')
            .select(`
                *,
                sites ( 
                    name, 
                    user_id 
                )
            `)
            .eq('addon_type', 'domain')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch error:', error);
            alert('데이터 로딩 실패');
        } else {
            console.log('Fetched:', data);
            setRequests(data || []);
        }
        setLoading(false);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        if (!confirm(`상태를 '${newStatus}'로 변경하시겠습니까?`)) return;

        const targetReq = requests.find(r => r.id === id);
        if (!targetReq) return;

        const updatedConfig = {
            ...targetReq.config,
            status: newStatus,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('site_addons')
            .update({
                config: updatedConfig,
                is_active: newStatus === 'active' // Set is_active to true if connected
            })
            .eq('id', id);

        if (error) {
            alert('업데이트 실패: ' + error.message);
        } else {
            alert('업데이트 완료');
            fetchRequests(); // verifyRefresh
        }
    };

    if (loading) return <div className="p-10 flex justify-center text-gray-500">Loading Admin...</div>;
    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-10">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-gray-900">🔧 관리자 대시보드 (도메인)</h1>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-medium border-b">
                            <tr>
                                <th className="p-4 w-1/4">신청 도메인</th>
                                <th className="p-4 w-1/6">현재 상태</th>
                                <th className="p-4 w-1/6">신청일 (가격)</th>
                                <th className="p-4 w-1/6">사이트 정보</th>
                                <th className="p-4">관리 작업</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">
                                        신청 내역이 없습니다.
                                    </td>
                                </tr>
                            ) : requests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="font-bold text-lg text-gray-900">{req.config?.domain}</div>
                                        <div className="text-xs text-gray-400 mt-1">ID: {req.id}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${req.config?.status === 'active' ? 'bg-green-100 text-green-700' :
                                                req.config?.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' :
                                                    req.config?.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-600'
                                            }`}>
                                            {req.config?.status === 'pending_payment' ? '⏳ 신청 접수' :
                                                req.config?.status === 'active' ? '✅ 연결 완료' :
                                                    req.config?.status === 'cancelled' ? '🚫 취소됨' : req.config?.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div>{new Date(req.config?.requested_at || req.created_at).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{new Date(req.config?.requested_at || req.created_at).toLocaleTimeString()}</div>
                                        <div className="mt-1 font-bold text-blue-600">₩{(req.config?.price || 35000).toLocaleString()}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{req.sites?.name || 'Unknown Site'}</div>
                                        <div className="text-xs text-gray-400">Site ID: {req.site_id.substring(0, 8)}...</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-2 items-start">
                                            {req.config?.status !== 'active' && req.config?.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => updateStatus(req.id, 'active')}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition w-full"
                                                >
                                                    ✅ 연결 완료 처리
                                                </button>
                                            )}
                                            {req.config?.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => updateStatus(req.id, 'cancelled')}
                                                    className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium transition w-full"
                                                >
                                                    🚫 취소/환불 표시
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigator.clipboard.writeText(req.config?.domain)}
                                                className="text-xs text-gray-400 hover:text-gray-600 underline"
                                            >
                                                도메인 복사
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mt-4 text-xs text-gray-400 text-center">
                    * '연결 완료 처리'를 누르면 사용자 대시보드에서도 '연결 완료'로 표시됩니다. 실제로 도메인 연결 설정 후 눌러주세요.
                </p>
            </div>
        </div>
    );
}
