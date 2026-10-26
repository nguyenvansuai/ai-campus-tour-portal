import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "./auth";
import type { Actor } from "./policy";
import { roleAssignment, session as sessionTable, user } from "./schema";

/** SV (không có vai trò nhân sự) không dùng portal quá số ngày này thì phải đăng nhập lại. */
export const STUDENT_IDLE_DAYS = 30;

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

/**
 * Phiên hợp lệ của request: có phiên Better Auth, và với SV thì lần dùng cuối chưa quá 30 ngày.
 * Phiên SV quá hạn bị xóa luôn khỏi database.
 */
export async function getValidSession(requestHeaders: Headers) {
  const current = await auth.api.getSession({ headers: requestHeaders });
  if (!current) return null;
  const actor = await loadActor(current.user.id);
  if (!actor) return null;
  const idleMs = Date.now() - new Date(current.session.updatedAt).getTime();
  if (actor.roles.length === 0 && idleMs > STUDENT_IDLE_DAYS * 86_400_000) {
    await db.delete(sessionTable).where(eq(sessionTable.id, current.session.id));
    return null;
  }
  return { ...current, actor };
}

/** Actor của request hiện tại, hoặc null nếu chưa đăng nhập. */
export async function getActor(requestHeaders: Headers): Promise<Actor | null> {
  return (await getValidSession(requestHeaders))?.actor ?? null;
}
