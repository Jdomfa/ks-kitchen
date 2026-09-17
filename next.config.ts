import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['ripping-twiddling-wielder.ngrok-free.dev'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
