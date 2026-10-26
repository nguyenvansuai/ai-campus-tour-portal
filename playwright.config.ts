import { defineConfig, devices } from "@playwright/test";

import { E2E_OUTBOX_DIR } from "./e2e/support/outbox";

const port = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/support/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    // Phần lớn SV dùng điện thoại, nên chạy mặc định trên khung 375px.
    { name: "mobile", use: { ...devices["iPhone SE"], browserName: "chromium" } },
  ],
  webServer: {
    command: `pnpm build && PORT=${port} pnpm start`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? "postgres://portal:portal@localhost:5432/portal_test",
      APP_URL: `http://localhost:${port}`,
      BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-123",
      EMAIL_TRANSPORT: "file",
      EMAIL_OUTBOX_DIR: E2E_OUTBOX_DIR,
    },
  },
});
