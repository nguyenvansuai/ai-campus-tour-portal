import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { roleAssignment, user } from "./schema";

/** Tạo (hoặc lấy) tài khoản theo email và gán super_admin. Chạy lại nhiều lần không tạo trùng. */
export async function createSuperAdmin(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  return db.transaction(async (tx) => {
    let [account] = await tx.select({ id: user.id }).from(user).where(eq(user.email, email));
    if (!account) {
      [account] = await tx.insert(user).values({ id: randomUUID(), email, name: "", emailVerified: true }).returning({ id: user.id });
    }
    const [existing] = await tx
      .select({ id: roleAssignment.id })
      .from(roleAssignment)
      .where(and(eq(roleAssignment.userId, account!.id), eq(roleAssignment.role, "super_admin"), isNull(roleAssignment.revokedAt)));
    if (existing) return { userId: account!.id, created: false };

    await tx.insert(roleAssignment).values({ userId: account!.id, role: "super_admin", scopeType: "global" });
    await recordAudit({
      actorId: null,
      action: "role.granted",
      targetType: "user",
      targetId: account!.id,
      metadata: { role: "super_admin", via: "cli" },
    }, tx);
    return { userId: account!.id, created: true };
  });
}
