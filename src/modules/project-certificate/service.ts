import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { escapeHtml, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, storage } from "@/lib/storage";
import { EXCELLENT_SCORE, FINAL_RUBRIC, LESSONS, PASS_SCORE, quizIdFor, SELF_ASSESSMENT } from "@/modules/curriculum/content/program";
import type { Track } from "@/modules/curriculum/types";
import { enrollment } from "@/modules/enrollment/schema";
import { getOpenEnrollment, scheduleOf, studentResource, touchActivity, type EnrollmentRow } from "@/modules/enrollment/service";
import { authorize, can, ForbiddenError, scopeFilter, type Actor } from "@/modules/identity/policy";
import { user } from "@/modules/identity/schema";
import { storedFile } from "@/modules/learning/schema";
import { folderPathFor, getProgress } from "@/modules/learning/service";
import { generateActivationCode } from "@/modules/org/codes";
import { school } from "@/modules/org/schema";
import { FINAL_FIELDS, INSTITUTE_NAME } from "./fields";
import { certificate, finalProject, finalScore } from "./schema";

export class ProjectError extends Error {}

const REVIEW_SLA_DAYS = 3;
const REPORT_MODULES = ["M1", "M2", "M3", "M4"] as const;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Nộp dự án cuối

export type FinalSubmission = {
  fields: Record<string, string>;
  pdf: File | undefined;
  selfAssessment: Record<string, number>;
  showProjectLink: boolean;
};

export async function getFinalProject(enrollmentId: string) {
  const [project] = await db.select().from(finalProject).where(eq(finalProject.enrollmentId, enrollmentId));
  return project ?? null;
}

export async function submitFinalProject(actor: Actor, submission: FinalSubmission) {
  const row = await getOpenEnrollment(actor.userId);
  if (!row) throw new ProjectError("Bạn chưa bắt đầu lộ trình.");
  authorize(actor, "submission.create", studentResource(row, "submission"));
  const progress = await getProgress(row.id);
  if (!progress.unlocked.M5) throw new ProjectError("Dự án cuối chưa mở: cần nộp báo cáo M4 và học ít nhất 14 ngày.");
  const now = new Date();
  if (now > scheduleOf(row, now).hardDeadline) throw new ProjectError("Đã quá hạn cứng của lộ trình, không nộp được nữa.");

  const existing = await getFinalProject(row.id);
  if (existing) {
    if (existing.status === "passed") throw new ProjectError("Dự án đã Đạt.");
    if (existing.status === "failed") throw new ProjectError("Dự án đã được chấm Không đạt.");
    if (existing.status !== "needs_revision") throw new ProjectError("Dự án đang chờ chấm, chưa nộp lại được.");
  }

  const clean: Record<string, string> = {};
  for (const field of FINAL_FIELDS) {
    const value = (submission.fields[field.key] ?? "").trim();
    if (!value) throw new ProjectError(`Vui lòng điền: ${field.label}.`);
    if (field.type === "link" && !isHttpUrl(value)) throw new ProjectError(`${field.label}: vui lòng dán đường link bắt đầu bằng https://`);
    if (value.length < field.minLength) throw new ProjectError(`${field.label}: cần viết ít nhất ${field.minLength} ký tự.`);
    clean[field.key] = value.slice(0, 5000);
  }
  const assessment: Record<string, number> = {};
  for (const item of SELF_ASSESSMENT) {
    const value = Number(submission.selfAssessment[item.key]);
    if (!Number.isInteger(value) || value < 1 || value > 5) throw new ProjectError(`Vui lòng tự đánh giá: ${item.label}.`);
    assessment[item.key] = value;
  }
  const pdf = submission.pdf;
  if (!pdf || pdf.size === 0) throw new ProjectError("Vui lòng tải lên file PDF mô tả dự án.");
  if (pdf.type !== "application/pdf" || !ALLOWED_UPLOAD_TYPES.test(pdf.type)) throw new ProjectError("File dự án phải là PDF.");
  if (pdf.size > MAX_UPLOAD_BYTES) throw new ProjectError("File PDF tối đa 10 MB.");

  const stored = await storage().put(
    { name: `DuAnCuoi_v${(existing?.version ?? 0) + 1}_${pdf.name}`.replace(/[\\/]/g, "_"), type: pdf.type, bytes: new Uint8Array(await pdf.arrayBuffer()) },
    await folderPathFor(row, "M5"),
  );
  const reviewDueAt = new Date(now.getTime() + REVIEW_SLA_DAYS * 86_400_000);
  await db.transaction(async (tx) => {
    const [file] = await tx
      .insert(storedFile)
      .values({ enrollmentId: row.id, uploadedBy: actor.userId, driver: stored.driver, externalId: stored.externalId, name: pdf.name, mimeType: pdf.type, size: pdf.size })
      .returning({ id: storedFile.id });
    const values = { fields: clean, pdfFileId: file!.id, showProjectLink: submission.showProjectLink, status: "submitted" as const, finalScore: null, submittedAt: now, reviewDueAt };
    if (existing) await tx.update(finalProject).set({ ...values, version: existing.version + 1 }).where(eq(finalProject.id, existing.id));
    else await tx.insert(finalProject).values({ enrollmentId: row.id, ...values });
    await tx.update(enrollment).set({ selfAssessmentEnd: assessment }).where(eq(enrollment.id, row.id));
    await recordAudit({ actorId: actor.userId, action: "final.submitted", targetType: "enrollment", targetId: row.id, metadata: { version: (existing?.version ?? 0) + 1 } }, tx);
  });
  await touchActivity(row.id);
}

