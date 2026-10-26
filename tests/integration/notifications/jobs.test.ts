import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { memoryOutbox } from "@/lib/email";
import { enrollment } from "@/modules/enrollment/schema";
import { scheduleOf } from "@/modules/enrollment/service";
import { moduleReport } from "@/modules/learning/schema";
import { submitReport } from "@/modules/learning/service";
import { reviewReport } from "@/modules/review/service";
import { runJobs } from "@/modules/notifications/service";
import { resetDatabase } from "../../setup/reset";
import { staffActor } from "../identity/helpers";
import { completeModuleLessons, enrolledStudent } from "../learning/helpers";

beforeEach(resetDatabase);
afterAll(closeDb);

const DAY = 86_400_000;
const mailsTo = (email: string, subject: RegExp) => memoryOutbox.filter((m) => m.to === email && subject.test(m.subject));

describe("Nhắc nhở theo lịch", () => {
  it("nhắc trước hạn 24 giờ, đúng 1 lần dù chạy nhiều lần", async () => {
    const { enrollment: row } = await enrolledStudent();
    const deadline = scheduleOf(row).deadlines.M1;
    const at = new Date(deadline.getTime() - 3 * 3_600_000);
    await runJobs(at);
    await runJobs(at);
    expect(mailsTo("sv@example.com", /24 giờ để nộp báo cáo M1/)).toHaveLength(1);
    expect(mailsTo("sv@example.com", /24 giờ/)[0]?.text).toContain("/hoc/bao-cao/M1");
  });

  it("báo trễ hạn khi quá hạn mà chưa nộp", async () => {
    const { enrollment: row } = await enrolledStudent();
    await runJobs(new Date(scheduleOf(row).deadlines.M1.getTime() + 3_600_000));
    expect(mailsTo("sv@example.com", /trễ hạn báo cáo M1/)).toHaveLength(1);
  });

  it("đã nộp báo cáo thì không nhắc", async () => {
    const { actor, enrollment: row } = await enrolledStudent();
    await completeModuleLessons(actor, [1, 2, 3]);
    await submitReport(actor, "M1", { learned: "x", products: "x", aiMistakes: "x", hours: "3", difficulties: "" });
    await runJobs(new Date(scheduleOf(row).deadlines.M1.getTime() - 3_600_000));
    expect(mailsTo("sv@example.com", /báo cáo M1/)).toHaveLength(0);
  });

  it("7 ngày không hoạt động nhắc SV; 14 ngày báo TA; 21 ngày chuyển tạm dừng", async () => {
    await staffActor("ta@example.com", "ta");
    const { enrollment: row } = await enrolledStudent();
    await db.update(enrollment).set({ lastActivityAt: new Date(Date.now() - 8 * DAY) }).where(eq(enrollment.id, row.id));
    await runJobs();
    expect(mailsTo("sv@example.com", /7 ngày/)).toHaveLength(1);
    expect(mailsTo("ta@example.com", /không hoạt động/)).toHaveLength(0);

    await db.update(enrollment).set({ lastActivityAt: new Date(Date.now() - 15 * DAY) }).where(eq(enrollment.id, row.id));
    await runJobs();
    expect(mailsTo("ta@example.com", /không hoạt động/)).toHaveLength(1);

    await db.update(enrollment).set({ lastActivityAt: new Date(Date.now() - 22 * DAY) }).where(eq(enrollment.id, row.id));
    await runJobs();
    expect((await db.select().from(enrollment).where(eq(enrollment.id, row.id)))[0]?.status).toBe("inactive");
  });

  it("quá hạn cứng ngày 60 thì chuyển chưa hoàn thành", async () => {
    const { enrollment: row } = await enrolledStudent();
    await runJobs(new Date(scheduleOf(row).hardDeadline.getTime() + 1000));
    expect((await db.select().from(enrollment).where(eq(enrollment.id, row.id)))[0]?.status).toBe("failed");
  });
});

describe("Thông báo chấm bài", () => {
  it("báo SV kết quả chấm; báo mentor bài quá hạn phản hồi", async () => {
    const mentor = await staffActor("mentor@example.com", "mentor");
    const { actor } = await enrolledStudent();
    await completeModuleLessons(actor, [1, 2, 3]);
    await submitReport(actor, "M1", { learned: "x", products: "x", aiMistakes: "x", hours: "3", difficulties: "" });

    await db.update(moduleReport).set({ reviewDueAt: new Date(Date.now() - 1000) });
    await runJobs();
    expect(mailsTo("mentor@example.com", /quá hạn phản hồi/)).toHaveLength(1);

    const [report] = await db.select().from(moduleReport);
    await reviewReport(mentor, report!.id, { criteriaMet: [true, true, true, true, true], comment: "" });
    await runJobs();
    await runJobs();
    expect(mailsTo("sv@example.com", /M1 đã Đạt/)).toHaveLength(1);
  });
});
