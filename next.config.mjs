/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com', // Esempio: Unsplash
            },
            {
                protocol: 'https',
                hostname: 'placehold.co', // Esempio per placeholder
            }
        ]
    }
};

export default nextConfig; 