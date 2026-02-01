'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { MessageCircle, Send, Lock, Unlock } from 'lucide-react';

type Post = {
    id: string;
    title: string;
    content: string;
    author_name: string;
    created_at: string;
    is_secret: boolean;
};

export default function QnABoard({ siteId, canManage }: { siteId: string, canManage: boolean }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '', author: '익명', isSecret: false, password: '' });

    useEffect(() => {
        loadPosts();
    }, [siteId]);

    const loadPosts = async () => {
        const { data } = await supabase
            .from('site_posts')
            .select('*')
            .eq('site_id', siteId)
            .eq('type', 'qna')
            .order('created_at', { ascending: false });
        if (data) setPosts(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('site_posts').insert({
            site_id: siteId,
            type: 'qna',
            title: newPost.title,
            content: newPost.content,
            author_name: newPost.author,
            is_secret: newPost.isSecret,
            password: newPost.password
        });

        if (!error) {
            alert('질문이 등록되었습니다.');
            setShowForm(false);
            setNewPost({ title: '', content: '', author: '익명', isSecret: false, password: '' });
            loadPosts();
        } else {
            alert('등록 실패');
        }
    };

    return (
        <section className="py-20 bg-white">
            <div className="max-w-4xl mx-auto px-6">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Q&A 게시판</h2>
                        <p className="text-gray-500">궁금한 점을 남겨주세요.</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-black transition flex items-center gap-2"
                    >
                        <MessageCircle size={18} /> 질문하기
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="mb-12 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input
                                placeholder="작성자명"
                                className="px-4 py-3 rounded-xl border border-gray-200"
                                value={newPost.author}
                                onChange={e => setNewPost({ ...newPost, author: e.target.value })}
                                required
                            />
                            <input
                                type="password"
                                placeholder="비밀번호 (수정/삭제용)"
                                className="px-4 py-3 rounded-xl border border-gray-200"
                                value={newPost.password}
                                onChange={e => setNewPost({ ...newPost, password: e.target.value })}
                                required
                            />
                        </div>
                        <input
                            placeholder="제목"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4"
                            value={newPost.title}
                            onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                            required
                        />
                        <textarea
                            placeholder="내용을 입력하세요..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4 h-32"
                            value={newPost.content}
                            onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                            required
                        />
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newPost.isSecret}
                                    onChange={e => setNewPost({ ...newPost, isSecret: e.target.checked })}
                                />
                                <Lock size={14} /> 비밀글로 작성
                            </label>
                            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
                                등록하기
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-3">
                    {posts.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl">
                            아직 등록된 질문이 없습니다.
                        </div>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="p-5 border border-gray-100 rounded-xl hover:bg-gray-50 transition cursor-pointer group">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {post.is_secret ? <Lock size={14} className="text-gray-400" /> : <Unlock size={14} className="text-gray-400" />}
                                            <h3 className="font-bold text-gray-800">
                                                {post.is_secret && !canManage ? '비밀글입니다.' : post.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {post.author_name} · {new Date(post.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {canManage && (
                                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold opacity-0 group-hover:opacity-100 transition">관리자 권한</span>
                                    )}
                                </div>
                                {(canManage || !post.is_secret) && (
                                    <p className="mt-3 text-gray-600 text-sm pl-6 border-l-2 border-gray-200">
                                        {post.content}
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
