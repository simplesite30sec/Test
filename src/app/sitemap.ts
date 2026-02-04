import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createClient();
    const baseUrl = 'https://30site.com';

    // Fetch all site slugs
    const { data: sites } = await supabase
        .from('sites')
        .select('slug, updated_at')
        .not('slug', 'is', null);

    const siteUrls = (sites || []).map((site) => ({
        url: `${baseUrl}/${site.slug}`,
        lastModified: site.updated_at ? new Date(site.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...siteUrls,
    ];
}
