import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["tests/unit/**/*.test.{ts,tsx}"],
          setupFiles: ["tests/setup/dom.ts"],
        },
      },
      {
        extends: true,
        test: {
          // Chạy trên Postgres thật; các file chạy lần lượt vì dùng chung một database test.
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["tests/setup/db-global.ts"],
          setupFiles: ["tests/setup/db-env.ts"],
          fileParallelism: false,
        },
      },
    ],
  },
});
