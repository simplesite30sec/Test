'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import SiteViewer from '@/components/SiteViewer';

function SiteContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id') || '';
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!id) {
                setLoading(false);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('sites')
                    .select('*')
                    .eq('id', id)
                    .single();
                if (!error && data) {
                    setInitialData(data);
                }
            } catch {
                // Supabase fetch failed
            }
            setLoading(false);
        };
        loadData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    if (!id) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">사이트 ID가 필요합니다.</div>
            </div>
        );
    }

    return <SiteViewer initialData={initialData} id={id} />;
}

export default function SitePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
            <SiteContent />
        </Suspense>
    );
}
