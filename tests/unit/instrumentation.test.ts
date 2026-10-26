import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("register (instrumentation)", () => {
  it("dừng server khi thiếu biến môi trường bắt buộc", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("APP_URL", "");
    const { register } = await import("@/instrumentation");
    expect(() => register()).toThrowError(/Cấu hình môi trường không hợp lệ/);
  });
});
