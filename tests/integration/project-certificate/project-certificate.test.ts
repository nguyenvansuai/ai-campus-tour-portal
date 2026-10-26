import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { memoryOutbox } from "@/lib/email";
import { enrollment } from "@/modules/enrollment/schema";
import { loadActor } from "@/modules/identity/actor";
import { ForbiddenError } from "@/modules/identity/policy";
import { inviteStaff } from "@/modules/identity/service";
import { moduleReport, quizAttempt } from "@/modules/learning/schema";
import { submitReport } from "@/modules/learning/service";
import { updateStatuses } from "@/modules/notifications/service";
import { school } from "@/modules/org/schema";
import { certificate, finalProject } from "@/modules/project-certificate/schema";
import {
  approvalQueue,
  approveCertificates,
  eligibilityOf,
  finalOverviewFor,
  finalQueue,
  getProjectForScoring,
  revokeCertificate,
  scoreFinalProject,
  submitFinalProject,
  verifyCertificate,
} from "@/modules/project-certificate/service";
import { resetDatabase } from "../../setup/reset";
import { signIn, staffActor, superAdminActor } from "../identity/helpers";
import { completeModuleLessons, enrolledStudent } from "../learning/helpers";

beforeEach(resetDatabase);
afterAll(closeDb);

const reportFields = { learned: "Các buổi trong module", products: "https://example.com/sp", aiMistakes: "AI sai số liệu", hours: "3", difficulties: "" };

const finalFields = {
  title: "Tự động tổng hợp công nợ hằng tuần",
  problem: "Kế toán công nợ mất 90 phút mỗi tuần để gom số liệu từ 3 file Excel và hay sót khách hàng.",
  users: "Nhân viên kế toán công nợ",
  solution: "Dùng ChatGPT viết công thức Power Query gom 3 file, sau đó Copilot tóm tắt khách nợ quá hạn và soạn email nhắc nợ.",
  beforeAfter: "90 phút → 20 phút mỗi tuần",
  verification: "Đối chiếu tổng nợ với sổ cái 3 tuần liên tiếp, che tên khách hàng trước khi đưa vào AI.",
  projectUrl: "https://example.com/du-an",
  shareUrl: "https://facebook.com/post/1",
  applicationProof: "Công ty ABC, vị trí Kế toán công nợ, nộp ngày 20/10 qua TopCV.",
};
const selfAssessment = { delegate: 4, verify: 4, office: 4, jobHunt: 4, automation: 3 };
const pdf = () => new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 1, 2])], "du-an.pdf", { type: "application/pdf" });
const rubric = (total: number) => {
  // Chia điểm theo tỉ lệ thang 30/30/20/20.
  const a = Math.min(30, Math.round(total * 0.3));
  const b = Math.min(30, Math.round(total * 0.3));
  const c = Math.min(20, Math.round(total * 0.2));
  return { realProblem: a, working: b, verification: c, presentation: total - a - b - c };
};

/** SV đã học xong 12 buổi, nộp đủ 4 báo cáo, đã học 20 ngày. */
async function readyStudent(email = "sv@example.com") {
  const sv = await enrolledStudent(email);
  await completeModuleLessons(sv.actor, [1, 2, 3]);
  await submitReport(sv.actor, "M1", reportFields);
  await completeModuleLessons(sv.actor, [4, 5, 6]);
  await submitReport(sv.actor, "M2", reportFields);
  await completeModuleLessons(sv.actor, [7, 8, 9]);
  await submitReport(sv.actor, "M3", reportFields);
  await completeModuleLessons(sv.actor, [10, 11, 12]);
  await submitReport(sv.actor, "M4", reportFields);
  const start = new Date(Date.now() - 20 * 86_400_000).toISOString().slice(0, 10);
  await db.update(enrollment).set({ startDate: start }).where(eq(enrollment.id, sv.enrollment.id));
  return sv;
}

