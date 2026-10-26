import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/tich-hop/suai/hoan-thanh/route";
import { closeDb, db } from "@/lib/db";
import { courseCredit, voucher } from "@/modules/course-integration/schema";
import { claimVoucher, importVouchers, recordManualCredits, revokeCredit, signBridgePayload } from "@/modules/course-integration/service";
import { enrollment } from "@/modules/enrollment/schema";
import { ForbiddenError } from "@/modules/identity/policy";
import { moduleReport, quizAttempt } from "@/modules/learning/schema";
import { quizRequirementsFor, startQuiz, submitReport } from "@/modules/learning/service";
import { eligibilityOf } from "@/modules/project-certificate/service";
import { resetDatabase } from "../../setup/reset";
import { staffActor } from "../identity/helpers";
import { completeModuleLessons, enrolledStudent } from "../learning/helpers";

beforeEach(resetDatabase);
afterAll(closeDb);

const SECRET = process.env.SUAI_BRIDGE_SECRET!;

function completionRequest(payload: object, options: { secret?: string; timestamp?: number } = {}) {
  const body = JSON.stringify(payload);
  const timestamp = String(options.timestamp ?? Math.floor(Date.now() / 1000));
  return new Request("http://localhost/api/tich-hop/suai/hoan-thanh", {
    method: "POST",
    body,
    headers: { "content-type": "application/json", "x-aict-timestamp": timestamp, "x-aict-signature": signBridgePayload(options.secret ?? SECRET, timestamp, body) },
  });
}

const event = (overrides: object = {}) => ({ event: "course_completed", eventId: "evt-1", email: "SV@example.com", courseId: 3584, ...overrides });

describe("API suai.vn báo hoàn thành khóa", () => {
  it("chữ ký sai hoặc quá hạn → 401, không ghi gì", async () => {
    expect((await POST(completionRequest(event(), { secret: "x".repeat(40) }))).status).toBe(401);
    expect((await POST(completionRequest(event(), { timestamp: Math.floor(Date.now() / 1000) - 600 }))).status).toBe(401);
    expect(await db.select().from(courseCredit)).toEqual([]);
  });

  it("ghi theo email chữ thường; gửi lại cùng eventId không ghi trùng; khóa khác bị bỏ qua", async () => {
    const first = await POST(completionRequest(event()));
    expect(await first.json()).toEqual({ status: "recorded" });
    expect(await (await POST(completionRequest(event()))).json()).toEqual({ status: "duplicate" });
    expect(await (await POST(completionRequest(event({ eventId: "evt-2", courseId: "3709" })))).json()).toEqual({ status: "ignored_course" });
    const rows = await db.select().from(courseCredit);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: "sv@example.com", source: "tutor", modules: ["M1", "M2", "M3"] });
  });

  it("payload sai → 400", async () => {
    expect((await POST(completionRequest({ event: "course_completed", email: "khong-phai-email" }))).status).toBe(400);
  });
});

