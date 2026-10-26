import { randomBytes } from "node:crypto";
import { and, asc, count, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getOpenEnrollment } from "@/modules/enrollment/service";
import { authorize, can, type Actor } from "@/modules/identity/policy";
import { user } from "@/modules/identity/schema";
import { signJitsiToken } from "./jitsi";
import { sessionAttendance, supportSession } from "./schema";

export const JOIN_ERRORS = {
  khoa: "Tài khoản đã bị khóa.",
  huy: "Buổi hỗ trợ không tồn tại hoặc đã hủy.",
  "khong-phai-sv": "Giờ hỗ trợ dành cho SV đang tham gia lộ trình.",
  "chua-mo": "Phòng mở trước giờ bắt đầu 15 phút. Bạn quay lại sau nhé.",
  "ket-thuc": "Buổi hỗ trợ đã kết thúc.",
} as const;
export type JoinErrorCode = keyof typeof JOIN_ERRORS;

export class LiveSessionError extends Error {
  constructor(
    message: string,
    readonly code?: JoinErrorCode,
  ) {
    super(message);
  }
}

const joinError = (code: JoinErrorCode) => new LiveSessionError(JOIN_ERRORS[code], code);

const MINUTE = 60_000;
const EARLY_JOIN_MINUTES = 15;
const MAX_REPEAT_WEEKS = 8;

export type SessionInput = { title: string; startsAt: string; durationMinutes: number; note: string; repeatWeeks: number };

/** "2026-11-03T19:30" (giờ Việt Nam, từ ô datetime-local) → Date. */
export function parseVnDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createSessions(actor: Actor, input: SessionInput) {
  authorize(actor, "live_session.manage", { kind: "system" });
  const title = input.title.trim();
  if (title.length < 3) throw new LiveSessionError("Vui lòng nhập tiêu đề.");
  const startsAt = parseVnDateTime(input.startsAt);
  if (!startsAt) throw new LiveSessionError("Thời gian bắt đầu không hợp lệ.");
  if (startsAt.getTime() < Date.now() - 5 * MINUTE) throw new LiveSessionError("Thời gian bắt đầu đã qua.");
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 30 || input.durationMinutes > 180) throw new LiveSessionError("Thời lượng từ 30 đến 180 phút.");
  const weeks = Math.min(Math.max(1, Math.floor(input.repeatWeeks) || 1), MAX_REPEAT_WEEKS);
  const rows = await db
    .insert(supportSession)
    .values(
      Array.from({ length: weeks }, (_, i) => ({
        title,
        startsAt: new Date(startsAt.getTime() + i * 7 * 24 * 60 * MINUTE),
        durationMinutes: input.durationMinutes,
        // Tên phòng khó đoán để người ngoài không vào được khi Jitsi chưa bật JWT.
        room: `aict-ho-tro-${randomBytes(6).toString("hex")}`,
        note: input.note.trim(),
        hostId: actor.userId,
      })),
    )
    .returning({ id: supportSession.id });
  await recordAudit({ actorId: actor.userId, action: "live_session.created", targetType: "support_session", targetId: rows[0]!.id, metadata: { count: rows.length } });
  return rows.length;
}

export async function cancelSession(actor: Actor, sessionId: string) {
  authorize(actor, "live_session.manage", { kind: "system" });
  await db.update(supportSession).set({ cancelledAt: new Date() }).where(and(eq(supportSession.id, sessionId), isNull(supportSession.cancelledAt)));
  await recordAudit({ actorId: actor.userId, action: "live_session.cancelled", targetType: "support_session", targetId: sessionId });
}

const endOf = (s: typeof supportSession.$inferSelect) => new Date(s.startsAt.getTime() + s.durationMinutes * MINUTE);

