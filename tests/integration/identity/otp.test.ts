import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, closeDb } from "@/lib/db";
import { memoryOutbox } from "@/lib/email";
import { auth } from "@/modules/identity/auth";
import { user, verification } from "@/modules/identity/schema";

function lastOtpFor(email: string): string {
  const mail = memoryOutbox.findLast((m) => m.to === email);
  const otp = mail?.text.match(/\b(\d{6})\b/)?.[1];
  if (!otp) throw new Error(`Không thấy mã OTP gửi tới ${email}`);
  return otp;
}

async function requestOtp(email: string) {
  await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
}

async function signIn(email: string, otp: string) {
  return auth.api.signInEmailOTP({ body: { email, otp }, returnHeaders: true });
}

beforeEach(async () => {
  memoryOutbox.length = 0;
  await db.execute(sql`truncate table "session", "account", "verification", "user" cascade`);
});

afterAll(async () => {
  await closeDb();
});

describe("Đăng nhập bằng email OTP", () => {
  it("gửi email chứa mã 6 số tiếng Việt từ no-reply@suai.vn", async () => {
    await requestOtp("sv@example.com");
    const mail = memoryOutbox.at(-1);
    expect(mail?.to).toBe("sv@example.com");
    expect(mail?.from).toContain("no-reply@suai.vn");
    expect(mail?.subject).toMatch(/mã đăng nhập/i);
    expect(lastOtpFor("sv@example.com")).toMatch(/^\d{6}$/);
  });

  it("nhập đúng mã thì tạo tài khoản và phiên đăng nhập", async () => {
    await requestOtp("sv@example.com");
    const { headers, response } = await signIn("sv@example.com", lastOtpFor("sv@example.com"));
    expect(response.user.email).toBe("sv@example.com");
    expect(headers.get("set-cookie")).toMatch(/session_token/);
    const rows = await db.select().from(user).where(eq(user.email, "sv@example.com"));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("active");
  });

  it("chuẩn hóa email về chữ thường", async () => {
    await requestOtp("SinhVien@Example.COM");
    const { response } = await signIn("SinhVien@Example.COM", lastOtpFor("sinhvien@example.com"));
    expect(response.user.email).toBe("sinhvien@example.com");
  });

  it("từ chối mã sai", async () => {
    await requestOtp("sv@example.com");
    const otp = lastOtpFor("sv@example.com");
    const wrong = otp === "000000" ? "111111" : "000000";
    await expect(signIn("sv@example.com", wrong)).rejects.toThrow();
  });

  it("từ chối mã đã hết hạn", async () => {
    await requestOtp("sv@example.com");
    const otp = lastOtpFor("sv@example.com");
    await db.update(verification).set({ expiresAt: new Date(Date.now() - 1000) });
    await expect(signIn("sv@example.com", otp)).rejects.toThrow();
  });

  it("mã có hiệu lực 10 phút", async () => {
    const before = Date.now();
    await requestOtp("sv@example.com");
    const [row] = await db.select().from(verification);
    const minutes = (row!.expiresAt.getTime() - before) / 60_000;
    expect(minutes).toBeGreaterThan(9.9);
    expect(minutes).toBeLessThan(10.1);
  });

  it("không lưu mã OTP dạng đọc được trong database", async () => {
    await requestOtp("sv@example.com");
    const otp = lastOtpFor("sv@example.com");
    const [row] = await db.select().from(verification);
    expect(row!.value).not.toContain(otp);
  });

  it("tài khoản bị khóa không đăng nhập được", async () => {
    await requestOtp("bikhoa@example.com");
    await signIn("bikhoa@example.com", lastOtpFor("bikhoa@example.com"));
    await db.update(user).set({ status: "suspended" }).where(eq(user.email, "bikhoa@example.com"));
    await requestOtp("bikhoa@example.com");
    await expect(signIn("bikhoa@example.com", lastOtpFor("bikhoa@example.com"))).rejects.toThrow(/bị khóa/);
  });

  it("phiên đăng nhập của sinh viên có hạn 30 ngày", async () => {
    await requestOtp("sv@example.com");
    await signIn("sv@example.com", lastOtpFor("sv@example.com"));
    const result = await db.execute<{ days: number }>(
      sql`select extract(epoch from (expires_at - created_at)) / 86400 as days from "session"`,
    );
    expect(Math.round(Number(result.rows[0]?.days))).toBe(30);
  });
});
