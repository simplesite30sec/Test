import { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@/utils/supabase/client';
import SiteViewer from '@/components/SiteViewer';
import { notFound } from 'next/navigation';

export const runtime = 'edge';

type Props = {
    params: { slug: string }
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
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
        .select('id, status')
        .eq('slug', slug)
        .single();

    if (error || !site) {
        notFound();
    }

    // Pass to SiteViewer (Client Component)
    // Note: SiteViewer checks ownership/status internally, but we can do a quick check here too?
    // Usually SiteViewer handles proper "Draft/Private" screens.

    return <SiteViewer id={site.id} initialData={null} />;
}
