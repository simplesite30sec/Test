/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    distDir: '.vercel/output/static',
    images: {
        unoptimized: true,
    },
    trailingSlash: true,
};

export default nextConfig;
