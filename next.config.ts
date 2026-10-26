import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build gọn để chạy trong Docker trên VPS.
  output: "standalone",
  // Cho phép dùng forbidden() để hiện trang 403 khi thiếu quyền.
  // File minh chứng tối đa 10 MB (cộng phần đầu multipart).
  experimental: { authInterrupts: true, serverActions: { bodySizeLimit: "11mb" } },
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
