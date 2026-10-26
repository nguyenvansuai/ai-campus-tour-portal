import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { ForbiddenError } from "@/modules/identity/policy";
import { lessonProgress, moduleReport } from "@/modules/learning/schema";
import { getProgress, submitReport } from "@/modules/learning/service";
import { getReportForReview, precheckReport, reviewHistory, reviewQueue, reviewReport, spotCheckLesson } from "@/modules/review/service";
import { resetDatabase } from "../../setup/reset";
import { staffActor } from "../identity/helpers";
import { completeModuleLessons, enrolledStudent } from "../learning/helpers";

beforeEach(resetDatabase);
afterAll(closeDb);

const reportFields = { learned: "Buổi 1–3", products: "Link", aiMistakes: "AI sai số liệu", hours: "3", difficulties: "" };

async function setup() {
  const mentor = await staffActor("mentor@example.com", "mentor");
  const ta = await staffActor("ta@example.com", "ta");
  const sv = await enrolledStudent();
  await completeModuleLessons(sv.actor, [1, 2, 3]);
  await submitReport(sv.actor, "M1", reportFields);
  const [report] = await db.select().from(moduleReport);
  return { mentor, ta, sv, report: report! };
}

describe("Hàng đợi chấm", () => {
  it("mentor thấy bài được phân công, sắp theo hạn; mentor khác không thấy", async () => {
    const { mentor, report } = await setup();
    const queue = await reviewQueue(mentor, { mine: true });
    expect(queue.map((q) => q.id)).toEqual([report.id]);
    expect(queue[0]).toMatchObject({ moduleId: "M1", studentName: "Sinh Viên Thử", overdue: false });
    const other = await staffActor("mentor2@example.com", "mentor");
    expect(await reviewQueue(other, { mine: true })).toEqual([]);
  });

  it("bài quá hạn phản hồi được đánh dấu", async () => {
    const { mentor } = await setup();
    await db.update(moduleReport).set({ reviewDueAt: new Date(Date.now() - 1000) });
    expect((await reviewQueue(mentor, { mine: true }))[0]?.overdue).toBe(true);
  });
});

describe("Kiểm hồ sơ và chấm", () => {
  it("TA trả lại hồ sơ thiếu → SV nộp lại được; TA không chấm chính thức được", async () => {
    const { ta, sv, report } = await setup();
    await precheckReport(ta, report.id, { ok: false, comment: "Link chưa mở được." });
    expect((await db.select().from(moduleReport))[0]?.status).toBe("returned");
    await expect(reviewReport(ta, report.id, { criteriaMet: [true, true, true, true, true], comment: "" })).rejects.toThrow(ForbiddenError);
    await submitReport(sv.actor, "M1", reportFields);
    expect((await db.select().from(moduleReport))[0]).toMatchObject({ status: "submitted", version: 2 });
  });

  it("mentor tick đủ tiêu chí → Đạt", async () => {
    const { mentor, report } = await setup();
    const detail = await getReportForReview(mentor, report.id);
    expect(detail.criteria).toHaveLength(5);
    expect(detail.lessons.map((l) => l.lessonNumber)).toEqual([1, 2, 3]);
    await reviewReport(mentor, report.id, { criteriaMet: [true, true, true, true, true], comment: "Tốt" });
    expect((await db.select().from(moduleReport))[0]?.status).toBe("passed");
  });

  it("thiếu tiêu chí → Cần sửa, bắt buộc nhận xét; SV thấy tiêu chí chưa đạt", async () => {
    const { mentor, report } = await setup();
    await expect(reviewReport(mentor, report.id, { criteriaMet: [true, false, true, true, true], comment: "" })).rejects.toThrow(/nhận xét/);
    await reviewReport(mentor, report.id, { criteriaMet: [true, false, true, true, true], comment: "Bổ sung bản Sau." });
    expect((await db.select().from(moduleReport))[0]?.status).toBe("needs_revision");
    const history = await reviewHistory(report.id);
    expect(history[0]).toMatchObject({ label: "Mentor: Cần sửa", comment: "Bổ sung bản Sau." });
    expect(history[0]?.unmet[0]).toMatch(/Trước\/Sau/);
  });

  it("không chấm bài đã Đạt; mentor không được phân công không chấm được", async () => {
    const { mentor, report } = await setup();
    const other = await staffActor("mentor2@example.com", "mentor");
    await expect(reviewReport(other, report.id, { criteriaMet: [true, true, true, true, true], comment: "" })).rejects.toThrow(ForbiddenError);
    await reviewReport(mentor, report.id, { criteriaMet: [true, true, true, true, true], comment: "" });
    await expect(reviewReport(mentor, report.id, { criteriaMet: [true, true, true, true, true], comment: "" })).rejects.toThrow(/đã chấm/);
  });
});

describe("Kiểm ngẫu nhiên minh chứng", () => {
  it("TA đánh dấu không hợp lệ → buổi bị bỏ tích", async () => {
    const { ta, sv } = await setup();
    const [lesson] = await db.select().from(lessonProgress).where(eq(lessonProgress.lessonNumber, 2));
    await spotCheckLesson(ta, lesson!.id, { ok: false, note: "Minh chứng trùng với SV khác." });
    expect((await getProgress(sv.enrollment.id)).completedLessons.has(2)).toBe(false);
  });
});
