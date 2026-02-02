import { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@/utils/supabase/client';
import SiteViewer from '@/components/SiteViewer';

type Props = {
    searchParams: { [key: string]: string | string[] | undefined }
}

// Fetch helper (Server-side)
async function getSiteData(id: string) {
    if (!id) return null;
    const supabase = createClient();
    const { data } = await supabase.from('sites').select('*').eq('id', id).single();
    return data;
}

// Dynamic Metadata Generation
export async function generateMetadata(
    { searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = searchParams.id as string;
    const site = await getSiteData(id);

    // Fallback if no site found
    if (!site) {
        return {
            title: 'SimpleSite - 존재하지 않는 페이지',
            description: '요청하신 페이지를 찾을 수 없습니다.',
        };
    }

    const previousImages = (await parent).openGraph?.images || [];
    const heroImage = site.hero_image_url || [];

    return {
        title: site.name,
        description: site.description || site.slogan || 'SimpleSite로 제작된 홈페이지입니다.',
        openGraph: {
            title: site.name,
            description: site.description || site.slogan,
            images: site.hero_image_url ? [site.hero_image_url, ...previousImages] : previousImages,
        },
    };
}

export default async function SitePage({ searchParams }: Props) {
    const id = searchParams.id as string;

    // Server-side Fetch for Initial Data (Faster LCP)
    const siteData = await getSiteData(id);

    return (
        <SiteViewer
            initialData={siteData}
            id={id}
            expiresAt={siteData?.expires_at}
            isPaid={siteData?.is_paid}
        />
    );
}
