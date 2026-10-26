import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const valid = {
  NODE_ENV: "development",
  DATABASE_URL: "postgres://portal:portal@localhost:5432/portal_dev",
  APP_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("chấp nhận cấu hình hợp lệ", () => {
    const env = parseEnv(valid);
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.APP_URL).toBe("http://localhost:3000");
  });

  it("báo lỗi liệt kê đủ tên các biến thiếu", () => {
    expect(() => parseEnv({ NODE_ENV: "production" })).toThrowError(/DATABASE_URL[\s\S]*APP_URL|APP_URL[\s\S]*DATABASE_URL/);
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
