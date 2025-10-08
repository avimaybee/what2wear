import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jfqaqwukmsfmgawzwsog.supabase.co",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ({ request }, callback) => {
          if (
            [
              "@cloudflare/next-on-pages/next-image-loader",
              "next",
              "react",
              "react-dom",
            ].includes(request) ||
            /^(next|react|react-dom|@supabase|@dnd-kit|framer-motion)/.test(request)
          ) {
            return callback();
          }
          if (!path.isAbsolute(request) && !request.startsWith(".")) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
        ...config.externals,
      ];
    }
    return config;
  },
};

export default nextConfig;
