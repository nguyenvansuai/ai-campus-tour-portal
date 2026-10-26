import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { lessonByNumber, MODULES } from "@/modules/curriculum/content/program";
import { enrollment } from "@/modules/enrollment/schema";
import { studentResource } from "@/modules/enrollment/service";
import { authorize, scopeFilter, type Actor } from "@/modules/identity/policy";
import { user } from "@/modules/identity/schema";
import { lessonProgress, moduleReport } from "@/modules/learning/schema";
import { school } from "@/modules/org/schema";
import { reportReview } from "./schema";

export class ReviewError extends Error {}

const WAITING = ["submitted", "prechecked"] as const;

/** Hàng đợi chấm: bài đang chờ, sắp theo hạn phản hồi. `mine`: chỉ bài được phân công cho tôi. */
export async function reviewQueue(actor: Actor, options: { mine?: boolean; moduleId?: string } = {}) {
  const filter = scopeFilter(actor);
  if ("none" in filter) return [];
  const conditions = [inArray(moduleReport.status, [...WAITING])];
  if (options.moduleId) conditions.push(eq(moduleReport.moduleId, options.moduleId as "M1"));
  const isAll = "all" in filter;
  if (!isAll || options.mine) {
    if (!isAll && !filter.assignedToUserId) return [];
    conditions.push(or(eq(enrollment.mentorId, actor.userId), eq(enrollment.taId, actor.userId))!);
  }
  const rows = await db
    .select({
      id: moduleReport.id,
      moduleId: moduleReport.moduleId,
      status: moduleReport.status,
      version: moduleReport.version,
      submittedAt: moduleReport.submittedAt,
      reviewDueAt: moduleReport.reviewDueAt,
      late: moduleReport.late,
      track: enrollment.track,
      studentName: user.name,
      studentEmail: user.email,
      schoolName: school.name,
    })
    .from(moduleReport)
    .innerJoin(enrollment, eq(enrollment.id, moduleReport.enrollmentId))
    .innerJoin(user, eq(user.id, enrollment.userId))
    .innerJoin(school, eq(school.id, enrollment.schoolId))
    .where(and(...conditions))
    .orderBy(asc(moduleReport.reviewDueAt))
    .limit(200);
  const now = Date.now();
  return rows.map((row) => ({ ...row, overdue: row.reviewDueAt.getTime() < now }));
}

async function loadReport(reportId: string) {
  const [report] = await db.select().from(moduleReport).where(eq(moduleReport.id, reportId));
  if (!report) throw new ReviewError("Không tìm thấy báo cáo.");
  const [row] = await db.select().from(enrollment).where(eq(enrollment.id, report.enrollmentId));
  return { report, row: row! };
}

export async function getReportForReview(actor: Actor, reportId: string) {
  const { report, row } = await loadReport(reportId);
  authorize(actor, "submission.view", studentResource(row, "submission"));
  const programModule = MODULES.find((m) => m.id === report.moduleId)!;
  const [student] = await db
    .select({ name: user.name, email: user.email, schoolName: school.name })
    .from(user)
    .innerJoin(school, eq(school.id, row.schoolId))
    .where(eq(user.id, row.userId));
  const lessons = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.enrollmentId, row.id), inArray(lessonProgress.lessonNumber, programModule.lessonNumbers)))
    .orderBy(asc(lessonProgress.lessonNumber));
  return {
    report,
    enrollment: row,
    student: student!,
    criteria: programModule.reportCriteria ?? [],
    lessons: lessons.map((l) => ({ ...l, title: lessonByNumber(l.lessonNumber)?.title ?? "" })),
    history: await reviewHistory(report.id),
  };
}

export async function precheckReport(actor: Actor, reportId: string, input: { ok: boolean; comment: string }) {
  const { report, row } = await loadReport(reportId);
  authorize(actor, "submission.precheck", studentResource(row, "submission"));
  if (report.status !== "submitted") throw new ReviewError("Báo cáo này không ở trạng thái chờ kiểm hồ sơ.");
  if (!input.ok && !input.comment.trim()) throw new ReviewError("Vui lòng ghi rõ thiếu gì để SV bổ sung.");
  const result = input.ok ? "prechecked" : "returned";
  await db.transaction(async (tx) => {
    await tx.insert(reportReview).values({ reportId, version: report.version, reviewerId: actor.userId, kind: "precheck", result, comment: input.comment.trim() });
    await tx.update(moduleReport).set({ status: result }).where(eq(moduleReport.id, reportId));
    await recordAudit({ actorId: actor.userId, action: "report.prechecked", targetType: "module_report", targetId: reportId, metadata: { result } }, tx);
  });
  return result;
}

