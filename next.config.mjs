/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    trailingSlash: true,
    experimental: {
        optimizePackageImports: ['lucide-react'],
    },
};

export default nextConfig;
