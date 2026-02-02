'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function AdminDashboard({ userEmail }: { userEmail?: string }) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (userEmail === 'inmyeong320@naver.com') {
            fetchRequests();
        }
    }, [userEmail]);

    const fetchRequests = async () => {
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

        if (!error) {
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
                is_active: newStatus === 'active'
            })
            .eq('id', id);

        if (error) {
            alert('업데이트 실패: ' + error.message);
        } else {
            alert('업데이트 완료');
            fetchRequests();
        }
    };

    if (userEmail !== 'inmyeong320@naver.com') return null;

    return (
        <div className="bg-white rounded-xl border-2 border-indigo-100 shadow-sm overflow-hidden mb-8">
            <div
                className="bg-indigo-50 p-4 flex justify-between items-center cursor-pointer hover:bg-indigo-100 transition"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-2xl">👮‍♂️</span>
                    <div>
                        <h2 className="font-bold text-indigo-900">관리자 대시보드 (도메인 관리)</h2>
                        <p className="text-xs text-indigo-700">신청된 도메인 연결 요청을 관리합니다.</p>
                    </div>
                </div>
                <button className="text-indigo-600 font-bold text-sm">
                    {isOpen ? '접기 ▲' : '열기 ▼'}
                </button>
            </div>

            {isOpen && (
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left border-t border-indigo-100">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-medium border-b">
                            <tr>
                                <th className="p-4 w-1/4">신청 도메인</th>
                                <th className="p-4 w-1/6">상태</th>
                                <th className="p-4 w-1/6">신청일</th>
                                <th className="p-4 w-1/6">사이트</th>
                                <th className="p-4">작업</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">신청 내역 없음</td></tr>
                            ) : requests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{req.config?.domain}</div>
                                        <div className="text-xs text-gray-400">ID: {req.id.substring(0, 8)}...</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${req.config?.status === 'active' ? 'bg-green-100 text-green-700' :
                                            req.config?.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {req.config?.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500">
                                        {new Date(req.config?.requested_at || req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-xs text-gray-900 font-medium">
                                        {req.sites?.name}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            {req.config?.status !== 'active' && (
                                                <button onClick={() => updateStatus(req.id, 'active')} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs shadow-sm">
                                                    연결 완료
                                                </button>
                                            )}
                                            {req.config?.status !== 'cancelled' && (
                                                <button onClick={() => updateStatus(req.id, 'cancelled')} className="bg-white border border-red-200 text-red-600 px-3 py-1 rounded hover:bg-red-50 text-xs">
                                                    취소
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
