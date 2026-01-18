import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Increase body size limit for file uploads
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Allow larger request bodies for API routes
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default nextConfig;
