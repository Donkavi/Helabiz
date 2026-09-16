import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next does not walk up to an unrelated lockfile.
  turbopack: { root: path.resolve(".") },

  serverExternalPackages: ["mongoose", "bcryptjs", "mongodb-memory-server"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  experimental: {
    // Server Actions carry base64 media from the builder's media library.
    serverActions: { bodySizeLimit: "8mb" },
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
