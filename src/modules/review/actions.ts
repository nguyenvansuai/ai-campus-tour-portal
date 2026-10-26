"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/form/action-form";
import { ForbiddenError } from "@/modules/identity/policy";
import { requireActor } from "@/modules/identity/session";
import { precheckReport, ReviewError, reviewReport, spotCheckLesson } from "./service";

async function run(task: () => Promise<unknown>, success: string): Promise<FormState> {
  try {
    await task();
  } catch (error) {
    if (error instanceof ReviewError) return { status: "error", message: error.message };
    if (error instanceof ForbiddenError) return { status: "error", message: "Bạn không có quyền thực hiện thao tác này." };
    throw error;
  }
  revalidatePath("/nhan-su", "layout");
  return { status: "success", message: success };
}

export async function precheckAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const ok = formData.get("decision") === "ok";
  return run(
    () => precheckReport(actor, String(formData.get("reportId")), { ok, comment: String(formData.get("comment") ?? "") }),
    ok ? "Đã xác nhận đủ hồ sơ, chuyển mentor chấm." : "Đã trả lại để SV bổ sung.",
  );
}

export async function reviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const total = Number(formData.get("criteriaCount"));
  const criteriaMet = Array.from({ length: total }, (_, i) => formData.get(`criterion_${i}`) === "on");
  return run(
    () => reviewReport(actor, String(formData.get("reportId")), { criteriaMet, comment: String(formData.get("comment") ?? "") }),
    criteriaMet.every(Boolean) ? "Đã chấm Đạt." : "Đã chấm Cần sửa và gửi nhận xét cho SV.",
  );
}

export async function spotCheckAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const ok = formData.get("decision") === "ok";
  return run(
    () => spotCheckLesson(actor, String(formData.get("lessonProgressId")), { ok, note: String(formData.get("note") ?? "") }),
    ok ? "Đã đánh dấu hợp lệ." : "Đã đánh dấu không hợp lệ, buổi học bị bỏ tích.",
  );
}
