import { and, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { PROGRAM_VERSION, SELF_ASSESSMENT, TOOL_OPTIONS } from "@/modules/curriculum/content/program";
import type { Track } from "@/modules/curriculum/types";
import { grantConsents } from "@/modules/identity/consent";
import { CONSENT_KEYS, REQUIRED_CONSENTS, type ConsentKey } from "@/modules/identity/consent-keys";
import { authorize, type Actor, type Resource } from "@/modules/identity/policy";
import { roleAssignment, user } from "@/modules/identity/schema";
import { faculty } from "@/modules/org/schema";
import { findOrCreateFacultyAndClass, findOrCreateSchoolBySelfReport, onSchoolMerge, redeemActivationCode } from "@/modules/org/service";
import { computeSchedule, EXTENSION_DAYS, MAX_PAUSE_DAYS, TRACK_LOCK_DAY, vnDateOf } from "./schedule";
import { enrollment } from "./schema";

const OPEN_STATUSES = ["active", "paused", "inactive"] as const;

export const EnrollInput = z
  .object({
    name: z.string().trim().min(2, "Vui lòng nhập họ tên.").max(100),
    phone: z
      .string()
      .trim()
      .regex(/^(\+?84|0)\d{9,10}$/, "Số điện thoại không hợp lệ.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    studentCode: z.string().trim().max(30).optional(),
    schoolId: z.uuid().optional(),
    newSchoolName: z.string().trim().max(200).optional(),
    facultyId: z.uuid().optional(),
    newFacultyName: z.string().trim().max(200).optional(),
    className: z.string().trim().max(100).optional(),
    track: z.enum(["A", "B", "C"], "Vui lòng chọn khối ngành."),
    targetPosition: z.string().trim().min(2, "Vui lòng nhập vị trí bạn muốn ứng tuyển.").max(200),
    tools: z.array(z.enum(TOOL_OPTIONS.map((t) => t.key) as [string, ...string[]])).default([]),
    selfAssessment: z.object(Object.fromEntries(SELF_ASSESSMENT.map((q) => [q.key, z.int().min(1).max(5)]))),
    consents: z.array(z.enum(CONSENT_KEYS)),
    activationCode: z.string().trim().max(20).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.schoolId && !value.newSchoolName) ctx.addIssue({ code: "custom", path: ["schoolId"], message: "Vui lòng chọn trường." });
    if (!value.facultyId && !value.newFacultyName) ctx.addIssue({ code: "custom", path: ["facultyId"], message: "Vui lòng chọn hoặc nhập khoa." });
    if (!REQUIRED_CONSENTS.every((key) => value.consents.includes(key))) {
      ctx.addIssue({ code: "custom", path: ["consents"], message: "Bạn cần đồng ý 2 điều khoản bắt buộc để tham gia." });
    }
  });
export type EnrollInput = z.input<typeof EnrollInput>;

export async function getOpenEnrollment(userId: string) {
  const [row] = await db
    .select()
    .from(enrollment)
    .where(and(eq(enrollment.userId, userId), inArray(enrollment.status, [...OPEN_STATUSES])));
  return row ?? null;
}

/** Hồ sơ gần nhất (kể cả đã kết thúc), để hiện kết quả sau khi hoàn thành. */
export async function getLatestEnrollment(userId: string) {
  const [row] = await db.select().from(enrollment).where(eq(enrollment.userId, userId)).orderBy(sql`${enrollment.createdAt} desc`).limit(1);
  return row ?? null;
}

export type EnrollmentRow = typeof enrollment.$inferSelect;

/** Mô tả hồ sơ học dưới dạng tài nguyên để kiểm tra quyền. */
export function studentResource(row: EnrollmentRow, kind: Resource["kind"] = "student_record"): Resource {
  return {
    kind,
    ownerUserId: row.userId,
    schoolId: row.schoolId,
    facultyId: row.facultyId ?? undefined,
    classId: row.classId ?? undefined,
    assignedStaffIds: [row.mentorId, row.taId].filter((id): id is string => Boolean(id)),
  };
}

export function scheduleOf(row: EnrollmentRow, now = new Date()) {
  return computeSchedule({ startDate: row.startDate, extensionDays: row.extensionDays, pausedDays: row.pausedDays, pausedSince: row.pausedSince }, now);
}

/** Nhân sự có vai trò này và đang phụ trách ít hồ sơ đang mở nhất. */
async function leastLoadedStaff(role: "mentor" | "ta", column: typeof enrollment.mentorId | typeof enrollment.taId) {
  const staff = await db
    .select({ userId: roleAssignment.userId })
    .from(roleAssignment)
    .innerJoin(user, eq(user.id, roleAssignment.userId))
    .where(and(eq(roleAssignment.role, role), isNull(roleAssignment.revokedAt), eq(user.status, "active")));
  if (staff.length === 0) return null;
  const loads = await db
    .select({ staffId: column, total: count() })
    .from(enrollment)
    .where(inArray(enrollment.status, [...OPEN_STATUSES]))
    .groupBy(column);
  const loadOf = (id: string) => Number(loads.find((l) => l.staffId === id)?.total ?? 0);
  return [...new Set(staff.map((s) => s.userId))].sort((a, b) => loadOf(a) - loadOf(b) || a.localeCompare(b))[0]!;
}

export async function createEnrollment(actor: Actor, raw: EnrollInput) {
  if (actor.status !== "active") throw new Error("Tài khoản đã bị khóa.");
  const input = EnrollInput.parse(raw);
  if (await getOpenEnrollment(actor.userId)) throw new Error("Bạn đã có hồ sơ học đang mở.");

  let codeError: string | null = null;
  let eventId: string | null = null;
  let codeId: string | null = null;
  let schoolId = input.schoolId ?? null;
  if (input.activationCode) {
    const redeemed = await redeemActivationCode(input.activationCode);
    if (redeemed.ok) {
      eventId = redeemed.eventId;
      codeId = redeemed.codeId;
      schoolId ??= redeemed.schoolId;
    } else {
      codeError = redeemed.reason;
    }
  }
  if (!schoolId) schoolId = (await findOrCreateSchoolBySelfReport(input.newSchoolName!, actor.userId)).id;

  let facultyId = input.facultyId ?? null;
  let classId: string | null = null;
  if (facultyId) {
    const [f] = await db.select().from(faculty).where(and(eq(faculty.id, facultyId), eq(faculty.schoolId, schoolId)));
    if (!f) throw new Error("Khoa không thuộc trường đã chọn.");
    if (input.className) classId = (await findOrCreateFacultyAndClass(schoolId, f.name, input.className)).schoolClass?.id ?? null;
  } else {
    const created = await findOrCreateFacultyAndClass(schoolId, input.newFacultyName!, input.className ?? null);
    facultyId = created.faculty.id;
    classId = created.schoolClass?.id ?? null;
  }

  const [mentorId, taId] = await Promise.all([leastLoadedStaff("mentor", enrollment.mentorId), leastLoadedStaff("ta", enrollment.taId)]);

  const created = await db.transaction(async (tx) => {
    await tx.update(user).set({ name: input.name, phone: input.phone ?? null, updatedAt: new Date() }).where(eq(user.id, actor.userId));
    const [row] = await tx
      .insert(enrollment)
      .values({
        userId: actor.userId,
        programVersion: PROGRAM_VERSION,
        track: input.track,
        schoolId: schoolId!,
        facultyId,
        classId,
        studentCode: input.studentCode || null,
        targetPosition: input.targetPosition,
        eventId,
        activationCodeId: codeId,
        startDate: vnDateOf(new Date()),
        tools: input.tools,
        selfAssessmentStart: input.selfAssessment as Record<string, number>,
        mentorId,
        taId,
      })
      .returning();
    await recordAudit({ actorId: actor.userId, action: "enrollment.created", targetType: "enrollment", targetId: row!.id, metadata: { eventId, schoolId } }, tx);
    return row!;
  });
  await grantConsents(actor, input.consents as ConsentKey[]);
  return { enrollment: created, codeError };
}

async function loadForAdjust(actor: Actor, enrollmentId: string) {
  const [row] = await db.select().from(enrollment).where(eq(enrollment.id, enrollmentId));
  if (!row) throw new Error("Không tìm thấy hồ sơ học.");
  authorize(actor, "enrollment.adjust", studentResource(row));
  return row;
}

export async function extendEnrollment(actor: Actor, enrollmentId: string) {
  const row = await loadForAdjust(actor, enrollmentId);
  if (row.extensionDays > 0) throw new Error("Mỗi SV chỉ được gia hạn 1 lần.");
  await db.update(enrollment).set({ extensionDays: EXTENSION_DAYS }).where(eq(enrollment.id, row.id));
  await recordAudit({ actorId: actor.userId, action: "enrollment.extended", targetType: "enrollment", targetId: row.id, metadata: { days: EXTENSION_DAYS } });
}

export async function pauseEnrollment(actor: Actor, enrollmentId: string) {
  const row = await loadForAdjust(actor, enrollmentId);
  if (row.pausedSince) throw new Error("Hồ sơ đang bảo lưu.");
  if (row.pausedDays >= MAX_PAUSE_DAYS) throw new Error(`Đã dùng hết ${MAX_PAUSE_DAYS} ngày bảo lưu.`);
  await db.update(enrollment).set({ status: "paused", pausedSince: new Date() }).where(eq(enrollment.id, row.id));
  await recordAudit({ actorId: actor.userId, action: "enrollment.paused", targetType: "enrollment", targetId: row.id });
}

export async function resumeEnrollment(actor: Actor, enrollmentId: string) {
  const row = await loadForAdjust(actor, enrollmentId);
  if (!row.pausedSince) throw new Error("Hồ sơ không ở trạng thái bảo lưu.");
  const days = Math.min(MAX_PAUSE_DAYS - row.pausedDays, Math.max(0, Math.round((Date.now() - row.pausedSince.getTime()) / 86_400_000)));
  await db
    .update(enrollment)
    .set({ status: "active", pausedSince: null, pausedDays: row.pausedDays + days, lastActivityAt: new Date() })
    .where(eq(enrollment.id, row.id));
  await recordAudit({ actorId: actor.userId, action: "enrollment.resumed", targetType: "enrollment", targetId: row.id, metadata: { days } });
}

export async function changeTrack(actor: Actor, track: Track) {
  const row = await getOpenEnrollment(actor.userId);
  if (!row) throw new Error("Bạn chưa có hồ sơ học.");
  if (scheduleOf(row).dayNumber >= TRACK_LOCK_DAY) throw new Error(`Chỉ được đổi khối ngành trước ngày ${TRACK_LOCK_DAY}.`);
  await db.update(enrollment).set({ track }).where(eq(enrollment.id, row.id));
}

/** Đánh dấu SV vừa có hoạt động học. */
export async function touchActivity(enrollmentId: string) {
  await db
    .update(enrollment)
    .set({ lastActivityAt: new Date(), status: sql`case when ${enrollment.status} = 'inactive' then 'active' else ${enrollment.status} end` })
    .where(eq(enrollment.id, enrollmentId));
}

// Gộp trường: chuyển hồ sơ học sang trường giữ lại.
onSchoolMerge(async (tx, { keepId, removeId, facultyMap }) => {
  for (const [from, to] of facultyMap) {
    if (from !== to) await tx.update(enrollment).set({ facultyId: to }).where(eq(enrollment.facultyId, from));
  }
  await tx.update(enrollment).set({ schoolId: keepId }).where(eq(enrollment.schoolId, removeId));
});
