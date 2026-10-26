import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, storage } from "@/lib/storage";
import { findQuiz } from "@/modules/curriculum/content/quizzes";
import { LESSONS, lessonByNumber, lessonContentFor, MIN_DAYS_BEFORE_FINAL, MODULES, moduleOf, quizIdFor, REPORT_FIELDS } from "@/modules/curriculum/content/program";
import type { ModuleId, QuizBank, Track } from "@/modules/curriculum/types";
import { vnDateOf, type ReportModuleId } from "@/modules/enrollment/schedule";
import { enrollment } from "@/modules/enrollment/schema";
import { getOpenEnrollment, scheduleOf, studentResource, touchActivity, type EnrollmentRow } from "@/modules/enrollment/service";
import { authorize, type Actor } from "@/modules/identity/policy";
import { user } from "@/modules/identity/schema";
import { school } from "@/modules/org/schema";
import { lessonProgress, moduleReport, moduleReportVersion, quizAttempt, storedFile, type EvidenceValue } from "./schema";

export class LearningError extends Error {}

const REVIEW_SLA_DAYS = 3;
const QUIZ_COOLDOWN_MINUTES = 30;
const QUIZ_MAX_PER_DAY = 3;
const REPORT_MODULES: ReportModuleId[] = ["M1", "M2", "M3", "M4"];

// ---------------------------------------------------------------------------
// Tiến độ và mở khóa module

export async function getProgress(enrollmentId: string) {
  const [lessons, reports, attempts] = await Promise.all([
    db.select().from(lessonProgress).where(eq(lessonProgress.enrollmentId, enrollmentId)),
    db.select().from(moduleReport).where(eq(moduleReport.enrollmentId, enrollmentId)),
    db.select().from(quizAttempt).where(eq(quizAttempt.enrollmentId, enrollmentId)).orderBy(desc(quizAttempt.startedAt)),
  ]);
  const [row] = await db.select().from(enrollment).where(eq(enrollment.id, enrollmentId));
  const completedLessons = new Set(lessons.filter((l) => l.spotCheckOk !== false).map((l) => l.lessonNumber));
  const reportByModule = new Map(reports.map((r) => [r.moduleId, r]));
  const passedQuizzes = new Set(attempts.filter((a) => a.passed).map((a) => a.quizId));

  // M1 mở ngay; module sau mở khi đã nộp báo cáo module trước. M5 cần nộp báo cáo M4 và đủ số ngày học tối thiểu.
  const unlocked: Record<ModuleId, boolean> = { M0: true, M1: true, M2: false, M3: false, M4: false, M5: false };
  unlocked.M2 = reportByModule.has("M1");
  unlocked.M3 = reportByModule.has("M2");
  unlocked.M4 = reportByModule.has("M3");
  const dayNumber = row ? scheduleOf(row).dayNumber : 0;
  unlocked.M5 = reportByModule.has("M4") && dayNumber >= MIN_DAYS_BEFORE_FINAL;

  return { lessons, completedLessons, reports: reportByModule, attempts, passedQuizzes, unlocked };
}

export type Progress = Awaited<ReturnType<typeof getProgress>>;

async function requireOpenEnrollmentFor(actor: Actor) {
  const row = await getOpenEnrollment(actor.userId);
  if (!row) throw new LearningError("Bạn chưa bắt đầu lộ trình.");
  authorize(actor, "submission.create", studentResource(row, "submission"));
  return row;
}

// ---------------------------------------------------------------------------
// Minh chứng buổi học

export type LessonSubmission = {
  lessonNumber: number;
  values: Record<string, string>;
  files: Record<string, File | undefined>;
  reflectionMistake: string;
  reflectionVerify: string;
  sourceCodes: string[];
};

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function folderPathFor(row: EnrollmentRow, moduleId: string) {
  const [info] = await db
    .select({ schoolName: school.name, name: user.name, email: user.email })
    .from(enrollment)
    .innerJoin(school, eq(school.id, enrollment.schoolId))
    .innerJoin(user, eq(user.id, enrollment.userId))
    .where(eq(enrollment.id, row.id));
  const who = [row.studentCode, info?.name || info?.email].filter(Boolean).join(" – ");
  return [info?.schoolName ?? "Chưa rõ trường", who || row.userId, moduleId];
}