// ---------------------------------------------------------------------------
// Chấm dự án

async function loadProject(projectId: string) {
  const [project] = await db.select().from(finalProject).where(eq(finalProject.id, projectId));
  if (!project) throw new ProjectError("Không tìm thấy dự án.");
  const [row] = await db.select().from(enrollment).where(eq(enrollment.id, project.enrollmentId));
  return { project, row: row! };
}

async function scoresOf(projectId: string, version?: number) {
  const conditions = [eq(finalScore.projectId, projectId)];
  if (version !== undefined) conditions.push(eq(finalScore.version, version));
  return db
    .select({ score: finalScore, reviewerName: user.name, reviewerEmail: user.email })
    .from(finalScore)
    .leftJoin(user, eq(user.id, finalScore.reviewerId))
    .where(and(...conditions))
    .orderBy(asc(finalScore.createdAt));
}

/** Xem dự án: người được xem bài của SV, hoặc mentor bất kỳ khi dự án đang chờ chấm lần 2. */
function authorizeView(actor: Actor, project: typeof finalProject.$inferSelect, row: EnrollmentRow) {
  const resource = studentResource(row, "submission");
  if (can(actor, "submission.view", resource)) return;
  if (project.status === "awaiting_second" && can(actor, "final.second_review", resource)) return;
  throw new ForbiddenError("submission.view", "submission");
}

export async function getProjectForScoring(actor: Actor, projectId: string) {
  const { project, row } = await loadProject(projectId);
  authorizeView(actor, project, row);
  const [student] = await db
    .select({ name: user.name, email: user.email, schoolName: school.name })
    .from(user)
    .innerJoin(school, eq(school.id, row.schoolId))
    .where(eq(user.id, row.userId));
  return { project, enrollment: row, student: student!, scores: await scoresOf(project.id) };
}

export async function finalQueue(actor: Actor) {
  const filter = scopeFilter(actor);
  if ("none" in filter) return [];
  const isAll = "all" in filter;
  const canSecond = can(actor, "final.second_review", { kind: "submission" });
  const firstStage = isAll
    ? eq(finalProject.status, "submitted")
    : canSecond
      ? and(eq(finalProject.status, "submitted"), eq(enrollment.mentorId, actor.userId))
      : undefined;
  const secondStage = canSecond ? eq(finalProject.status, "awaiting_second") : undefined;
  const stages = [firstStage, secondStage].filter(Boolean);
  if (!stages.length) return [];
  const rows = await db
    .select({
      id: finalProject.id,
      status: finalProject.status,
      version: finalProject.version,
      title: finalProject.fields,
      submittedAt: finalProject.submittedAt,
      reviewDueAt: finalProject.reviewDueAt,
      studentName: user.name,
      studentEmail: user.email,
      schoolName: school.name,
    })
    .from(finalProject)
    .innerJoin(enrollment, eq(enrollment.id, finalProject.enrollmentId))
    .innerJoin(user, eq(user.id, enrollment.userId))
    .innerJoin(school, eq(school.id, enrollment.schoolId))
    .where(or(...stages))
    .orderBy(asc(finalProject.reviewDueAt))
    .limit(200);
  // Người đã chấm lần 1 không chấm lần 2 của cùng phiên bản.
  const firstScorers = rows.length
    ? await db.select().from(finalScore).where(inArray(finalScore.projectId, rows.map((r) => r.id)))
    : [];
  const now = Date.now();
  return rows
    .filter((r) => r.status !== "awaiting_second" || !firstScorers.some((s) => s.projectId === r.id && s.version === r.version && s.reviewerId === actor.userId))
    .map((r) => ({ ...r, title: r.title.title ?? "", overdue: r.reviewDueAt.getTime() < now }));
}

