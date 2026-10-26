"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/form/action-form";
import { FINAL_RUBRIC, SELF_ASSESSMENT } from "@/modules/curriculum/content/program";
import { ForbiddenError } from "@/modules/identity/policy";
import { requireActor } from "@/modules/identity/session";
import { approveCertificates, ProjectError, revokeCertificate, scoreFinalProject, submitFinalProject, type ApprovalRole } from "./service";

async function run(task: () => Promise<string>, path: string): Promise<FormState> {
  let message: string;
  try {
    message = await task();
  } catch (error) {
    if (error instanceof ProjectError) return { status: "error", message: error.message };
    if (error instanceof ForbiddenError) return { status: "error", message: "Bạn không có quyền thực hiện thao tác này." };
    throw error;
  }
  revalidatePath(path, "layout");
  return { status: "success", message };
}

export async function submitFinalAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const fields = Object.fromEntries([...formData.entries()].filter(([key]) => key.startsWith("ff_")).map(([key, value]) => [key.slice(3), String(value)]));
  const selfAssessment = Object.fromEntries(SELF_ASSESSMENT.map((q) => [q.key, Number(formData.get(`sa_${q.key}`))]));
  const pdf = formData.get("pdf");
  return run(async () => {
    await submitFinalProject(actor, { fields, pdf: pdf instanceof File ? pdf : undefined, selfAssessment, showProjectLink: formData.get("showProjectLink") === "on" });
    return "Đã nộp dự án cuối. Mentor sẽ chấm trong 3 ngày.";
  }, "/hoc");
}

export async function scoreFinalAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const scores = Object.fromEntries(FINAL_RUBRIC.map((r) => [r.key, Number(formData.get(`score_${r.key}`))]));
  return run(async () => {
    const { status, total } = await scoreFinalProject(actor, String(formData.get("projectId")), { scores, comment: String(formData.get("comment") ?? "") });
    if (status === "awaiting_second") return "Đã chấm ≥ 90 điểm: dự án chuyển sang chờ mentor thứ hai chấm độc lập.";
    if (status === "passed") return `Đã chấm Đạt (${total} điểm).`;
    if (status === "failed") return `Đã chấm Không đạt (${total} điểm).`;
    return `Đã chấm Cần sửa (${total} điểm) và gửi nhận xét cho SV.`;
  }, "/nhan-su");
}

export async function approveCertificatesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const as = formData.get("as") === "school" ? "school" : ("institute" satisfies ApprovalRole);
  const ids = formData.getAll("enrollmentId").map(String);
  return run(async () => {
    if (!ids.length) throw new ProjectError("Chọn ít nhất 1 sinh viên.");
    const { approved, issued } = await approveCertificates(actor, ids, as);
    return `Đã duyệt ${approved} SV${issued.length ? `, cấp ${issued.length} chứng nhận` : ", chờ lượt duyệt còn lại"}.`;
  }, "/truong");
}

export async function revokeCertificateAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  return run(async () => {
    await revokeCertificate(actor, String(formData.get("certificateId")), String(formData.get("reason") ?? ""));
    return "Đã thu hồi chứng nhận.";
  }, "/admin");
}