export async function completeLesson(actor: Actor, submission: LessonSubmission) {
  const row = await requireOpenEnrollmentFor(actor);
  const lesson = lessonByNumber(submission.lessonNumber);
  if (!lesson) throw new LearningError("Buổi học không tồn tại.");
  const moduleId = lesson.moduleId;
  const progress = await getProgress(row.id);
  if (!progress.unlocked[moduleId]) throw new LearningError("Module này chưa mở. Hãy nộp báo cáo module trước.");
  if (progress.reports.get(moduleId as ReportModuleId)?.status === "passed") {
    throw new LearningError("Báo cáo module này đã Đạt, không sửa minh chứng nữa.");
  }

  const content = lessonContentFor(lesson, row.track as Track);
  if (submission.reflectionMistake.trim().length < 10) throw new LearningError('Vui lòng ghi rõ "AI đã sai hoặc thiếu ở đâu" (ít nhất 10 ký tự).');
  if (submission.reflectionVerify.trim().length < 10) throw new LearningError('Vui lòng ghi rõ "Bạn kiểm chứng/sửa thế nào" (ít nhất 10 ký tự).');

  const evidence: Record<string, EvidenceValue> = {};
  const uploads: { key: string; file: File }[] = [];
  for (const field of content.evidence) {
    if (field.type === "file") {
      const file = submission.files[field.key];
      if (!file || file.size === 0) throw new LearningError(`Vui lòng tải lên: ${field.label}.`);
      if (!ALLOWED_UPLOAD_TYPES.test(file.type)) throw new LearningError(`${field.label}: chỉ nhận ảnh hoặc PDF.`);
      if (file.size > MAX_UPLOAD_BYTES) throw new LearningError(`${field.label}: file tối đa 10 MB.`);
      uploads.push({ key: field.key, file });
      continue;
    }
    const value = (submission.values[field.key] ?? "").trim();
    if (!value) throw new LearningError(`Vui lòng điền: ${field.label}.`);
    if (field.type === "link" && !isHttpUrl(value)) throw new LearningError(`${field.label}: vui lòng dán đường link bắt đầu bằng https://`);
    if (field.type === "number") {
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0) throw new LearningError(`${field.label}: vui lòng nhập số.`);
      evidence[field.key] = number;
      continue;
    }
    if ((field.type === "text" || field.type === "textarea") && field.minLength && value.length < field.minLength) {
      throw new LearningError(`${field.label}: cần viết ít nhất ${field.minLength} ký tự.`);
    }
    evidence[field.key] = value;
  }

  const folder = uploads.length ? await folderPathFor(row, moduleId) : [];
  for (const { key, file } of uploads) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const name = `Buoi${lesson.number}_${key}_${file.name}`.replace(/[\\/]/g, "_");
    const stored = await storage().put({ name, type: file.type, bytes }, folder);
    const [record] = await db
      .insert(storedFile)
      .values({ enrollmentId: row.id, uploadedBy: actor.userId, driver: stored.driver, externalId: stored.externalId, name: file.name, mimeType: file.type, size: file.size })
      .returning({ id: storedFile.id });
    evidence[key] = { fileId: record!.id, name: file.name, type: file.type, size: file.size };
  }

  const values = {
    evidence,
    reflectionMistake: submission.reflectionMistake.trim(),
    reflectionVerify: submission.reflectionVerify.trim(),
    sourceCodes: submission.sourceCodes,
  };
  await db
    .insert(lessonProgress)
    .values({ enrollmentId: row.id, lessonNumber: lesson.number, ...values })
    .onConflictDoUpdate({
      target: [lessonProgress.enrollmentId, lessonProgress.lessonNumber],
      set: { ...values, spotCheckOk: null, spotCheckNote: null, updatedAt: new Date() },
    });
  await touchActivity(row.id);
}

// ---------------------------------------------------------------------------
// Trắc nghiệm

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function quizFor(row: EnrollmentRow, moduleId: ModuleId): QuizBank | null {
  const id = quizIdFor(moduleId, row.track as Track);
  return id ? (findQuiz(id) ?? null) : null;
}

