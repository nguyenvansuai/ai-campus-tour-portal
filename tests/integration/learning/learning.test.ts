import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { enrollment } from "@/modules/enrollment/schema";
import { ForbiddenError } from "@/modules/identity/policy";
import { lessonProgress, moduleReport, moduleReportVersion, quizAttempt, storedFile } from "@/modules/learning/schema";
import {
  buildReportDraft,
  completeLesson,
  getProgress,
  readFileForViewer,
  startQuiz,
  submitQuiz,
  submitReport,
} from "@/modules/learning/service";
import { QUIZZES } from "@/modules/curriculum/content/quizzes";
import { resetDatabase } from "../../setup/reset";
import { staffActor } from "../identity/helpers";
import { completeModuleLessons, enrolledStudent, validSubmission } from "./helpers";

beforeEach(resetDatabase);
afterAll(closeDb);

const reportFields = { learned: "Học buổi 1–3", products: "Các link đã nộp", aiMistakes: "AI sai số liệu", hours: "3", difficulties: "Không" };

describe("Hoàn thành buổi học", () => {
  it("minh chứng hợp lệ thì hoàn thành, lưu file, cập nhật hoạt động", async () => {
    const { actor, enrollment: row } = await enrolledStudent();
    await db.update(enrollment).set({ lastActivityAt: new Date("2026-01-01") }).where(eq(enrollment.id, row.id));
    await completeLesson(actor, validSubmission(3));
    const progress = await getProgress(row.id);
    expect(progress.completedLessons.has(3)).toBe(true);
    expect(await db.select().from(storedFile)).toHaveLength(1);
    const [after] = await db.select().from(enrollment).where(eq(enrollment.id, row.id));
    expect(after!.lastActivityAt.getFullYear()).toBeGreaterThan(2026 - 1);
    expect(after!.lastActivityAt > new Date("2026-01-02")).toBe(true);
  });

  it("thiếu trường, link sai, file sai định dạng hoặc quá lớn thì báo lỗi tiếng Việt", async () => {
    const { actor } = await enrolledStudent();
    const base = validSubmission(1);
    await expect(completeLesson(actor, { ...base, values: { ...base.values, tasks: "ngắn" } })).rejects.toThrow(/ít nhất/);
    await completeModuleLessons(actor, [1, 2, 3]);
    await submitReport(actor, "M1", reportFields);
    const l4 = validSubmission(4);
    await expect(completeLesson(actor, { ...l4, values: { ...l4.values, sheet: "khong-phai-link" } })).rejects.toThrow(/link/);
    const l3 = validSubmission(3);
    await expect(completeLesson(actor, { ...l3, files: { instruction: new File(["x"], "a.exe", { type: "application/x-msdownload" }) } })).rejects.toThrow(/ảnh hoặc PDF/);
    await expect(
      completeLesson(actor, { ...l3, files: { instruction: new File([new Uint8Array(11 * 1024 * 1024)], "to.png", { type: "image/png" }) } }),
    ).rejects.toThrow(/10 MB/);
    await expect(completeLesson(actor, { ...base, reflectionMistake: "" })).rejects.toThrow(/AI đã sai/);
  });

  it("chưa mở module thì không nộp được buổi của module đó", async () => {
    const { actor } = await enrolledStudent();
    await expect(completeLesson(actor, validSubmission(4))).rejects.toThrow(/chưa mở/);
  });

  it("nộp lại buổi đã hoàn thành thì cập nhật, không tạo dòng mới", async () => {
    const { actor } = await enrolledStudent();
    await completeLesson(actor, validSubmission(1));
    await completeLesson(actor, validSubmission(1));
    expect(await db.select().from(lessonProgress)).toHaveLength(1);
  });

  it("buổi 7–9 dùng minh chứng theo khối ngành", async () => {
    const { actor } = await enrolledStudent("c@example.com", "C");
    await completeModuleLessons(actor, [1, 2, 3], "C");
    await submitReport(actor, "M1", reportFields);
    await completeModuleLessons(actor, [4, 5, 6], "C");
    await submitReport(actor, "M2", reportFields);
    await completeLesson(actor, validSubmission(8, "C"));
    const [row] = await db.select().from(lessonProgress).where(eq(lessonProgress.lessonNumber, 8));
    expect(Object.keys(row!.evidence)).toContain("repo");
  });
});

