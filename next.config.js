/** @type {import('next').NextConfig} */
const nextConfig = {
    // Vercel 自动优化
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb'
        }
    },
    // 图片域名白名单
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'mrfakename-z-image-turbo.hf.space',
            },
            {
                protocol: 'https',
                hostname: '*.public.blob.vercel-storage.com',
            }
        ],
    },
}

module.exports = nextConfig