async function passEverythingElse(enrollmentId: string) {
  await db.update(moduleReport).set({ status: "passed" }).where(eq(moduleReport.enrollmentId, enrollmentId));
  for (const quizId of ["M1", "M2", "M3-AB"]) {
    await db.insert(quizAttempt).values({ enrollmentId, quizId, questionIds: [], score: 90, passed: true, submittedAt: new Date() });
  }
}

async function submitted(email?: string) {
  const sv = await readyStudent(email);
  await submitFinalProject(sv.actor, { fields: finalFields, pdf: pdf(), selfAssessment, showProjectLink: true });
  const [project] = await db.select().from(finalProject).where(eq(finalProject.enrollmentId, sv.enrollment.id));
  return { sv, project: project! };
}

/** Mentor được phân công cho SV (SV đăng ký trước khi có mentor nên gán tay). */
async function assignedMentor(enrollmentId: string, email = "mentor@example.com") {
  const mentor = await staffActor(email, "mentor");
  await db.update(enrollment).set({ mentorId: mentor.userId }).where(eq(enrollment.id, enrollmentId));
  return mentor;
}

describe("Nộp dự án cuối", () => {
  it("chưa nộp báo cáo M4 / chưa đủ 14 ngày thì chưa mở", async () => {
    const sv = await enrolledStudent();
    await expect(submitFinalProject(sv.actor, { fields: finalFields, pdf: pdf(), selfAssessment, showProjectLink: true })).rejects.toThrow(/chưa mở/);
  });

  it("bắt buộc PDF, link hợp lệ, tự đánh giá đủ; lưu tự đánh giá cuối khóa", async () => {
    const sv = await readyStudent();
    await expect(submitFinalProject(sv.actor, { fields: finalFields, pdf: undefined, selfAssessment, showProjectLink: true })).rejects.toThrow(/PDF/);
    const png = new File([new Uint8Array([1])], "a.png", { type: "image/png" });
    await expect(submitFinalProject(sv.actor, { fields: finalFields, pdf: png, selfAssessment, showProjectLink: true })).rejects.toThrow(/PDF/);
    await expect(submitFinalProject(sv.actor, { fields: { ...finalFields, projectUrl: "abc" }, pdf: pdf(), selfAssessment, showProjectLink: true })).rejects.toThrow(/https/);
    await expect(submitFinalProject(sv.actor, { fields: finalFields, pdf: pdf(), selfAssessment: { delegate: 4 }, showProjectLink: true })).rejects.toThrow(/tự đánh giá/);
    await submitFinalProject(sv.actor, { fields: finalFields, pdf: pdf(), selfAssessment, showProjectLink: false });
    const [project] = await db.select().from(finalProject);
    expect(project).toMatchObject({ status: "submitted", version: 1, showProjectLink: false });
    expect(project?.pdfFileId).toBeTruthy();
    const [row] = await db.select().from(enrollment);
    expect(row?.selfAssessmentEnd).toEqual(selfAssessment);
    await expect(submitFinalProject(sv.actor, { fields: finalFields, pdf: pdf(), selfAssessment, showProjectLink: true })).rejects.toThrow(/chờ chấm/);
  });
});