export async function startQuiz(actor: Actor, moduleId: ModuleId) {
  const row = await requireOpenEnrollmentFor(actor);
  const bank = quizFor(row, moduleId);
  if (!bank) throw new LearningError("Module này không có trắc nghiệm.");

  const startOfVnDay = new Date(`${vnDateOf(new Date())}T00:00:00+07:00`);
  const recent = await db
    .select()
    .from(quizAttempt)
    .where(and(eq(quizAttempt.enrollmentId, row.id), eq(quizAttempt.quizId, bank.id), gte(quizAttempt.startedAt, startOfVnDay)))
    .orderBy(desc(quizAttempt.startedAt));
  const last = recent[0];
  if (last?.submittedAt && Date.now() - last.submittedAt.getTime() < QUIZ_COOLDOWN_MINUTES * 60_000) {
    throw new LearningError(`Bạn vừa làm xong. Vui lòng ôn lại và thử lại sau ${QUIZ_COOLDOWN_MINUTES} phút.`);
  }
  if (recent.filter((a) => a.submittedAt).length >= QUIZ_MAX_PER_DAY) {
    throw new LearningError(`Bạn đã làm ${QUIZ_MAX_PER_DAY} lần hôm nay. Vui lòng thử lại vào ngày mai.`);
  }

  const picked = shuffle(bank.questions).slice(0, bank.drawCount);
  const [attempt] = await db
    .insert(quizAttempt)
    .values({ enrollmentId: row.id, quizId: bank.id, questionIds: picked.map((q) => q.id) })
    .returning({ id: quizAttempt.id });
  return {
    attemptId: attempt!.id,
    title: bank.title,
    passPercent: bank.passPercent,
    // Phương án giữ chỉ số gốc để chấm; thứ tự hiển thị được xáo.
    questions: picked.map((q) => ({ id: q.id, question: q.question, options: shuffle(q.options.map((text, index) => ({ index, text }))) })),
  };
}

export async function submitQuiz(actor: Actor, attemptId: string, answers: Record<string, number>) {
  const row = await requireOpenEnrollmentFor(actor);
  const [attempt] = await db.select().from(quizAttempt).where(and(eq(quizAttempt.id, attemptId), eq(quizAttempt.enrollmentId, row.id)));
  if (!attempt) throw new LearningError("Không tìm thấy bài trắc nghiệm.");
  if (attempt.submittedAt) throw new LearningError("Bài này đã nộp.");
  const bank = findQuiz(attempt.quizId as QuizBank["id"])!;
  const questions = attempt.questionIds.map((id) => bank.questions.find((q) => q.id === id)!);
  const correct = questions.filter((q) => answers[q.id] === q.answer).length;
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= bank.passPercent;
  await db.update(quizAttempt).set({ answers, score, passed, submittedAt: new Date() }).where(eq(quizAttempt.id, attempt.id));
  await touchActivity(row.id);
  return {
    score,
    passed,
    correct,
    total: questions.length,
    review: questions.map((q) => ({ id: q.id, question: q.question, chosen: answers[q.id] ?? null, answer: q.answer, options: q.options, explanation: q.explanation })),
  };
}

// ---------------------------------------------------------------------------
// Báo cáo module

function describeEvidence(value: EvidenceValue) {
  if (typeof value === "object") return `[file] ${value.name}`;
  return String(value);
}

/** Bản nháp báo cáo: tự gom minh chứng và phản tư của các buổi trong module. */
export async function buildReportDraft(row: EnrollmentRow, moduleId: ReportModuleId) {
  const programModule = MODULES.find((m) => m.id === moduleId)!;
  const progress = await getProgress(row.id);
  const done = progress.lessons.filter((l) => programModule.lessonNumbers.includes(l.lessonNumber)).sort((a, b) => a.lessonNumber - b.lessonNumber);
  const title = (n: number) => lessonByNumber(n)?.title ?? "";
  return {
    learned: done.map((l) => `Buổi ${l.lessonNumber}: ${title(l.lessonNumber)}${l.sourceCodes.length ? ` (nguồn: ${l.sourceCodes.join(", ")})` : ""}`).join("\n"),
    products: done
      .map((l) => `Buổi ${l.lessonNumber}:\n${Object.values(l.evidence).filter((v) => typeof v === "object" || /^https?:\/\//.test(String(v))).map((v) => `- ${describeEvidence(v)}`).join("\n") || "- (xem minh chứng trên portal)"}`)
      .join("\n"),
    aiMistakes: done.map((l) => `Buổi ${l.lessonNumber}: ${l.reflectionMistake} → ${l.reflectionVerify}`).join("\n"),
    hours: String(Math.round(programModule.lessonNumbers.reduce((sum, n) => sum + (lessonByNumber(n)?.minutes ?? 0), 0) / 60)),
    difficulties: "",
  };
}

