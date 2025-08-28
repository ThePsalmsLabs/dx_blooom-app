import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Temporarily ignore ESLint errors during builds (e.g., Vercel)
    ignoreDuringBuilds: true,
  },

  // Build performance optimizations
  // swcMinify: true, // Removed - deprecated in Next.js 15
  
  // Webpack optimizations for faster builds
  webpack: (config, { dev, isServer }) => {
    // Optimize module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Reduce bundle size by excluding heavy dependencies from client bundle
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'ipfs-http-client': 'ipfs-http-client',
        'x402-express': 'x402-express',
        'cloudflared': 'cloudflared',
      });
    }

    // Optimize chunk splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
          },
        },
      },
    };

    return config;
  },

  // Experimental features for better performance
  experimental: {
    // Optimize memory usage
    memoryBasedWorkersCount: true,
  },

  // Optimize image handling
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Output optimizations
  output: 'standalone',
  
  // Reduce build output size
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;