describe("Chấm dự án", () => {
  it("< 70: Cần sửa, nộp lại 1 lần; lần 2 vẫn < 70 → Không đạt", async () => {
    const { sv, project } = await submitted();
    const mentor = await assignedMentor(sv.enrollment.id);
    expect((await finalQueue(mentor)).map((q) => q.id)).toEqual([project.id]);
    await expect(scoreFinalProject(mentor, project.id, { scores: rubric(60), comment: "" })).rejects.toThrow(/nhận xét/);
    expect(await scoreFinalProject(mentor, project.id, { scores: rubric(60), comment: "Thiếu kiểm thử." })).toMatchObject({ status: "needs_revision" });
    await submitFinalProject(sv.actor, { fields: finalFields, pdf: pdf(), selfAssessment, showProjectLink: true });
    expect((await db.select().from(finalProject))[0]).toMatchObject({ status: "submitted", version: 2 });
    expect(await scoreFinalProject(mentor, project.id, { scores: rubric(65), comment: "Vẫn thiếu." })).toMatchObject({ status: "failed" });
    expect((await db.select().from(enrollment))[0]?.status).toBe("failed");
  });

  it("điểm vượt thang bị từ chối; mentor không được phân công không chấm được", async () => {
    const { sv, project } = await submitted();
    const mentor = await assignedMentor(sv.enrollment.id);
    await expect(scoreFinalProject(mentor, project.id, { scores: { ...rubric(80), realProblem: 31 }, comment: "" })).rejects.toThrow(/0 đến 30/);
    const other = await staffActor("mentor2@example.com", "mentor");
    await expect(scoreFinalProject(other, project.id, { scores: rubric(80), comment: "" })).rejects.toThrow(ForbiddenError);
    expect(await scoreFinalProject(mentor, project.id, { scores: rubric(80), comment: "" })).toEqual({ status: "passed", total: 80 });
  });

  it("≥ 90: bắt buộc chấm lần 2 bởi người khác; điểm cuối là trung bình", async () => {
    const { sv, project } = await submitted();
    const mentor = await assignedMentor(sv.enrollment.id);
    expect(await scoreFinalProject(mentor, project.id, { scores: rubric(94), comment: "Rất tốt" })).toMatchObject({ status: "awaiting_second" });
    // Người chấm lần 1 không thấy trong hàng đợi lần 2 và không tự chấm lại.
    expect(await finalQueue(mentor)).toEqual([]);
    await expect(scoreFinalProject(mentor, project.id, { scores: rubric(94), comment: "" })).rejects.toThrow(/người khác/);
    // SV chưa thấy điểm lần 1 khi đang chờ chấm lần 2.
    expect((await finalOverviewFor(sv.enrollment)).feedback).toEqual([]);

    const second = await staffActor("mentor2@example.com", "mentor");
    expect((await finalQueue(second)).map((q) => q.status)).toEqual(["awaiting_second"]);
    await getProjectForScoring(second, project.id);
    const ta = await staffActor("ta@example.com", "ta");
    await expect(scoreFinalProject(ta, project.id, { scores: rubric(90), comment: "" })).rejects.toThrow(ForbiddenError);
    expect(await scoreFinalProject(second, project.id, { scores: rubric(88), comment: "" })).toEqual({ status: "passed", total: 91 });
  });
});

