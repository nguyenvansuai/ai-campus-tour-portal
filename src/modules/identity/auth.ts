import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins/email-otp";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { renderOtpEmail, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import * as schema from "./schema";

const DAY = 60 * 60 * 24;

export const OTP_EXPIRES_IN_SECONDS = 10 * 60;
export const SUSPENDED_MESSAGE = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban tổ chức.";

function createAuth() {
  const config = env();
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
    session: {
      // Sinh viên: 30 ngày, tự gia hạn khi còn dùng.
      expiresIn: 30 * DAY,
      updateAge: DAY,
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
        },
      },
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: OTP_EXPIRES_IN_SECONDS,
        allowedAttempts: 5,
        storeOTP: "hashed",
        async sendVerificationOTP({ email, otp }) {
          await sendEmail({ to: email, ...renderOtpEmail(otp) });
        },
      }),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

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
