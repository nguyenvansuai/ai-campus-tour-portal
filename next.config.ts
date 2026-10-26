import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build gọn để chạy trong Docker trên VPS.
  output: "standalone",
  // Cho phép dùng forbidden() để hiện trang 403 khi thiếu quyền.
  experimental: { authInterrupts: true },
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
