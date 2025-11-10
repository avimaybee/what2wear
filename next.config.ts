import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // When Turbopack infers the workspace root incorrectly in monorepos or nested projects,
  // setting `turbopack.root` ensures the build uses the correct directory.
  turbopack: {
    root: './',
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tddifonhdaloweyadnop.supabase.co",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;
