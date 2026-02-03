'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function AdminDashboard({ userEmail }: { userEmail?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [requests, setRequests] = useState<any[]>([]);
    const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(true);

    const fetchRequests = useCallback(async () => {
        // Fetch domain requests
        const { data: addons, error: addonError } = await supabase
            .from('site_addons')
            .select(`
                *,
                sites ( id, name, slug, user_id )
            `)
            .eq('addon_type', 'domain')
            .order('created_at', { ascending: false });

        // Fetch manual payment requests
        const { data: payments, error: paymentError } = await supabase
            .from('payment_requests')
            .select(`
                *,
                sites ( id, name, slug, user_id )
            `)
            .order('created_at', { ascending: false });

        if (!addonError && addons && !paymentError && payments) {
            // Collect all user IDs to fetch emails
            const userIds = Array.from(new Set([
                ...(addons.map((r: any) => r.sites?.user_id) || []),
                ...(payments.map((r: any) => r.user_id) || [])
            ].filter(Boolean)));

            let emailMap: Record<string, string> = {};
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, email')
                    .in('id', userIds);
                if (profiles) {
                    profiles.forEach((p: any) => {
                        if (p.email) emailMap[p.id] = p.email;
                    });
                }
            }

            setRequests((addons || []).map((r: any) => ({
                ...r,
                user_email: emailMap[r.sites?.user_id]
            })));

            setPaymentRequests((payments || []).map((r: any) => ({
                ...r,
                user_email: emailMap[r.user_id]
            })));
        }
    }, []);

    const __OLD_fetchRequests_DELETE_ME = useCallback(async () => {
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

        if (!error && data) {
            // Fetch user emails from profiles table
            const userIds = Array.from(new Set(data.map((r: any) => r.sites?.user_id).filter(Boolean)));
            let emailMap: Record<string, string> = {};

            if (userIds.length > 0) {
                try {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, email')
                        .in('id', userIds);

                    if (profiles) {
                        profiles.forEach((p: any) => {
                            if (p.email) emailMap[p.id] = p.email;
                        });
                    }
                } catch (e) {
                    console.error('Failed to fetch emails', e);
                }
            }

            const requestsWithEmail = data.map((r: any) => ({
                ...r,
                user_email: emailMap[r.sites?.user_id]
            }));

            setRequests(requestsWithEmail);
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
            updated_at: new Date().toISOString(),
            expires_at: newStatus === 'active'
                ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                : targetReq.config?.expires_at
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

    const handleApprovePayment = async (req: any) => {
        if (!confirm('입금이 확인되었습니까? 승인 시 이용 권한이 즉시 부여됩니다.')) return;

        try {
            // 1. Process the benefit
            if (req.addon_type === 'site_extension') {
                // Fetch site to calculate extension
                const { data: site } = await supabase.from('sites').select('expires_at').eq('id', req.site_id).single();
                if (site) {
                    const currentExpire = new Date(site.expires_at).getTime();
                    const now = new Date().getTime();
                    const baseTime = currentExpire > now ? currentExpire : now;
                    const newExpire = new Date(baseTime + (365 * 24 * 60 * 60 * 1000)).toISOString();

                    await supabase.from('sites').update({
                        expires_at: newExpire,
                        is_paid: true
                    }).eq('id', req.site_id);
                }
                // Addon purchase
                // Fetch current addon to get existing expires_at
                const { data: existingAddon } = await supabase
                    .from('site_addons')
                    .select('config')
                    .eq('site_id', req.site_id)
                    .eq('addon_type', req.addon_type)
                    .single();

                let baseTime = Date.now();
                if (existingAddon?.config?.expires_at) {
                    const currentExp = new Date(existingAddon.config.expires_at).getTime();
                    if (currentExp > baseTime) baseTime = currentExp;
                }
                const expiresAt = new Date(baseTime + 365 * 24 * 60 * 60 * 1000).toISOString();

                await supabase.from('site_addons').upsert({
                    site_id: req.site_id,
                    addon_type: req.addon_type,
                    config: { expires_at: expiresAt },
                    is_active: true,
                    is_purchased: true,
                    purchase_type: 'manual',
                    purchased_at: new Date().toISOString()
                }, { onConflict: 'site_id,addon_type' });
            }

            // 2. Mark request as approved
            await supabase.from('payment_requests').update({
                status: 'approved',
                approved_at: new Date().toISOString()
            }).eq('id', req.id);

            alert('승인 완료되었습니다.');
            fetchRequests();
        } catch (e) {
            console.error(e);
            alert('승인 중 오류 발생');
        }
    };

    const handleRejectPayment = async (requestId: string) => {
        const reason = prompt('거절 사유를 입력해주세요 (예: 입금자명 불일치):');
        if (!reason) return;

        await supabase.from('payment_requests').update({
            status: 'rejected',
            reason: reason
        }).eq('id', requestId);

        alert('거절 처리되었습니다.');
        fetchRequests();
    };

    if (userEmail !== 'inmyeong320@naver.com') return null;

    return (
        <div className="space-y-6">
            {/* Payment Requests Section */}
            <div className="bg-white rounded-xl border-2 border-green-100 shadow-sm overflow-hidden text-sm">
                <div
                    className="bg-green-50 p-4 flex justify-between items-center cursor-pointer hover:bg-green-100 transition"
                    onClick={() => setIsPaymentOpen(!isPaymentOpen)}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">💰</span>
                        <div>
                            <h2 className="font-bold text-green-900">입금 확인 및 승인 ({paymentRequests.filter(r => r.status === 'pending').length}건 대기)</h2>
                            <p className="text-xs text-green-700">무통장 입금 요청을 확인하고 이용 권한을 부여합니다.</p>
                        </div>
                    </div>
                    <button className="text-green-600 font-bold text-sm">
                        {isPaymentOpen ? '접기 ▲' : '열기 ▼'}
                    </button>
                </div>

                {isPaymentOpen && (
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase font-medium border-b text-[11px]">
                                <tr>
                                    <th className="p-4">입금 정보</th>
                                    <th className="p-4">신청 항목 / 금액</th>
                                    <th className="p-4">증빙 서류</th>
                                    <th className="p-4">상태</th>
                                    <th className="p-4">작업</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {paymentRequests.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">결제 요청 내역 없음</td></tr>
                                ) : paymentRequests.map((req) => (
                                    <tr key={req.id} className={`${req.status === 'pending' ? 'bg-orange-50/30' : ''} hover:bg-gray-50 transition`}>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 mb-1">입금자: {req.deposit_name}</div>
                                            <div className="text-[11px] text-gray-500 mb-1">📞 {req.contact}</div>
                                            <div className="text-[10px] text-indigo-600 font-bold">📧 {req.user_email}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs font-bold text-gray-900 mb-1">
                                                {req.addon_type === 'site_extension' ? '📍 사이트 1년 연장' :
                                                    req.addon_type === 'qna' ? '💬 Q&A 게시판' :
                                                        req.addon_type === 'domain' ? '🌐 도메인 연결' : req.addon_type}
                                            </div>
                                            <div className="text-xs text-gray-500">{req.amount.toLocaleString()}원</div>
                                            <div className="text-[10px] text-gray-400 mt-1">사이트: {req.sites?.name} ({req.sites?.slug})</div>
                                        </td>
                                        <td className="p-4">
                                            {req.receipt_type === 'none' ? (
                                                <span className="text-[10px] text-gray-400">미발행</span>
                                            ) : (
                                                <div className="text-[10px]">
                                                    <div className="font-bold text-indigo-600 uppercase mb-0.5">
                                                        {req.receipt_type === 'personal' ? '현금영수증' : '사업자지출증빙'}
                                                    </div>
                                                    <div className="text-gray-600">{req.receipt_info}</div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {req.status === 'approved' ? '승인 완료' : req.status === 'rejected' ? '거절됨' : '입금 대기'}
                                            </span>
                                            {req.reason && <div className="text-[9px] text-red-500 mt-1">사유: {req.reason}</div>}
                                        </td>
                                        <td className="p-4">
                                            {req.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleApprovePayment(req)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs shadow-sm font-bold">
                                                        입금 확인/승인
                                                    </button>
                                                    <button onClick={() => handleRejectPayment(req.id)} className="bg-white border border-red-200 text-red-600 px-3 py-1 rounded hover:bg-red-50 text-xs shadow-sm">
                                                        거절
                                                    </button>
                                                </div>
                                            )}
                                            {req.approved_at && (
                                                <div className="text-[9px] text-gray-400">
                                                    승인일: {new Date(req.approved_at).toLocaleString()}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Existing Domain Management Section */}
            <div className="bg-white rounded-xl border-2 border-indigo-100 shadow-sm overflow-hidden text-sm">
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
                                        <th className="p-4 w-1/4">신청 도메인 / 사용자</th>
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
                                                <div className="font-bold text-gray-900 break-all mb-1">{req.config?.domain || 'Unknown Domain'}</div>
                                                {req.user_email ? (
                                                    <div className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-1 rounded inline-block mb-1">
                                                        📧 {req.user_email}
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-gray-500 mb-1">USER: {req.sites?.user_id?.substring(0, 8)}...</div>
                                                )}
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
        </div>
    );
}
