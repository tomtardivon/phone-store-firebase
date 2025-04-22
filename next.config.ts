/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nouvelles options de Next.js 15
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Optimisations d'images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  // Optimisations de compilation
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
