import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // Remove legacy polyfills for modern browsers
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  // Optimize image delivery
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
    ],
  },
  // Use modern JavaScript for smaller bundle sizes
  experimental: {
    optimizePackageImports: ["lucide-react", "@vercel/analytics"],
  },
};

export default nextConfig;
