'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function AdminDashboard({ userEmail }: { userEmail?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [requests, setRequests] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const fetchRequests = useCallback(async () => {
        const { data, error } = await supabase
            .from('site_addons')
            .select(`
                *,
                sites ( 
                    name, 
                    slug,
                    user_id 
                )
            `)
            .eq('addon_type', 'domain')
            .order('created_at', { ascending: false });

        if (!error) {
            setRequests(data || []);
        }
    }, []);

    useEffect(() => {
        if (userEmail === 'inmyeong320@naver.com') {
            fetchRequests();
        }
    }, [userEmail, fetchRequests]);

    const updateStatus = async (id: string, newStatus: string) => {
        let reason = '';
        if (newStatus === 'cancelled') {
            reason = prompt('거절/취소 사유를 입력해주세요(예: 도메인 형식 오류):') || '';
            if (!reason) {
                alert('사유를 입력해야 취소 처리가 가능합니다.');
                return;
            }
        } else {
            if (!confirm(`상태를 '${newStatus}'로 변경하시겠습니까?`)) return;
        }

        const targetReq = requests.find(r => r.id === id);
        if (!targetReq) return;

        const updatedConfig = {
            ...(targetReq.config || {}),
            status: newStatus,
            reason: reason || targetReq.config?.reason || '',
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
        <div className="bg-white rounded-xl border-2 border-indigo-100 shadow-sm overflow-hidden mb-8 text-sm">
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
                <>
                    <div className="p-6 bg-gray-50 border-b border-indigo-100 font-sans">
                        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm max-w-2xl">
                            <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                <span>📖</span> 도메인 연결 매뉴얼 (관리자용)
                            </h3>
                            <div className="text-xs text-indigo-800 space-y-3 leading-relaxed">
                                <p>1. <b>도메인 구매</b>: <a href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600">Cloudflare Registrar</a>에서 사용자가 요청한 도메인을 직접 검색하여 구매합니다.</p>
                                <p>2. <b>도메인 활성화</b>: 구매한 도메인이 내 Cloudflare 계정에 등록되면 자동으로 DNS 설정이 가능해집니다.</p>
                                <p>3. <b>클라우드플레어 페이지 연결</b>: Cloudflare Pages 대시보드 ➔ 프로젝트 선택 ➔ <b>Custom Domains ➔ [Set up a custom domain]</b> 버튼을 눌러 구매한 도메인을 입력하고 연결합니다.</p>
                                <p>4. <b>최종 승인</b>: 도메인 상태가 <b>Active</b>가 되면 아래 표에서 <b>[연결 완료]</b> 버튼을 눌러 사용자에게 알립니다.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-t border-indigo-100">
                            <thead className="bg-gray-50 text-gray-500 uppercase font-medium border-b text-[11px]">
                                <tr>
                                    <th className="p-4 w-1/4">신청 도메인 / ID</th>
                                    <th className="p-4 w-1/6">사이트 (슬러그)</th>
                                    <th className="p-4 w-1/8">상태</th>
                                    <th className="p-4 w-1/8">신청일</th>
                                    <th className="p-4">작업</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {requests.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">신청 내역 없음</td></tr>
                                ) : requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 break-all">{req.config?.domain || 'Unknown Domain'}</div>
                                            <div className="text-[10px] text-gray-400">Addon ID: {req.id.substring(0, 8)}...</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs font-bold text-gray-900 mb-1">{req.sites?.name || 'Unnamed Site'}</div>
                                            <a
                                                href={`/${req.sites?.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-blue-600 hover:bg-blue-50 transition flex items-center gap-1 w-fit"
                                            >
                                                /{req.sites?.slug || 'no-slug'} 🔗
                                            </a>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${req.config?.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    req.config?.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' :
                                                        req.config?.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {req.config?.status === 'active' ? '연결 완료' :
                                                        req.config?.status === 'cancelled' ? '취소/거절됨' :
                                                            req.config?.status === 'pending_payment' ? '신청/결제대기' : req.config?.status}
                                                </span>
                                                {req.config?.reason && (
                                                    <div className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 max-w-[120px] truncate" title={req.config.reason}>
                                                        사유: {req.config.reason}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-[11px] text-gray-500">
                                            {new Date(req.config?.requested_at || req.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {req.config?.status !== 'active' && req.config?.status !== 'cancelled' && (
                                                    <button onClick={() => updateStatus(req.id, 'active')} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs shadow-sm font-bold">
                                                        연결 완료
                                                    </button>
                                                )}
                                                {req.config?.status === 'cancelled' && (
                                                    <button onClick={() => updateStatus(req.id, 'pending_payment')} className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-xs shadow-sm font-bold">
                                                        재오픈
                                                    </button>
                                                )}
                                                {req.config?.status !== 'cancelled' && (
                                                    <button onClick={() => updateStatus(req.id, 'cancelled')} className="bg-white border border-red-200 text-red-600 px-3 py-1 rounded hover:bg-red-50 text-xs shadow-sm">
                                                        취소/거절
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
