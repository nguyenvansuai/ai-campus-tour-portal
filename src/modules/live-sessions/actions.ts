"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/form/action-form";
import { ForbiddenError } from "@/modules/identity/policy";
import { requireActor } from "@/modules/identity/session";
import { cancelSession, createSessions, LiveSessionError } from "./service";

async function run(task: () => Promise<string>): Promise<FormState> {
  let message: string;
  try {
    message = await task();
  } catch (error) {
    if (error instanceof LiveSessionError) return { status: "error", message: error.message };
    if (error instanceof ForbiddenError) return { status: "error", message: "Bạn không có quyền thực hiện thao tác này." };
    throw error;
  }
  revalidatePath("/nhan-su/ho-tro", "layout");
  revalidatePath("/hoc/ho-tro");
  return { status: "success", message };
}

export async function createSessionsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  return run(async () => {
    const total = await createSessions(actor, {
      title: String(formData.get("title") ?? ""),
      startsAt: String(formData.get("startsAt") ?? ""),
      durationMinutes: Number(formData.get("durationMinutes")),
      note: String(formData.get("note") ?? ""),
      repeatWeeks: Number(formData.get("repeatWeeks") ?? 1),
    });
    return `Đã tạo ${total} buổi.`;
  });
}

export async function cancelSessionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  return run(async () => {
    await cancelSession(actor, String(formData.get("sessionId")));
    return "Đã hủy buổi.";
  });
}