export async function submitReport(actor: Actor, moduleId: ReportModuleId, fields: Record<string, string>) {
  if (!REPORT_MODULES.includes(moduleId)) throw new LearningError("Module không có báo cáo.");
  const row = await requireOpenEnrollmentFor(actor);
  const programModule = MODULES.find((m) => m.id === moduleId)!;
  const progress = await getProgress(row.id);
  if (!progress.unlocked[moduleId]) throw new LearningError("Module này chưa mở.");
  const missing = programModule.lessonNumbers.filter((n) => !progress.completedLessons.has(n));
  if (missing.length) throw new LearningError(`Bạn cần hoàn thành đủ các buổi trước khi nộp báo cáo (còn buổi ${missing.join(", ")}).`);

  const clean: Record<string, string> = {};
  for (const field of REPORT_FIELDS) {
    const value = (fields[field.key] ?? "").trim();
    if (!value && field.key !== "difficulties") throw new LearningError(`Vui lòng điền: ${field.label}.`);
    clean[field.key] = value.slice(0, 5000);
  }

  const now = new Date();
  const late = now > scheduleOf(row, now).deadlines[moduleId];
  const reviewDueAt = new Date(now.getTime() + REVIEW_SLA_DAYS * 86_400_000);
  const existing = progress.reports.get(moduleId);

  if (!existing) {
    await db.insert(moduleReport).values({ enrollmentId: row.id, moduleId, fields: clean, submittedAt: now, reviewDueAt, late });
  } else {
    if (existing.status === "passed") throw new LearningError("Báo cáo đã Đạt.");
    if (existing.status === "submitted" || existing.status === "prechecked") throw new LearningError("Báo cáo đang chờ chấm, chưa nộp lại được.");
    await db.transaction(async (tx) => {
      await tx.insert(moduleReportVersion).values({ reportId: existing.id, version: existing.version, fields: existing.fields, submittedAt: existing.submittedAt });
      await tx
        .update(moduleReport)
        .set({ fields: clean, version: existing.version + 1, status: "submitted", submittedAt: now, reviewDueAt, late })
        .where(eq(moduleReport.id, existing.id));
    });
  }
  await recordAudit({ actorId: actor.userId, action: "report.submitted", targetType: "module_report", targetId: row.id, metadata: { moduleId, version: (existing?.version ?? 0) + 1 } });
  await touchActivity(row.id);
}

// ---------------------------------------------------------------------------
// File minh chứng

export async function readFileForViewer(actor: Actor, fileId: string) {
  const [file] = await db.select().from(storedFile).where(eq(storedFile.id, fileId));
  if (!file) throw new LearningError("Không tìm thấy file.");
  const [row] = await db.select().from(enrollment).where(eq(enrollment.id, file.enrollmentId));
  authorize(actor, "submission.view", studentResource(row!, "submission"));
  return { name: file.name, type: file.mimeType, bytes: await storage().get(file.externalId) };
}

/** Tổng hợp cho trang /hoc. */
export async function dashboardFor(row: EnrollmentRow) {
  const progress = await getProgress(row.id);
  const schedule = scheduleOf(row);
  const nextLesson = LESSONS.find((l) => progress.unlocked[l.moduleId] && !progress.completedLessons.has(l.number)) ?? null;
  const pendingReport =
    REPORT_MODULES.find((m) => {
      const programModule = MODULES.find((x) => x.id === m)!;
      return progress.unlocked[m] && !progress.reports.has(m) && programModule.lessonNumbers.every((n) => progress.completedLessons.has(n));
    }) ?? null;
  return { progress, schedule, nextLesson, pendingReport, moduleOfLesson: moduleOf };
}

export async function reportsNeedingAction(enrollmentIds: string[]) {
  if (!enrollmentIds.length) return [];
  return db.select().from(moduleReport).where(inArray(moduleReport.enrollmentId, enrollmentIds));
}
