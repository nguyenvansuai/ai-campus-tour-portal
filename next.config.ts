import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build gọn để chạy trong Docker trên VPS.
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
