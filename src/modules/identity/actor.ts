import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "./auth";
import type { Actor } from "./policy";
import { roleAssignment, user } from "./schema";

/** Dựng Actor từ database: trạng thái tài khoản + các vai trò chưa bị thu hồi. */
export async function loadActor(userId: string): Promise<Actor | null> {
  const [account] = await db.select({ id: user.id, status: user.status }).from(user).where(eq(user.id, userId));
  if (!account) return null;
  const grants = await db
    .select({ role: roleAssignment.role, scopeType: roleAssignment.scopeType, scopeId: roleAssignment.scopeId })
    .from(roleAssignment)
    .where(and(eq(roleAssignment.userId, userId), isNull(roleAssignment.revokedAt)));
  return { userId: account.id, status: account.status, roles: grants };
}

/** Actor của request hiện tại, hoặc null nếu chưa đăng nhập. */
export async function getActor(requestHeaders: Headers): Promise<Actor | null> {
  const current = await auth.api.getSession({ headers: requestHeaders });
  return current ? loadActor(current.user.id) : null;
}
