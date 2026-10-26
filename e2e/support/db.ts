import { execFileSync } from "node:child_process";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "postgres://portal:portal@localhost:5432/portal_test";

/** Tạo Super Admin trong database test bằng chính lệnh CLI dùng trên VPS. */
export function makeSuperAdmin(email: string) {
  execFileSync("pnpm", ["--silent", "admin:create", email], {
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      APP_URL: "http://localhost:3100",
      BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-123",
    },
    stdio: "pipe",
  });
}
