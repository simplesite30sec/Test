'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export default function UserStatusBadge() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        checkAuth();
    }, []);

    if (loading) return null;

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <p className="text-xs text-gray-500">환영합니다!</p>
                    <p className="text-sm font-bold text-gray-900">{user.email?.split('@')[0]}님</p>
                </div>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition text-sm font-bold shadow-lg"
                >
                    <span>내 사이트 관리</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition">
                로그인
            </Link>
            <Link href="/login" className="text-sm font-bold bg-black text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition shadow-lg">
                1개월 무료 체험
            </Link>
        </div>
    );
}
