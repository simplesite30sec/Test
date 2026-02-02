import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/client';
import SiteViewer from '@/components/SiteViewer';
import { notFound } from 'next/navigation';

export const runtime = 'edge';

type Props = {
    params: { slug: string }
};

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const slug = params.slug;
    const supabase = createClient();

    // Fetch site data for metadata
    const { data: site } = await supabase
        .from('sites')
        .select('name, description, hero_image_url')
        .eq('slug', slug)
        .single();

    if (!site) {
        return {
            title: 'Site Not Found',
        };
    }

    return {
        title: site.name,
        description: site.description || 'Welcome to my website',
        openGraph: {
            title: site.name,
            description: site.description || '',
            images: site.hero_image_url ? [site.hero_image_url] : [],
        },
    };
}

export default async function SlugPage({ params }: Props) {
    const slug = params.slug;
    const supabase = createClient();

    // Find site ID by slug
    const { data: site, error } = await supabase
        .from('sites')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !site) {
        notFound();
    }

    // Pass to SiteViewer (Client Component)
    // Cast site to any to match SiteData if types slightly mismatch (e.g. optional fields)
    // or just pass it. Supabase returns types matching DB.
    return (
        <SiteViewer
            id={site.id}
            initialData={site}
            expiresAt={site.expires_at}
            isPaid={site.is_paid}
        />
    );
}