export async function scoreFinalProject(actor: Actor, projectId: string, input: { scores: Record<string, number>; comment: string }) {
  const { project, row } = await loadProject(projectId);
  const resource = studentResource(row, "submission");
  if (project.status === "submitted") authorize(actor, "submission.review", resource);
  else if (project.status === "awaiting_second") authorize(actor, "final.second_review", resource);
  else throw new ProjectError("Dự án này đã chấm xong hoặc đang chờ SV nộp lại.");

  const scores: Record<string, number> = {};
  for (const item of FINAL_RUBRIC) {
    const value = Number(input.scores[item.key]);
    if (!Number.isInteger(value) || value < 0 || value > item.max) throw new ProjectError(`${item.label}: điểm từ 0 đến ${item.max}.`);
    scores[item.key] = value;
  }
  const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
  const comment = input.comment.trim();

  let finalTotal = total;
  if (project.status === "awaiting_second") {
    const previous = await scoresOf(project.id, project.version);
    const first = previous[0]?.score;
    if (!first) throw new ProjectError("Chưa có lượt chấm thứ nhất.");
    if (first.reviewerId === actor.userId) throw new ProjectError("Lần chấm thứ 2 phải do người khác chấm độc lập.");
    finalTotal = Math.round((first.total + total) / 2);
  }
  if (finalTotal < PASS_SCORE && !comment) throw new ProjectError("Vui lòng ghi nhận xét để SV biết cần sửa gì.");

  const status =
    project.status === "submitted" && total >= EXCELLENT_SCORE
      ? "awaiting_second"
      : finalTotal >= PASS_SCORE
        ? "passed"
        : project.version >= 2
          ? "failed"
          : "needs_revision";
  await db.transaction(async (tx) => {
    await tx.insert(finalScore).values({ projectId, version: project.version, reviewerId: actor.userId, scores, total, comment });
    await tx
      .update(finalProject)
      .set({ status, finalScore: status === "awaiting_second" ? null : finalTotal })
      .where(eq(finalProject.id, projectId));
    if (status === "failed") await tx.update(enrollment).set({ status: "failed" }).where(eq(enrollment.id, row.id));
    await recordAudit({ actorId: actor.userId, action: "final.scored", targetType: "final_project", targetId: projectId, metadata: { total, status } }, tx);
  });
  return { status, total: finalTotal };
}

/** Mentor chấm lần 2 không được phân công cho SV vẫn cần mở PDF của dự án đang chờ chấm lần 2. */
export async function readFinalPdfForSecondReviewer(actor: Actor, fileId: string) {
  const [match] = await db
    .select({ project: finalProject, file: storedFile })
    .from(finalProject)
    .innerJoin(storedFile, eq(storedFile.id, finalProject.pdfFileId))
    .where(and(eq(finalProject.pdfFileId, fileId), eq(finalProject.status, "awaiting_second")));
  if (!match) throw new ForbiddenError("submission.view", "submission");
  const [row] = await db.select().from(enrollment).where(eq(enrollment.id, match.project.enrollmentId));
  authorize(actor, "final.second_review", studentResource(row!, "submission"));
  return { name: match.file.name, type: match.file.mimeType, bytes: await storage().get(match.file.externalId) };
}

// ---------------------------------------------------------------------------
// Điều kiện và duyệt chứng nhận

export type Eligibility = { eligible: boolean; checks: { label: string; ok: boolean }[] };

export async function eligibilityOf(row: EnrollmentRow): Promise<Eligibility> {
  const [progress, project] = await Promise.all([getProgress(row.id), getFinalProject(row.id)]);
  const quizIds = (["M1", "M2", "M3"] as const).map((m) => quizIdFor(m, row.track as Track)!);
  const lessonsDone = LESSONS.filter((l) => progress.completedLessons.has(l.number)).length;
  const reportsPassed = REPORT_MODULES.filter((m) => progress.reports.get(m)?.status === "passed").length;
  const quizzesPassed = quizIds.filter((id) => progress.passedQuizzes.has(id)).length;
  const checks = [
    { label: `Hoàn thành ${LESSONS.length}/${LESSONS.length} buổi (hiện ${lessonsDone})`, ok: lessonsDone === LESSONS.length },
    { label: `4/4 báo cáo module Đạt (hiện ${reportsPassed})`, ok: reportsPassed === REPORT_MODULES.length },
    { label: `Đạt trắc nghiệm M1–M3 (hiện ${quizzesPassed}/3)`, ok: quizzesPassed === 3 },
    { label: `Dự án cuối Đạt (≥ ${PASS_SCORE} điểm)`, ok: project?.status === "passed" },
  ];
  return { eligible: checks.every((c) => c.ok), checks };
}