describe("Miễn trắc nghiệm", () => {
  it("SV học N1 trước khi đăng ký portal: miễn M2, M3 (khối A); M1 còn bài an toàn dữ liệu", async () => {
    await POST(completionRequest(event()));
    const sv = await enrolledStudent();
    const quizzes = await quizRequirementsFor(sv.enrollment);
    expect(quizzes.M1).toMatchObject({ quizId: "M1-SAFE", exempt: true });
    expect(quizzes.M2).toMatchObject({ quizId: null, exempt: true });
    expect(quizzes.M3).toMatchObject({ quizId: null, exempt: true });
    const quiz = await startQuiz(sv.actor, "M1");
    expect(quiz.questions).toHaveLength(4);
    await completeModuleLessons(sv.actor, [1, 2, 3]);
    await submitReport(sv.actor, "M1", { learned: "a", products: "b", aiMistakes: "c", hours: "3", difficulties: "" });
    await expect(startQuiz(sv.actor, "M2")).rejects.toThrow(/miễn/);
  });

  it("khối C vẫn phải làm M3", async () => {
    await POST(completionRequest(event()));
    const sv = await enrolledStudent("sv@example.com", "C");
    expect((await quizRequirementsFor(sv.enrollment)).M3).toMatchObject({ quizId: "M3-C", exempt: false });
  });

  it("TA xác nhận tay theo module; thu hồi thì mất miễn; điều kiện chứng nhận tính miễn là đạt", async () => {
    const ta = await staffActor("ta@example.com", "ta");
    const sv = await enrolledStudent();
    await expect(recordManualCredits(ta, { emails: "sv@example.com\nkhong-hop-le", modules: ["M2"], note: "" })).rejects.toThrow(/không hợp lệ/);
    expect(await recordManualCredits(ta, { emails: "SV@example.com", modules: ["M2"], note: "Lớp tối thứ 3" })).toBe(1);
    expect((await quizRequirementsFor(sv.enrollment)).M2.exempt).toBe(true);
    expect((await quizRequirementsFor(sv.enrollment)).M1.exempt).toBe(false);

    await db.update(moduleReport).set({ status: "passed" }).where(eq(moduleReport.enrollmentId, sv.enrollment.id));
    for (const quizId of ["M1", "M3-AB"]) await db.insert(quizAttempt).values({ enrollmentId: sv.enrollment.id, quizId, questionIds: [], passed: true, submittedAt: new Date() });
    const check = (await eligibilityOf(sv.enrollment)).checks.find((c) => c.label.startsWith("Đạt trắc nghiệm"))!;
    expect(check.ok).toBe(true);

    const [credit] = await db.select().from(courseCredit);
    await revokeCredit(ta, credit!.id, "Nhầm email");
    expect((await quizRequirementsFor(sv.enrollment)).M2.exempt).toBe(false);
  });

  it("SV và giáo viên không xác nhận được", async () => {
    const sv = await enrolledStudent();
    await expect(recordManualCredits(sv.actor, { emails: "sv@example.com", modules: ["M1"], note: "" })).rejects.toThrow(ForbiddenError);
  });
});

describe("Mã ưu đãi", () => {
  it("admin nhập mã, bỏ trùng; SV nhận 1 mã/loại; suất miễn phí chỉ cho SV workshop; hết mã thì báo", async () => {
    const admin = await staffActor("admin@example.com", "admin");
    expect(await importVouchers(admin, "discount", "GIAM-1\nGIAM-1\nGIAM-2")).toEqual({ added: 2, skipped: 0 });
    expect(await importVouchers(admin, "discount", "GIAM-2")).toEqual({ added: 0, skipped: 1 });
    const mentor = await staffActor("mentor@example.com", "mentor");
    await expect(importVouchers(mentor, "discount", "X")).rejects.toThrow(ForbiddenError);

    const sv = await enrolledStudent();
    const open = { hasOpenEnrollment: true, fromWorkshop: false };
    const code = await claimVoucher(sv.actor, "discount", open);
    expect(await claimVoucher(sv.actor, "discount", open)).toBe(code);
    await expect(claimVoucher(sv.actor, "free_seat", open)).rejects.toThrow(/workshop/);

    const sv2 = await enrolledStudent("sv2@example.com");
    const other = await claimVoucher(sv2.actor, "discount", open);
    expect(other).not.toBe(code);
    const sv3 = await enrolledStudent("sv3@example.com");
    await expect(claimVoucher(sv3.actor, "discount", open)).rejects.toThrow(/hết mã/);
    expect((await db.select().from(voucher)).every((v) => v.claimedBy)).toBe(true);
  });

  it("chưa đăng ký lộ trình thì không nhận mã", async () => {
    const sv = await enrolledStudent();
    await db.update(enrollment).set({ status: "completed" });
    await expect(claimVoucher(sv.actor, "discount", { hasOpenEnrollment: false, fromWorkshop: false })).rejects.toThrow(/lộ trình/);
  });
});
