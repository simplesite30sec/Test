'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Send, Mail } from 'lucide-react';

export default function InquiryForm({ siteId }: { siteId: string }) {
    const [formData, setFormData] = useState({ name: '', contact: '', message: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        const { error } = await supabase.from('site_inquiries').insert({
            site_id: siteId,
            name: formData.name,
            contact: formData.contact,
            message: formData.message
        });

        setSending(false);

        if (!error) {
            alert('문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.');
            setFormData({ name: '', contact: '', message: '' });
        } else {
            alert('전송 실패. 잠시 후 다시 시도해주세요.');
        }
    };

    return (
        <section className="py-20 bg-gray-50" id="inquiry">
            <div className="max-w-2xl mx-auto px-6">
                <div className="text-center mb-10">
                    <span className="bg-white text-gray-500 px-3 py-1 rounded-full text-xs font-bold border border-gray-200 mb-4 inline-block shadow-sm">
                        CONTACT US
                    </span>
                    <h2 className="text-3xl font-bold mb-2">문의하기</h2>
                    <p className="text-gray-500">궁금한 점이 있으시면 언제든지 문의해주세요.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">이름</label>
                            <input
                                placeholder="홍길동"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">연락처</label>
                            <input
                                placeholder="010-0000-0000"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
                                value={formData.contact}
                                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">문의 내용</label>
                        <textarea
                            placeholder="문의하실 내용을 입력해주세요..."
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none h-40 resize-none"
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={sending}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2"
                    >
                        {sending ? '전송 중...' : <><Send size={18} /> 문의 보내기</>}
                    </button>
                </form>
            </div>
        </section>
    );
}