export type ApprovalRole = "school" | "institute";

/** Danh sách chờ duyệt: chỉ gồm SV đủ điều kiện, trong phạm vi của người duyệt, chưa được cấp. */
export async function approvalQueue(actor: Actor, as: ApprovalRole) {
  const filter = scopeFilter(actor);
  if ("none" in filter) return [];
  const conditions = [eq(finalProject.status, "passed"), isNull(certificate.issuedAt), isNull(certificate.revokedAt)];
  if (as === "school") {
    conditions.push(eq(school.connected, true), isNull(certificate.schoolApprovedAt));
    if (!("all" in filter)) {
      const schoolIds = actor.roles.filter((g) => g.role === "school_manager" && g.scopeType === "school" && g.scopeId).map((g) => g.scopeId as string);
      if (!schoolIds.length) return [];
      conditions.push(inArray(enrollment.schoolId, schoolIds));
    }
  } else {
    if (!can(actor, "certificate.approve_institute", { kind: "certificate" })) return [];
    conditions.push(isNull(certificate.instituteApprovedAt));
  }
  const rows = await db
    .select({ enrollment, studentName: user.name, studentEmail: user.email, schoolName: school.name, connected: school.connected, project: finalProject, certificate })
    .from(finalProject)
    .innerJoin(enrollment, eq(enrollment.id, finalProject.enrollmentId))
    .innerJoin(user, eq(user.id, enrollment.userId))
    .innerJoin(school, eq(school.id, enrollment.schoolId))
    .leftJoin(certificate, eq(certificate.enrollmentId, enrollment.id))
    .where(and(...conditions))
    .orderBy(asc(school.name), asc(user.name))
    .limit(500);
  const result = [];
  for (const r of rows) {
    if (!(await eligibilityOf(r.enrollment)).eligible) continue;
    result.push({
      enrollmentId: r.enrollment.id,
      studentName: r.studentName,
      studentEmail: r.studentEmail,
      schoolName: r.schoolName,
      projectTitle: r.project.fields.title ?? "",
      score: r.project.finalScore ?? 0,
      requiresSchool: r.certificate?.requiresSchool ?? r.connected,
      schoolApproved: Boolean(r.certificate?.schoolApprovedAt),
      instituteApproved: Boolean(r.certificate?.instituteApprovedAt),
    });
  }
  return result;
}

export async function approveCertificates(actor: Actor, enrollmentIds: string[], as: ApprovalRole) {
  const issued: string[] = [];
  for (const enrollmentId of [...new Set(enrollmentIds)]) {
    const code = await approveOne(actor, enrollmentId, as);
    if (code) issued.push(code);
  }
  return { approved: enrollmentIds.length, issued };
}

async function approveOne(actor: Actor, enrollmentId: string, as: ApprovalRole) {
  const [info] = await db
    .select({ row: enrollment, schoolName: school.name, connected: school.connected, studentName: user.name, studentEmail: user.email })
    .from(enrollment)
    .innerJoin(school, eq(school.id, enrollment.schoolId))
    .innerJoin(user, eq(user.id, enrollment.userId))
    .where(eq(enrollment.id, enrollmentId));
  if (!info) throw new ProjectError("Không tìm thấy hồ sơ học.");
  const resource = { kind: "certificate" as const, schoolId: info.row.schoolId };
  authorize(actor, as === "school" ? "certificate.approve_school" : "certificate.approve_institute", resource);
  if (!(await eligibilityOf(info.row)).eligible) throw new ProjectError(`${info.studentName || info.studentEmail} chưa đủ điều kiện nhận chứng nhận.`);
  const project = (await getFinalProject(enrollmentId))!;

  let [cert] = await db.select().from(certificate).where(eq(certificate.enrollmentId, enrollmentId));
  if (cert?.issuedAt) return null;
  if (cert?.revokedAt) throw new ProjectError("Chứng nhận đã bị thu hồi.");
  if (as === "school" && !(cert?.requiresSchool ?? info.connected)) throw new ProjectError("Trường chưa kết nối: chỉ Viện duyệt.");
  if (!cert) {
    const score = project.finalScore ?? 0;
    [cert] = await db
      .insert(certificate)
      .values({
        enrollmentId,
        requiresSchool: info.connected,
        grade: score >= EXCELLENT_SCORE ? "excellent" : "completed",
        score,
        studentName: info.studentName || info.studentEmail,
        schoolName: info.schoolName,
        projectTitle: project.fields.title ?? "",
        projectUrl: project.showProjectLink ? (project.fields.projectUrl ?? null) : null,
      })
      .returning();
  }
  const now = new Date();
  const approval = as === "school" ? { schoolApprovedBy: actor.userId, schoolApprovedAt: now } : { instituteApprovedBy: actor.userId, instituteApprovedAt: now };
  const ready = (as === "institute" || Boolean(cert!.instituteApprovedAt)) && (!cert!.requiresSchool || as === "school" || Boolean(cert!.schoolApprovedAt));
  const code = ready ? generateActivationCode(10) : null;
  await db.transaction(async (tx) => {
    await tx
      .update(certificate)
      .set({ ...approval, ...(code ? { code, issuedAt: now, issuers: cert!.requiresSchool ? [cert!.schoolName, INSTITUTE_NAME] : [INSTITUTE_NAME] } : {}) })
      .where(eq(certificate.id, cert!.id));
    await recordAudit({ actorId: actor.userId, action: "certificate.approved", targetType: "certificate", targetId: cert!.id, metadata: { as, issued: Boolean(code) } }, tx);
    if (code) await tx.update(enrollment).set({ status: "completed" }).where(eq(enrollment.id, enrollmentId));
  });
  if (code) await sendCertificateEmail(info.studentEmail, info.studentName, code);
  return code;
}

