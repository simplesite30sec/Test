'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import SiteViewer from '@/components/SiteViewer';
import { useParams } from 'next/navigation';

export default function SitePage() {
    const params = useParams();
    const id = params.id as string;
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
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
        if (id) {
            loadData();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    return <SiteViewer initialData={initialData} id={id} />;
}

// Required for static export - sites are generated dynamically at runtime
export function generateStaticParams() {
    return [];
}
