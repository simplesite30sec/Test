
import { supabase } from '@/utils/supabase/client';
import SiteViewer from '@/components/SiteViewer';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;
export const runtime = 'edge';

export default async function SitePage({ params }: { params: { id: string } }) {
    let site = null;
    try {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .eq('id', params.id)
            .single();
        if (!error) site = data;
    } catch {
        // Supabase fetch failed (e.g. invalid URL or offline)
    }

    // We pass null if site is not found on server, allowing Client Component to check LocalStorage
    return <SiteViewer initialData={site} id={params.id} />;
}
