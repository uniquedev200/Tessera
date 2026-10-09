import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  allowedDevOrigins: [
    "192.168.1.2",
    "192.168.1.2:3000",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
};

export default nextConfig;