export async function reviewReport(actor: Actor, reportId: string, input: { criteriaMet: boolean[]; comment: string }) {
  const { report, row } = await loadReport(reportId);
  authorize(actor, "submission.review", studentResource(row, "submission"));
  if (!(WAITING as readonly string[]).includes(report.status)) throw new ReviewError("Báo cáo này đã chấm hoặc đang chờ SV nộp lại.");
  const criteria = MODULES.find((m) => m.id === report.moduleId)!.reportCriteria ?? [];
  if (input.criteriaMet.length !== criteria.length) throw new ReviewError("Vui lòng đánh giá đủ các tiêu chí.");
  const passed = input.criteriaMet.every(Boolean);
  if (!passed && !input.comment.trim()) throw new ReviewError("Vui lòng ghi nhận xét để SV biết cần sửa gì.");
  const result = passed ? "passed" : "needs_revision";
  await db.transaction(async (tx) => {
    await tx.insert(reportReview).values({ reportId, version: report.version, reviewerId: actor.userId, kind: "review", result, criteriaMet: input.criteriaMet, comment: input.comment.trim() });
    await tx.update(moduleReport).set({ status: result }).where(eq(moduleReport.id, reportId));
    await recordAudit({ actorId: actor.userId, action: "report.reviewed", targetType: "module_report", targetId: reportId, metadata: { result, moduleId: report.moduleId } }, tx);
  });
  return result;
}

const RESULT_LABELS = {
  prechecked: "Trợ giảng: Đủ hồ sơ",
  returned: "Trợ giảng: Thiếu hồ sơ",
  passed: "Mentor: Đạt",
  needs_revision: "Mentor: Cần sửa",
} as const;

/** Lịch sử kiểm/chấm của một báo cáo (mới nhất trước), dùng cho cả SV và nhân sự. */
export async function reviewHistory(reportId: string) {
  const [report] = await db.select({ moduleId: moduleReport.moduleId }).from(moduleReport).where(eq(moduleReport.id, reportId));
  const criteria = MODULES.find((m) => m.id === report?.moduleId)?.reportCriteria ?? [];
  const rows = await db.select().from(reportReview).where(eq(reportReview.reportId, reportId)).orderBy(desc(reportReview.createdAt));
  return rows.map((r) => ({
    id: r.id,
    version: r.version,
    kind: r.kind,
    result: r.result,
    label: RESULT_LABELS[r.result],
    comment: r.comment,
    unmet: r.kind === "review" ? criteria.filter((_, i) => r.criteriaMet[i] === false) : [],
    createdAt: r.createdAt,
  }));
}

/** TA/mentor kiểm ngẫu nhiên minh chứng một buổi. Không hợp lệ thì buổi bị bỏ tích, SV phải nộp lại. */
export async function spotCheckLesson(actor: Actor, lessonProgressId: string, input: { ok: boolean; note: string }) {
  const [lesson] = await db.select().from(lessonProgress).where(eq(lessonProgress.id, lessonProgressId));
  if (!lesson) throw new ReviewError("Không tìm thấy minh chứng.");
  const [row] = await db.select().from(enrollment).where(eq(enrollment.id, lesson.enrollmentId));
  authorize(actor, "submission.precheck", studentResource(row!, "submission"));
  if (!input.ok && !input.note.trim()) throw new ReviewError("Vui lòng ghi lý do không hợp lệ.");
  await db.update(lessonProgress).set({ spotCheckOk: input.ok, spotCheckNote: input.note.trim() || null }).where(eq(lessonProgress.id, lessonProgressId));
  await recordAudit({ actorId: actor.userId, action: "lesson.spot_checked", targetType: "lesson_progress", targetId: lessonProgressId, metadata: { ok: input.ok } });
}
