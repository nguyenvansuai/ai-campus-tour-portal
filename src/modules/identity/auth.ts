import { betterAuth } from "better-auth";
import type { GoogleOptions } from "better-auth/social-providers";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins/email-otp";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { renderOtpEmail, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { consumeRateLimit } from "@/lib/rate-limit";
import { acceptPendingInvitations } from "./service";
import * as schema from "./schema";

const DAY = 60 * 60 * 24;

export const OTP_EXPIRES_IN_SECONDS = 10 * 60;
/** Mỗi email: tối đa 5 lần xin mã trong 15 phút. */
export const OTP_SEND_LIMIT = { max: 5, windowSeconds: 15 * 60 };
/**
 * Giới hạn theo IP của Better Auth (mỗi đường dẫn). Phải đặt cao: 500 SV dùng chung wifi hội trường
 * sẽ có cùng một IP. Chặn lạm dụng chủ yếu dựa vào giới hạn theo email ở trên.
 */
const PER_IP_LIMIT = { window: 15 * 60, max: 1000 };

export const SUSPENDED_MESSAGE = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban tổ chức.";

export type CreateAuthOptions = {
  /** Ghi đè cấu hình Google (dùng trong test để giả lập Google). */
  google?: GoogleOptions;
};

function googleProvider(override?: GoogleOptions): GoogleOptions | undefined {
  if (override) return override;
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env();
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return undefined;
  return { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET, prompt: "select_account" };
}

export function createAuth(options: CreateAuthOptions = {}) {
  const config = env();
  const google = googleProvider(options.google);
  return betterAuth({
    appName: "AI Campus Tour",
    baseURL: config.APP_URL,
    secret: config.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    user: {
      additionalFields: {
        phone: { type: "string", required: false, input: false },
        status: { type: "string", required: false, input: false, defaultValue: "active" },
      },
    },
    socialProviders: google ? { google } : {},
    account: {
      // Cùng một email: đăng nhập Google sẽ gắn vào tài khoản đã tạo bằng OTP (Google đã xác minh email).
      accountLinking: { enabled: true, trustedProviders: ["google"] },
    },
    session: {
      // Sinh viên: 30 ngày, tự gia hạn khi còn dùng.
      expiresIn: 30 * DAY,
      updateAge: DAY,
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 3000,
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/email-otp/send-verification-otp") return;
        const email = String(ctx.body?.email ?? "").trim().toLowerCase();
        const { allowed, retryAfterSeconds } = await consumeRateLimit(`otp-send:${email}`, OTP_SEND_LIMIT);
        if (!allowed) {
          const minutes = Math.ceil(retryAfterSeconds / 60);
          throw new APIError("TOO_MANY_REQUESTS", {
            code: "OTP_SEND_LIMIT",
            message: `Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau ${minutes} phút.`,
          });
        }
      }),
    },
    advanced: {
      // Portal chạy sau Caddy: IP thật của người dùng nằm trong X-Forwarded-For.
      ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (newSession) => {
            const [owner] = await db
              .select({ status: schema.user.status })
              .from(schema.user)
              .where(eq(schema.user.id, newSession.userId));
            if (owner?.status === "suspended") {
              throw new APIError("FORBIDDEN", { message: SUSPENDED_MESSAGE });
            }
          },
          after: async (newSession) => {
            const [owner] = await db
              .select({ email: schema.user.email })
              .from(schema.user)
              .where(eq(schema.user.id, newSession.userId));
            if (owner) await acceptPendingInvitations(newSession.userId, owner.email);
          },
        },
      },
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: OTP_EXPIRES_IN_SECONDS,
        allowedAttempts: 5,
        storeOTP: "hashed",
        rateLimit: PER_IP_LIMIT,
        async sendVerificationOTP({ email, otp }) {
          await sendEmail({ to: email, ...renderOtpEmail(otp) });
        },
      }),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

export function isGoogleEnabled() {
  return googleProvider() !== undefined;
}

let instance: Auth | undefined;

export function getAuth(): Auth {
  instance ??= createAuth();
  return instance;
}

/** Khởi tạo ở lần dùng đầu tiên, để build không cần biến môi trường. */
export const auth = new Proxy({} as Auth, {
  get(_target, property, receiver) {
    return Reflect.get(getAuth(), property, receiver);
  },
});
