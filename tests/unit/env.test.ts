import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const valid = {
  NODE_ENV: "development",
  DATABASE_URL: "postgres://portal:portal@localhost:5432/portal_dev",
  APP_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "x".repeat(32),
};

describe("parseEnv", () => {
  it("chấp nhận cấu hình hợp lệ", () => {
    const env = parseEnv(valid);
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.APP_URL).toBe("http://localhost:3000");
  });

  it("báo lỗi liệt kê đủ tên các biến thiếu", () => {
    expect(() => parseEnv({ NODE_ENV: "development" })).toThrowError(/DATABASE_URL[\s\S]*APP_URL|APP_URL[\s\S]*DATABASE_URL/);
  });

  it("production bắt buộc gửi email qua Brevo có API key", () => {
    expect(() => parseEnv({ ...valid, APP_ENV: "production" })).toThrowError(/EMAIL_TRANSPORT/);
    expect(() => parseEnv({ ...valid, APP_ENV: "production", EMAIL_TRANSPORT: "brevo" })).toThrowError(/BREVO_API_KEY/);
    expect(parseEnv({ ...valid, APP_ENV: "production", EMAIL_TRANSPORT: "brevo", BREVO_API_KEY: "k", STORAGE_DRIVER: "drive", GOOGLE_CLIENT_ID: "c", GOOGLE_CLIENT_SECRET: "s" }).EMAIL_FROM).toBe(
      "no-reply@suai.vn",
    );
  });

  it("production bắt buộc lưu file trên Google Drive (cần OAuth client)", () => {
    const prod = { ...valid, APP_ENV: "production", EMAIL_TRANSPORT: "brevo", BREVO_API_KEY: "k" };
    expect(() => parseEnv(prod)).toThrowError(/STORAGE_DRIVER/);
    expect(() => parseEnv({ ...prod, STORAGE_DRIVER: "drive" })).toThrowError(/GOOGLE_CLIENT_SECRET/);
  });

  it("không in giá trị của biến ra thông báo lỗi", () => {
    try {
      parseEnv({ ...valid, APP_URL: "khong-phai-url-bi-mat-123" });
      expect.unreachable();
    } catch (error) {
      expect(String(error)).toContain("APP_URL");
      expect(String(error)).not.toContain("khong-phai-url-bi-mat-123");
    }
  });
});
