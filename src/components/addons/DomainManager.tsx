'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, XCircle, CreditCard, Loader2, Clock, ShieldAlert } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

export default function DomainManager({ siteId }: { siteId: string }) {
    const [domain, setDomain] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [result, setResult] = useState<{ available: boolean; domain: string } | null>(null);
    const [requesting, setRequesting] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [currentAddon, setCurrentAddon] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadStatus = useCallback(async () => {
        const { data } = await supabase
            .from('site_addons')
            .select('*')
            .eq('site_id', siteId)
            .eq('addon_type', 'domain')
            .single();
        setCurrentAddon(data);
        setLoading(false);
    }, [siteId]);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    const checkDomain = async () => {
        if (!domain) return;
        setIsSearching(true);
        setResult(null);

        try {
            const res = await fetch(`/api/domain-check?domain=${domain}`);
            const data = await res.json();
            if (data.domain) {
                setResult({ available: data.available, domain: data.domain });
            } else {
                alert(data.error || '검색 실패');
            }
        } catch (e) {
            console.error(e);
            alert('검색 중 오류가 발생했습니다.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleRequest = async () => {
        if (!confirm(`${result?.domain} 도메인을 구매 신청하시겠습니까?\n(⚠️ 구매 즉시 환불이 불가능합니다)`)) return;

        setRequesting(true);

        const { error } = await supabase.from('site_addons').upsert({
            site_id: siteId,
            addon_type: 'domain',
            is_active: false, // Pending admin approval/payment
            config: {
                domain: result?.domain,
                status: 'pending_payment',
                price: 35000,
                requested_at: new Date().toISOString()
            }
        }, { onConflict: 'site_id, addon_type' });

        if (error) {
            alert('신청 실패: ' + error.message);
        } else {
            alert('도메인 구매 신청이 접수되었습니다!\n최대 24시간 이내에 연결됩니다.');
            loadStatus();
            setResult(null);
            setDomain('');
        }
        setRequesting(false);
    };

    if (loading) return <div className="p-6 text-center text-gray-400">Loading...</div>;

    if (currentAddon) {
        const config = currentAddon.config || {};
        const status = config.status || 'pending_payment';

        return (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Search size={20} /> 도메인 연결 상태
                </h3>

                {status === 'active' ? (
                    <div className="bg-green-50 border border-green-100 p-6 rounded-xl flex items-start gap-4 animate-fadeIn">
                        <CheckCircle className="text-green-600 mt-1 shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-green-900 text-lg mb-1">도메인 연결이 완료되었습니다!</h4>
                            <p className="text-green-800 mb-3">
                                연결 도메인: <a href={`https://${config.domain}`} target="_blank" rel="noopener noreferrer" className="font-mono text-lg underline">{config.domain}</a>
                            </p>
                            <p className="text-sm text-green-700 italic">이제 전 세계에서 해당 주소로 접속 가능합니다.</p>
                        </div>
                    </div>
                ) : status === 'cancelled' ? (
                    <div className="bg-red-50 border border-red-100 p-6 rounded-xl flex items-start gap-4 animate-fadeIn">
                        <ShieldAlert className="text-red-600 mt-1 shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-red-900 text-lg mb-1">도메인 연결이 거절/취소되었습니다.</h4>
                            <div className="bg-white/60 p-4 rounded-lg border border-red-200 mb-4">
                                <p className="text-sm font-bold text-red-800 mb-1">거절/취소 사유:</p>
                                <p className="text-red-700">{config.reason || '사유가 입력되지 않았습니다.'}</p>
                            </div>
                            <button
                                onClick={async () => {
                                    if (confirm('요청 내역을 초기화하고 다시 신청하시겠습니까?')) {
                                        const { error } = await supabase.from('site_addons').delete().eq('id', currentAddon.id);
                                        if (error) alert('삭제 실패: ' + error.message);
                                        else loadStatus();
                                    }
                                }}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition"
                            >
                                다시 신청하기
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl flex items-start gap-4 animate-fadeIn">
                        <Clock className="text-blue-600 mt-1 shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-blue-900 text-lg mb-1">도메인 연결 진행 중입니다.</h4>
                            <p className="text-blue-800 mb-3">
                                신청 도메인: <b className="font-mono text-lg">{config.domain}</b>
                            </p>
                            <div className="bg-white/60 p-3 rounded-lg text-sm text-blue-700">
                                <p>⏳ 최대 24시간 소요됩니다.</p>
                                <p>관리자가 승인 및 연결 작업을 진행하고 있습니다.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Search size={20} /> 도메인 연결/구매
            </h3>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value.toLowerCase())}
                    placeholder="example.com"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && checkDomain()}
                />
                <button
                    onClick={checkDomain}
                    disabled={isSearching || !domain}
                    className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition"
                >
                    {isSearching ? <Loader2 className="animate-spin" /> : '검색'}
                </button>
            </div>

            {result && (
                <div className={`p-4 rounded-xl mb-4 ${result.available ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                    <div className="flex items-center gap-3">
                        {result.available ? (
                            <CheckCircle className="text-green-600 w-6 h-6" />
                        ) : (
                            <XCircle className="text-red-600 w-6 h-6" />
                        )}
                        <div>
                            <p className={`font-bold ${result.available ? 'text-green-800' : 'text-red-800'}`}>
                                {result.domain} {result.available ? '구매 가능!' : '이미 사용 중입니다.'}
                            </p>
                            {result.available && (
                                <div className="text-sm text-green-700 mt-2 space-y-1">
                                    <p>✅ 가격: 35,000원 / 1년 (구매 즉시 유효)</p>
                                    <p className="text-red-600 font-bold">🚫 도메인은 구매 후 환불이 절대 불가능합니다.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {result.available && (
                        <div className="mt-4 pt-4 border-t border-green-200">
                            <div className="bg-white/50 p-3 rounded-lg text-xs text-green-800 mb-4 flex items-start gap-2">
                                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                                <div>
                                    <strong>프리미엄(고가) 도메인 안내</strong><br />
                                    만약 선택하신 도메인이 &apos;프리미엄&apos;일 경우, 구매가 자동 취소되고 전액 환불됩니다.<br />
                                    (희귀 도메인은 가격이 상이하여 안전을 위해 자동 취소됩니다.)
                                </div>
                            </div>
                            <button
                                onClick={handleRequest}
                                disabled={requesting}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                            >
                                {requesting ? '처리 중...' : <><CreditCard size={18} /> 구매 신청하기 (35,000원)</>}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="text-xs text-gray-400 mt-2 space-y-1">
                <p>* .com, .net, .co.kr 등 일반적인 도메인 구매가 가능합니다.</p>
                <p>* 구매 완료 후 사이트에 자동 연결됩니다.</p>
            </div>
        </div>
    );
}
