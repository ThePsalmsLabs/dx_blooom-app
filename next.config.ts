import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Temporarily ignore ESLint errors during builds (e.g., Vercel)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
