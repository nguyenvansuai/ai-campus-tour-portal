import { sql } from "drizzle-orm";
import { resetDatabase } from "../../setup/reset";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { memoryOutbox } from "@/lib/email";
import { consumeRateLimit } from "@/lib/rate-limit";
import { auth } from "@/modules/identity/auth";

const WIFI_IP = "203.0.113.10";

async function postAuth(path: string, body: unknown, ip = WIFI_IP) {
  return auth.handler(
    new Request(`http://localhost:3000/api/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip, origin: "http://localhost:3000" },
      body: JSON.stringify(body),
    }),
  );
}

const requestOtp = (email: string, ip?: string) => postAuth("/email-otp/send-verification-otp", { email, type: "sign-in" }, ip);

function lastOtpFor(email: string) {
  return memoryOutbox.findLast((m) => m.to === email)!.text.match(/\b(\d{6})\b/)![1];
}

beforeEach(resetDatabase);

afterAll(async () => {
  await closeDb();
});

describe("consumeRateLimit", () => {
  it("đếm theo khóa và từ chối khi vượt ngưỡng trong cùng khung thời gian", async () => {
    const rule = { max: 2, windowSeconds: 60 };
    expect((await consumeRateLimit("k", rule)).allowed).toBe(true);
    expect((await consumeRateLimit("k", rule)).allowed).toBe(true);
    const third = await consumeRateLimit("k", rule);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
    expect((await consumeRateLimit("khac", rule)).allowed).toBe(true);
  });

  it("mở lại khi hết khung thời gian", async () => {
    const rule = { max: 1, windowSeconds: 60 };
    await consumeRateLimit("k", rule);
    await db.execute(sql`update rate_limit_bucket set window_start = now() - interval '61 seconds'`);
    expect((await consumeRateLimit("k", rule)).allowed).toBe(true);
  });
});

describe("Giới hạn xin mã OTP", () => {
  it("mỗi email chỉ được xin 5 mã trong 15 phút", async () => {
    for (let i = 0; i < 5; i++) expect((await requestOtp("sv@example.com")).status).toBe(200);
    const blocked = await requestOtp("sv@example.com");
    expect(blocked.status).toBe(429);
    const body = (await blocked.json()) as { code: string; message: string };
    expect(body.code).toBe("OTP_SEND_LIMIT");
    expect(body.message).toMatch(/thử lại sau \d+ phút/);
  });

  it("500 sinh viên dùng chung wifi (cùng IP) xin mã trong 5 phút không bị chặn", { timeout: 120_000 }, async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 500; i++) statuses.push((await requestOtp(`sv${i}@example.com`)).status);
    expect(statuses.filter((s) => s !== 200)).toEqual([]);
  });

  it("nhập sai 5 lần thì mã bị hủy, phải xin mã mới", async () => {
    await requestOtp("sv@example.com");
    const otp = lastOtpFor("sv@example.com");
    const wrong = otp === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) await postAuth("/sign-in/email-otp", { email: "sv@example.com", otp: wrong });
    const response = await postAuth("/sign-in/email-otp", { email: "sv@example.com", otp });
    expect(response.status).not.toBe(200);
  });
});
