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
        protocol: "https",
        hostname: "**",
      },
    ],
    // Activer les optimisations d'image au lieu de "unoptimized: true"
    unoptimized: false,
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Définir des tailles spécifiques pour les produits
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Optimisations de compilation
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
