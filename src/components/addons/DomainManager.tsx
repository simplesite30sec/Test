'use client';

import { useState } from 'react';
import { Search, CheckCircle, XCircle, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

export default function DomainManager({ siteId }: { siteId: string }) {
    const [domain, setDomain] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [result, setResult] = useState<{ available: boolean; domain: string } | null>(null);
    const [requesting, setRequesting] = useState(false);

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
        if (!confirm(`${result?.domain} 도메인을 구매 신청하시겠습니까?\n비용: 35,000원 (1년)`)) return;

        setRequesting(true);

        // TODO: PortOne Payment Implementation Here
        // For MVP, we save "Pending Payment" addon and alert user to wire transfer or mock payment.

        const { error } = await supabase.from('site_addons').insert({
            site_id: siteId,
            addon_type: 'domain',
            is_active: false, // Pending admin approval/payment
            config: {
                domain: result?.domain,
                status: 'pending_payment',
                price: 35000
            }
        });

        if (error) {
            alert('신청 실패: ' + error.message);
        } else {
            alert('도메인 구매 신청이 접수되었습니다!\n관리자가 확인 후 연락드립니다.');
            setResult(null);
            setDomain('');
        }
        setRequesting(false);
    };

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
                            <div className="bg-white/50 p-3 rounded-lg text-xs text-green-800 mb-4">
                                <strong>⚠️ 프리미엄 도메인 안내</strong><br />
                                만약 선택하신 도메인이 &apos;프리미엄(고가)&apos; 도메인일 경우, <br />
                                구매가 취소되거나 추가 비용이 발생할 수 있습니다.
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

            <p className="text-xs text-gray-400 mt-2">
                * .com, .net, .co.kr 등 일반적인 도메인 구매가 가능합니다.<br />
                * 구매 완료 후 사이트에 자동 연결됩니다.
            </p>
        </div>
    );
}