async function sendCertificateEmail(to: string, name: string, code: string) {
  const link = `${env().APP_URL}/chung-nhan/${code}`;
  const greeting = `Chào ${name || "bạn"},`;
  const line = "Chúc mừng bạn đã hoàn thành Lộ trình Ứng dụng AI 30 ngày của AI Campus Tour. Chứng nhận của bạn đã được cấp.";
  await sendEmail({
    to,
    subject: "Chứng nhận AI Campus Tour của bạn đã được cấp",
    text: [greeting, "", line, `Mã chứng nhận: ${code}`, `Xem và in: ${link}`, "", "AI Campus Tour"].join("\n"),
    html: `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5"><p>${escapeHtml(greeting)}</p><p>${escapeHtml(line)}</p><p>Mã chứng nhận: <b>${code}</b></p><p><a href="${link}">Xem và in chứng nhận</a></p></div>`,
  });
}

export async function revokeCertificate(actor: Actor, certificateId: string, reason: string) {
  authorize(actor, "certificate.revoke", { kind: "certificate" });
  if (!reason.trim()) throw new ProjectError("Vui lòng ghi lý do thu hồi.");
  await db.update(certificate).set({ revokedAt: new Date(), revokedReason: reason.trim() }).where(eq(certificate.id, certificateId));
  await recordAudit({ actorId: actor.userId, action: "certificate.revoked", targetType: "certificate", targetId: certificateId, metadata: { reason: reason.trim() } });
}

// ---------------------------------------------------------------------------
// Tra cứu

export async function findCertificateByCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(normalized)) return null;
  const [cert] = await db.select().from(certificate).where(eq(certificate.code, normalized));
  return cert ?? null;
}

/** Thông tin công khai cho trang xác thực: không có email/SĐT. */
export async function verifyCertificate(code: string) {
  const cert = await findCertificateByCode(code);
  if (!cert?.issuedAt) return null;
  return {
    code: cert.code!,
    studentName: cert.studentName,
    schoolName: cert.schoolName,
    issuers: cert.issuers,
    issuedAt: cert.issuedAt,
    grade: cert.grade,
    projectTitle: cert.projectTitle,
    projectUrl: cert.projectUrl,
    revoked: Boolean(cert.revokedAt),
  };
}

/** Tổng hợp cho trang /hoc/du-an của SV (hồ sơ mới nhất). */
export async function finalOverviewFor(row: EnrollmentRow) {
  const project = await getFinalProject(row.id);
  const [scores, eligibility, [cert]] = await Promise.all([
    project ? scoresOf(project.id) : Promise.resolve([]),
    eligibilityOf(row),
    db.select().from(certificate).where(eq(certificate.enrollmentId, row.id)),
  ]);
  return {
    project,
    // SV chỉ thấy nhận xét và tổng điểm, không thấy người chấm.
    feedback: scores
      .filter((s) => !(project?.status === "awaiting_second" && s.score.version === project.version))
      .map((s) => ({ version: s.score.version, total: s.score.total, scores: s.score.scores, comment: s.score.comment, createdAt: s.score.createdAt }))
      .reverse(),
    eligibility,
    certificate: cert ?? null,
  };
}

export async function listIssuedCertificates(limit = 200) {
  return db.select().from(certificate).orderBy(desc(certificate.createdAt)).limit(limit);
}