/** Buổi chưa kết thúc trong `days` ngày tới (kể cả đang diễn ra). */
export async function upcomingSessions(days = 14, now = new Date()) {
  const rows = await db
    .select({ session: supportSession, hostName: user.name })
    .from(supportSession)
    .leftJoin(user, eq(user.id, supportSession.hostId))
    .where(and(isNull(supportSession.cancelledAt), gte(supportSession.startsAt, new Date(now.getTime() - 180 * MINUTE)), lte(supportSession.startsAt, new Date(now.getTime() + days * 24 * 60 * MINUTE))))
    .orderBy(asc(supportSession.startsAt));
  return rows
    .filter((r) => endOf(r.session) > now)
    .map((r) => ({ ...r.session, hostName: r.hostName, endsAt: endOf(r.session), joinable: now.getTime() >= r.session.startsAt.getTime() - EARLY_JOIN_MINUTES * MINUTE }));
}

export async function sessionsForStaff(actor: Actor, now = new Date()) {
  authorize(actor, "live_session.manage", { kind: "system" });
  const rows = await db
    .select({ session: supportSession, hostName: user.name })
    .from(supportSession)
    .leftJoin(user, eq(user.id, supportSession.hostId))
    .where(gte(supportSession.startsAt, new Date(now.getTime() - 30 * 24 * 60 * MINUTE)))
    .orderBy(desc(supportSession.startsAt))
    .limit(100);
  const ids = rows.map((r) => r.session.id);
  const counts = ids.length
    ? await db.select({ sessionId: sessionAttendance.sessionId, total: count() }).from(sessionAttendance).where(inArray(sessionAttendance.sessionId, ids)).groupBy(sessionAttendance.sessionId)
    : [];
  return rows.map((r) => ({ ...r.session, hostName: r.hostName, endsAt: endOf(r.session), attendees: Number(counts.find((c) => c.sessionId === r.session.id)?.total ?? 0) }));
}

export async function attendanceOf(actor: Actor, sessionId: string) {
  authorize(actor, "live_session.manage", { kind: "system" });
  return db
    .select({ name: user.name, email: user.email, joinedAt: sessionAttendance.joinedAt })
    .from(sessionAttendance)
    .innerJoin(user, eq(user.id, sessionAttendance.userId))
    .where(eq(sessionAttendance.sessionId, sessionId))
    .orderBy(asc(sessionAttendance.joinedAt));
}

export async function attendedSessionIds(userId: string) {
  const rows = await db.select({ id: sessionAttendance.sessionId }).from(sessionAttendance).where(eq(sessionAttendance.userId, userId));
  return new Set(rows.map((r) => r.id));
}

/** Kiểm tra được vào, ghi điểm danh, trả về URL phòng Jitsi (kèm JWT nếu đã cấu hình). */
export async function joinSession(actor: Actor, profile: { name: string; email: string }, sessionId: string, now = new Date()) {
  if (actor.status !== "active") throw joinError("khoa");
  const [session] = await db.select().from(supportSession).where(eq(supportSession.id, sessionId));
  if (!session || session.cancelledAt) throw joinError("huy");
  const isStaff = can(actor, "live_session.manage", { kind: "system" });
  if (!isStaff && !(await getOpenEnrollment(actor.userId))) throw joinError("khong-phai-sv");
  if (now.getTime() < session.startsAt.getTime() - EARLY_JOIN_MINUTES * MINUTE) throw joinError("chua-mo");
  if (now >= endOf(session)) throw joinError("ket-thuc");

  await db.insert(sessionAttendance).values({ sessionId, userId: actor.userId }).onConflictDoNothing();
  const { JITSI_DOMAIN, JITSI_APP_ID, JITSI_APP_SECRET } = env();
  const url = new URL(`https://${JITSI_DOMAIN}/${session.room}`);
  if (JITSI_APP_ID && JITSI_APP_SECRET) {
    const token = signJitsiToken({
      appId: JITSI_APP_ID,
      secret: JITSI_APP_SECRET,
      domain: JITSI_DOMAIN,
      room: session.room,
      user: { id: actor.userId, name: profile.name || profile.email, email: profile.email, moderator: isStaff },
      expiresAt: new Date(endOf(session).getTime() + 60 * MINUTE),
      now,
    });
    url.searchParams.set("jwt", token);
  }
  // Tên hiển thị trong phòng (Jitsi đọc từ phần hash).
  url.hash = `userInfo.displayName="${encodeURIComponent(profile.name || profile.email)}"`;
  return url.toString();
}