describe("Báo cáo module và mở khóa", () => {
  it("chưa xong đủ buổi thì chưa nộp được báo cáo", async () => {
    const { actor } = await enrolledStudent();
    await completeModuleLessons(actor, [1, 2]);
    await expect(submitReport(actor, "M1", reportFields)).rejects.toThrow(/hoàn thành đủ/);
  });

  it("nộp báo cáo M1 thì mở M2 (không chờ chấm); có hạn phản hồi 3 ngày", async () => {
    const { actor, enrollment: row } = await enrolledStudent();
    await completeModuleLessons(actor, [1, 2, 3]);
    const draft = await buildReportDraft(row, "M1");
    expect(draft.products).toContain("Buổi 1");
    await submitReport(actor, "M1", reportFields);
    const progress = await getProgress(row.id);
    expect(progress.unlocked.M2).toBe(true);
    const [report] = await db.select().from(moduleReport);
    const days = (report!.reviewDueAt.getTime() - report!.submittedAt.getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(3);
    await completeLesson(actor, validSubmission(4));
  });

  it("đang chờ chấm thì không nộp lại; bị yêu cầu sửa thì nộp lại tạo phiên bản mới", async () => {
    const { actor } = await enrolledStudent();
    await completeModuleLessons(actor, [1, 2, 3]);
    await submitReport(actor, "M1", reportFields);
    await expect(submitReport(actor, "M1", reportFields)).rejects.toThrow(/đang chờ/);
    await db.update(moduleReport).set({ status: "needs_revision" });
    await submitReport(actor, "M1", { ...reportFields, aiMistakes: "Đã sửa theo góp ý" });
    const [report] = await db.select().from(moduleReport);
    expect(report).toMatchObject({ version: 2, status: "submitted" });
    expect(await db.select().from(moduleReportVersion)).toHaveLength(1);
  });

  it("M5 (dự án cuối) chỉ mở khi đã nộp báo cáo M4 và học ít nhất 14 ngày", async () => {
    const { enrollment: row } = await enrolledStudent();
    const progress = await getProgress(row.id);
    expect(progress.unlocked.M5).toBe(false);
  });
});

describe("Trắc nghiệm", () => {
  it("rút đúng số câu, chấm đúng, đạt từ 80%", async () => {
    const { actor } = await enrolledStudent();
    const attempt = await startQuiz(actor, "M1");
    const bank = QUIZZES.find((q) => q.id === "M1")!;
    expect(attempt.questions).toHaveLength(bank.drawCount);
    const answers = Object.fromEntries(attempt.questions.map((q) => [q.id, bank.questions.find((b) => b.id === q.id)!.answer]));
    const result = await submitQuiz(actor, attempt.attemptId, answers);
    expect(result).toMatchObject({ score: 100, passed: true });
  });

  it("làm lại phải chờ 30 phút, tối đa 3 lần/ngày", async () => {
    const { actor } = await enrolledStudent();
    const first = await startQuiz(actor, "M1");
    await submitQuiz(actor, first.attemptId, {});
    await expect(startQuiz(actor, "M1")).rejects.toThrow(/30 phút/);
    await db.update(quizAttempt).set({ submittedAt: new Date(Date.now() - 31 * 60_000), startedAt: new Date(Date.now() - 32 * 60_000) });
    const second = await startQuiz(actor, "M1");
    await submitQuiz(actor, second.attemptId, {});
    await db.update(quizAttempt).set({ submittedAt: new Date(Date.now() - 31 * 60_000) });
    const third = await startQuiz(actor, "M1");
    await submitQuiz(actor, third.attemptId, {});
    await db.update(quizAttempt).set({ submittedAt: new Date(Date.now() - 31 * 60_000) });
    await expect(startQuiz(actor, "M1")).rejects.toThrow(/3 lần/);
  });

  it("không nộp được bài trắc nghiệm của người khác", async () => {
    const a = await enrolledStudent("a@example.com");
    const b = await enrolledStudent("b@example.com");
    const attempt = await startQuiz(a.actor, "M1");
    await expect(submitQuiz(b.actor, attempt.attemptId, {})).rejects.toThrow();
  });
});

describe("Xem file minh chứng", () => {
  it("SV xem file của mình; mentor được phân công xem được; mentor khác không xem được", async () => {
    const mentor = await staffActor("mentor@example.com", "mentor");
    const { actor } = await enrolledStudent();
    await completeLesson(actor, validSubmission(3));
    const [file] = await db.select().from(storedFile);
    expect((await readFileForViewer(actor, file!.id)).bytes.length).toBeGreaterThan(0);
    expect((await readFileForViewer(mentor, file!.id)).name).toBe("anh.png");

    const other = await staffActor("mentor2@example.com", "mentor");
    await expect(readFileForViewer(other, file!.id)).rejects.toThrow(ForbiddenError);
  });
});
