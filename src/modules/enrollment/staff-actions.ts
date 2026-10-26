"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/form/action-form";
import { toFormState } from "@/lib/action-result";
import { requireActor } from "@/modules/identity/session";
import { extendEnrollment, pauseEnrollment, resumeEnrollment } from "./service";

export async function adjustEnrollmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const id = String(formData.get("enrollmentId"));
  const op = String(formData.get("op"));
  const result =
    op === "extend"
      ? await toFormState(() => extendEnrollment(actor, id), "Đã gia hạn thêm 7 ngày.")
      : op === "pause"
        ? await toFormState(() => pauseEnrollment(actor, id), "Đã bảo lưu. Đồng hồ lộ trình tạm dừng.")
        : await toFormState(() => resumeEnrollment(actor, id), "Đã tiếp tục lộ trình.");
  revalidatePath("/truong", "layout");
  return result;
}
