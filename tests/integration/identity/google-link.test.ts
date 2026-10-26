import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { memoryOutbox } from "@/lib/email";
import type { GoogleProfile } from "better-auth/social-providers";
import { createAuth } from "@/modules/identity/auth";
import { account, user } from "@/modules/identity/schema";

// Giả lập Google: chấp nhận mọi id token và trả về hồ sơ cố định.
function authWithFakeGoogle(profile: { id: string; email: string; name: string }) {
  return createAuth({
    google: {
      clientId: "test-client",
      clientSecret: "test-secret",
      verifyIdToken: async () => true,
      getUserInfo: async () => ({
        user: { email: profile.email, name: profile.name, emailVerified: true },
        // Better Auth lấy khóa tài khoản từ hồ sơ gốc của Google (trường `sub`).
        data: { sub: profile.id, email: profile.email, name: profile.name, email_verified: true } as GoogleProfile,
      }),
    },
  });
}

async function signInWithGoogle(profile: { id: string; email: string; name: string }) {
  return authWithFakeGoogle(profile).api.signInSocial({
    body: { provider: "google", idToken: { token: "fake-id-token" } },
  });
}

beforeEach(async () => {
  memoryOutbox.length = 0;
  await db.execute(sql`truncate table "session", "account", "verification", "user" cascade`);
});

afterAll(async () => {
  await closeDb();
});

describe("Đăng nhập Google", () => {
  it("tạo tài khoản mới khi email chưa có", async () => {
    await signInWithGoogle({ id: "g-1", email: "moi@example.com", name: "Sinh Viên Mới" });
    const rows = await db.select().from(user).where(eq(user.email, "moi@example.com"));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Sinh Viên Mới");
  });

  it("gộp vào tài khoản đã tạo bằng OTP nếu cùng email", async () => {
    const auth = authWithFakeGoogle({ id: "g-2", email: "sv@example.com", name: "Sinh Viên" });
    await auth.api.sendVerificationOTP({ body: { email: "sv@example.com", type: "sign-in" } });
    const otp = memoryOutbox.at(-1)!.text.match(/\b(\d{6})\b/)![1];
    await auth.api.signInEmailOTP({ body: { email: "sv@example.com", otp } });

    await auth.api.signInSocial({ body: { provider: "google", idToken: { token: "fake-id-token" } } });

    const users = await db.select().from(user).where(eq(user.email, "sv@example.com"));
    expect(users).toHaveLength(1);
    const accounts = await db.select().from(account).where(eq(account.userId, users[0]!.id));
    expect(accounts.map((a) => a.providerId)).toContain("google");
  });

  it("không bật Google khi chưa cấu hình client", () => {
    expect(createAuth().options.socialProviders?.google).toBeUndefined();
  });
});
