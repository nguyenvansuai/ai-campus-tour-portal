import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { memoryOutbox } from "@/lib/email";
import { createSuperAdmin } from "@/modules/identity/admin-bootstrap";
import { loadActor } from "@/modules/identity/actor";
import { auth } from "@/modules/identity/auth";
import type { Actor, Role } from "@/modules/identity/policy";
import { user } from "@/modules/identity/schema";
import { inviteStaff } from "@/modules/identity/service";

/** Đăng nhập bằng OTP, trả về id tài khoản và cookie phiên. */
export async function signIn(email: string) {
  await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  const otp = memoryOutbox.findLast((m) => m.to === email && /Mã đăng nhập/.test(m.subject))!.text.match(/\b(\d{6})\b/)![1];
  const { headers } = await auth.api.signInEmailOTP({ body: { email, otp }, returnHeaders: true });
  const [row] = await db.select().from(user).where(eq(user.email, email));
  return { userId: row!.id, cookie: headers.get("set-cookie")!.split(";")[0]! };
}

export async function superAdminActor(email = "boss@example.com"): Promise<Actor> {
  const { userId } = await createSuperAdmin(email);
  return (await loadActor(userId))!;
}

/** Tạo nhân sự có vai trò toàn hệ thống và trả về Actor của họ. */
export async function staffActor(email: string, role: Role): Promise<Actor> {
  const boss = await superAdminActor();
  await inviteStaff(boss, { email, role, scopeType: "global", scopeId: null });
  const { userId } = await signIn(email);
  return (await loadActor(userId))!;
}
