import SitePageClient from './SitePageClient';

// Required for static export with dynamic routes
export function generateStaticParams() {
    return [];
}

export default function SitePage() {
    return <SitePageClient />;
}
