import { createHmac, timingSafeEqual } from "node:crypto";
import { and, count, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import type { ModuleId, QuizBank, Track } from "@/modules/curriculum/types";
import { authorize, type Actor } from "@/modules/identity/policy";
import { user } from "@/modules/identity/schema";
import { CREDIT_MODULES, courseCredit, voucher, type CreditModule, type VoucherKind } from "./schema";

export class CourseError extends Error {}

const MAX_CLOCK_SKEW_SECONDS = 5 * 60;
export const MEET_COURSE_ID = "3599";

// ---------------------------------------------------------------------------
// API nhận hoàn thành khóa từ suai.vn (plugin aict-bridge)

export function signBridgePayload(secret: string, timestamp: string, body: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

/** Kiểm tra chữ ký HMAC và độ lệch thời gian. Trả về false nếu không hợp lệ (không nói lý do cho bên gọi). */
export function verifyBridgeSignature(body: string, timestamp: string | null, signature: string | null, now = Date.now()) {
  const secret = env().SUAI_BRIDGE_SECRET;
  if (!secret || !timestamp || !signature || !/^\d{9,11}$/.test(timestamp)) return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > MAX_CLOCK_SKEW_SECONDS) return false;
  const expected = Buffer.from(signBridgePayload(secret, timestamp, body), "hex");
  const actual = Buffer.from(signature, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const CompletionEvent = z.object({
  event: z.literal("course_completed"),
  eventId: z.string().min(1).max(200),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  courseId: z.union([z.string(), z.number()]).transform(String),
  completedAt: z.coerce.date().optional(),
});

export type CompletionResult = { status: "recorded" | "duplicate" | "ignored_course" };

/** Hoàn thành cả khóa N1 → tính đã học đủ chủ đề của M1–M3. */
export async function recordTutorCompletion(payload: unknown): Promise<CompletionResult> {
  const event = CompletionEvent.parse(payload);
  if (!env().SUAI_COURSE_IDS.includes(event.courseId)) return { status: "ignored_course" };
  const inserted = await db
    .insert(courseCredit)
    .values({ email: event.email, source: "tutor", courseId: event.courseId, modules: [...CREDIT_MODULES], externalId: event.eventId, completedAt: event.completedAt ?? new Date() })
    .onConflictDoNothing()
    .returning({ id: courseCredit.id });
  if (!inserted.length) return { status: "duplicate" };
  await recordAudit({ actorId: null, action: "course.completed", targetType: "course_credit", targetId: inserted[0]!.id, metadata: { courseId: event.courseId, source: "tutor" } });
  return { status: "recorded" };
}

// ---------------------------------------------------------------------------
// Xác nhận tay (lớp trên meet.suai.vn)

export async function recordManualCredits(actor: Actor, input: { emails: string; modules: string[]; note: string }) {
  authorize(actor, "course.record", { kind: "system" });
  const modules = CREDIT_MODULES.filter((m) => input.modules.includes(m));
  if (!modules.length) throw new CourseError("Chọn ít nhất 1 module SV đã học.");
  const emails = [...new Set(input.emails.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (!emails.length) throw new CourseError("Nhập ít nhất 1 email.");
  const invalid = emails.filter((e) => !z.email().safeParse(e).success);
  if (invalid.length) throw new CourseError(`Email không hợp lệ: ${invalid.slice(0, 5).join(", ")}`);
  if (emails.length > 500) throw new CourseError("Tối đa 500 email mỗi lần.");
  await db.transaction(async (tx) => {
    const rows = await tx
      .insert(courseCredit)
      .values(emails.map((email) => ({ email, source: "manual" as const, courseId: MEET_COURSE_ID, modules, note: input.note.trim(), recordedBy: actor.userId })))
      .returning({ id: courseCredit.id });
    await recordAudit({ actorId: actor.userId, action: "course.recorded_manual", targetType: "course_credit", targetId: rows[0]!.id, metadata: { count: rows.length, modules } }, tx);
  });
  return emails.length;
}

export async function revokeCredit(actor: Actor, creditId: string, reason: string) {
  authorize(actor, "course.record", { kind: "system" });
  if (!reason.trim()) throw new CourseError("Vui lòng ghi lý do thu hồi.");
  await db.update(courseCredit).set({ revokedAt: new Date(), revokedReason: reason.trim() }).where(and(eq(courseCredit.id, creditId), isNull(courseCredit.revokedAt)));
  await recordAudit({ actorId: actor.userId, action: "course.credit_revoked", targetType: "course_credit", targetId: creditId, metadata: { reason: reason.trim() } });
}

export async function listCredits(actor: Actor, options: { email?: string } = {}) {
  authorize(actor, "course.record", { kind: "system" });
  const conditions = options.email ? [eq(courseCredit.email, options.email.trim().toLowerCase())] : [];
  return db
    .select({ credit: courseCredit, studentName: user.name })
    .from(courseCredit)
    .leftJoin(user, eq(user.email, courseCredit.email))
    .where(and(...conditions))
    .orderBy(desc(courseCredit.createdAt))
    .limit(200);
}

// ---------------------------------------------------------------------------
// Miễn trắc nghiệm

/** Module đã được ghi nhận học qua khóa Sự AI (còn hiệu lực). */
export async function creditedModules(email: string): Promise<Set<CreditModule>> {
  const rows = await db
    .select({ modules: courseCredit.modules })
    .from(courseCredit)
    .where(and(eq(courseCredit.email, email.toLowerCase()), isNull(courseCredit.revokedAt)));
  return new Set(rows.flatMap((r) => r.modules));
}

export type QuizRequirement = { quizId: QuizBank["id"] | null; exempt: boolean };

/**
 * Bài trắc nghiệm SV phải đạt cho module (THIET_KE_CHUONG_TRINH 2.4): đã học N1 thì miễn M2, M3 (khối A/B);
 * M1 chỉ còn phần an toàn dữ liệu; khối C vẫn làm M3 vì N1 không phủ nội dung CNTT.
 */
export function quizRequirement(moduleId: ModuleId, track: Track, normalQuizId: QuizBank["id"] | null, credited: Set<CreditModule>): QuizRequirement {
  if (!normalQuizId || !credited.has(moduleId as CreditModule)) return { quizId: normalQuizId, exempt: false };
  if (moduleId === "M1") return { quizId: "M1-SAFE", exempt: true };
  if (moduleId === "M3" && track === "C") return { quizId: normalQuizId, exempt: false };
  return { quizId: null, exempt: true };
}

// ---------------------------------------------------------------------------
// Mã ưu đãi

export const VOUCHER_LABELS: Record<VoucherKind, string> = { free_seat: "Suất học miễn phí khóa video", discount: "Mã giảm 50%" };

export async function importVouchers(actor: Actor, kind: VoucherKind, raw: string) {
  authorize(actor, "course.manage_vouchers", { kind: "system" });
  const codes = [...new Set(raw.split(/[\s,;]+/).map((c) => c.trim()).filter(Boolean))];
  if (!codes.length) throw new CourseError("Dán ít nhất 1 mã.");
  if (codes.some((c) => c.length > 64)) throw new CourseError("Mã quá dài (tối đa 64 ký tự).");
  const inserted = await db
    .insert(voucher)
    .values(codes.map((code) => ({ kind, code, createdBy: actor.userId })))
    .onConflictDoNothing()
    .returning({ id: voucher.id });
  await recordAudit({ actorId: actor.userId, action: "voucher.imported", targetType: "voucher", metadata: { kind, count: inserted.length } });
  return { added: inserted.length, skipped: codes.length - inserted.length };
}

export async function voucherStats() {
  const rows = await db
    .select({ kind: voucher.kind, claimed: sql<boolean>`${voucher.claimedBy} is not null`, total: count() })
    .from(voucher)
    .groupBy(voucher.kind, sql`${voucher.claimedBy} is not null`);
  return Object.fromEntries(
    (["free_seat", "discount"] as const).map((kind) => {
      const of = (claimed: boolean) => Number(rows.find((r) => r.kind === kind && r.claimed === claimed)?.total ?? 0);
      return [kind, { available: of(false), claimed: of(true) }];
    }),
  ) as Record<VoucherKind, { available: number; claimed: number }>;
}

export async function myVouchers(userId: string) {
  return db.select().from(voucher).where(and(eq(voucher.claimedBy, userId), isNotNull(voucher.claimedAt)));
}

/** SV nhận 1 mã chưa ai dùng. Khóa dòng (SKIP LOCKED) để 2 SV bấm cùng lúc không nhận trùng mã. */
export async function claimVoucher(actor: Actor, kind: VoucherKind, eligibility: { hasOpenEnrollment: boolean; fromWorkshop: boolean }) {
  if (actor.status !== "active") throw new CourseError("Tài khoản đã bị khóa.");
  if (!eligibility.hasOpenEnrollment) throw new CourseError("Bạn cần đang tham gia lộ trình để nhận mã.");
  if (kind === "free_seat" && !eligibility.fromWorkshop) throw new CourseError("Suất miễn phí chỉ dành cho SV đăng ký bằng mã workshop.");
  const [existing] = await db.select().from(voucher).where(and(eq(voucher.kind, kind), eq(voucher.claimedBy, actor.userId)));
  if (existing) return existing.code;
  const code = await db.transaction(async (tx) => {
    const [free] = await tx
      .select({ id: voucher.id, code: voucher.code })
      .from(voucher)
      .where(and(eq(voucher.kind, kind), isNull(voucher.claimedBy)))
      .orderBy(voucher.createdAt)
      .limit(1)
      .for("update", { skipLocked: true });
    if (!free) return null;
    await tx.update(voucher).set({ claimedBy: actor.userId, claimedAt: new Date() }).where(eq(voucher.id, free.id));
    await recordAudit({ actorId: actor.userId, action: "voucher.claimed", targetType: "voucher", targetId: free.id, metadata: { kind } }, tx);
    return free.code;
  });
  if (!code) throw new CourseError("Đã hết mã. Bạn vẫn học đầy đủ lộ trình bằng các nguồn miễn phí.");
  return code;
}

export async function creditsForEmails(emails: string[]) {
  if (!emails.length) return [];
  return db.select().from(courseCredit).where(and(inArray(courseCredit.email, emails.map((e) => e.toLowerCase())), isNull(courseCredit.revokedAt)));
}