describe("Chứng nhận", () => {
  async function passed(email?: string, score = 80) {
    const { sv, project } = await submitted(email);
    const mentor = await assignedMentor(sv.enrollment.id, `mentor-${email ?? "a"}@example.com`);
    await scoreFinalProject(mentor, project.id, { scores: rubric(score), comment: "" });
    return sv;
  }

  it("chưa đủ điều kiện (báo cáo chưa Đạt, chưa đạt trắc nghiệm) thì không vào danh sách duyệt", async () => {
    const sv = await passed();
    const institute = await staffActor("vien@example.com", "institute_viewer");
    const eligibility = await eligibilityOf(sv.enrollment);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.checks.filter((c) => !c.ok)).toHaveLength(2);
    expect(await approvalQueue(institute, "institute")).toEqual([]);
    await expect(approveCertificates(institute, [sv.enrollment.id], "institute")).rejects.toThrow(/chưa đủ điều kiện/);
  });

  it("trường chưa kết nối: chỉ Viện duyệt → cấp mã, hồ sơ completed, gửi email; trang xác thực không lộ email", async () => {
    const sv = await passed();
    await passEverythingElse(sv.enrollment.id);
    const institute = await staffActor("vien@example.com", "institute_viewer");
    const queue = await approvalQueue(institute, "institute");
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ requiresSchool: false, score: 80 });
    const { issued } = await approveCertificates(institute, [sv.enrollment.id], "institute");
    expect(issued[0]).toMatch(/^[A-Z0-9]{10}$/);
    expect((await db.select().from(enrollment))[0]?.status).toBe("completed");
    expect(memoryOutbox.findLast((m) => m.to === "sv@example.com")?.text).toContain(issued[0]!);

    const publicInfo = await verifyCertificate(issued[0]!.toLowerCase());
    expect(publicInfo).toMatchObject({ studentName: "Sinh Viên Thử", issuers: ["Viện Đào tạo Bách Khoa"], grade: "completed", revoked: false });
    expect(JSON.stringify(publicInfo)).not.toContain("@");
    expect(await approvalQueue(institute, "institute")).toEqual([]);
  });

  it("trường đã kết nối: cần đủ QL trường + Viện; QL trường khác không duyệt được", async () => {
    const sv = await passed(undefined, 95);
    // Lần chấm ≥ 90 cần người thứ hai.
    const [project] = await db.select().from(finalProject);
    await scoreFinalProject(await staffActor("mentor2@example.com", "mentor"), project!.id, { scores: rubric(93), comment: "" });
    await passEverythingElse(sv.enrollment.id);
    await db.update(school).set({ connected: true }).where(eq(school.id, sv.enrollment.schoolId));

    const boss = await superAdminActor();
    await inviteStaff(boss, { email: "ql@example.com", role: "school_manager", scopeType: "school", scopeId: sv.enrollment.schoolId });
    const manager = (await loadActor((await signIn("ql@example.com")).userId))!;
    const [otherSchool] = await db.insert(school).values({ name: "ĐH Khác", connected: true }).returning();
    await inviteStaff(boss, { email: "ql2@example.com", role: "school_manager", scopeType: "school", scopeId: otherSchool!.id });
    const otherManager = (await loadActor((await signIn("ql2@example.com")).userId))!;
    const institute = await staffActor("vien@example.com", "institute_viewer");

    expect(await approvalQueue(otherManager, "school")).toEqual([]);
    await expect(approveCertificates(otherManager, [sv.enrollment.id], "school")).rejects.toThrow(ForbiddenError);

    expect((await approveCertificates(institute, [sv.enrollment.id], "institute")).issued).toEqual([]);
    expect((await db.select().from(certificate))[0]?.code).toBeNull();
    expect(await approvalQueue(manager, "school")).toHaveLength(1);
    const { issued } = await approveCertificates(manager, [sv.enrollment.id], "school");
    expect(issued).toHaveLength(1);
    const info = await verifyCertificate(issued[0]!);
    expect(info).toMatchObject({ issuers: ["ĐH Thử Nghiệm", "Viện Đào tạo Bách Khoa"], grade: "excellent" });
  });

  it("thu hồi: trang xác thực hiện đã thu hồi; chỉ admin thu hồi", async () => {
    const sv = await passed();
    await passEverythingElse(sv.enrollment.id);
    const institute = await staffActor("vien@example.com", "institute_viewer");
    const { issued } = await approveCertificates(institute, [sv.enrollment.id], "institute");
    const [cert] = await db.select().from(certificate);
    await expect(revokeCertificate(institute, cert!.id, "Gian lận")).rejects.toThrow(ForbiddenError);
    const admin = await staffActor("admin@example.com", "admin");
    await revokeCertificate(admin, cert!.id, "Gian lận");
    expect((await verifyCertificate(issued[0]!))?.revoked).toBe(true);
  });

  it("hạn cứng không đánh rớt SV đã có dự án Đạt đang chờ duyệt", async () => {
    const sv = await passed();
    const start = new Date(Date.now() - 70 * 86_400_000).toISOString().slice(0, 10);
    await db.update(enrollment).set({ startDate: start }).where(eq(enrollment.id, sv.enrollment.id));
    await updateStatuses();
    expect((await db.select().from(enrollment))[0]?.status).toBe("active");
  });
});
