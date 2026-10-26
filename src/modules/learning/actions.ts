"use server";

import { revalidatePath } from "next/cache";
import type { ModuleId } from "@/modules/curriculum/types";
import type { ReportModuleId } from "@/modules/enrollment/schedule";
import { ForbiddenError } from "@/modules/identity/policy";
import { requireActor } from "@/modules/identity/session";
import { completeLesson, LearningError, startQuiz, submitQuiz, submitReport } from "./service";

export type LessonFormState = { status: "idle" | "success" | "error"; message: string };

function toMessage(error: unknown) {
  if (error instanceof LearningError) return error.message;
  if (error instanceof ForbiddenError) return "Bạn không có quyền thực hiện thao tác này.";
  throw error;
}

export async function completeLessonAction(_prev: LessonFormState, formData: FormData): Promise<LessonFormState> {
  const actor = await requireActor();
  const lessonNumber = Number(formData.get("lessonNumber"));
  const values: Record<string, string> = {};
  const files: Record<string, File> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("ev_")) continue;
    if (value instanceof File) {
      if (value.size > 0) files[key.slice(3)] = value;
    } else values[key.slice(3)] = value;
  }
  try {
    await completeLesson(actor, {
      lessonNumber,
      values,
      files,
      reflectionMistake: String(formData.get("reflectionMistake") ?? ""),
      reflectionVerify: String(formData.get("reflectionVerify") ?? ""),
      sourceCodes: formData.getAll("sources").map(String),
    });
  } catch (error) {
    return { status: "error", message: toMessage(error) };
  }
  revalidatePath("/hoc", "layout");
  return { status: "success", message: "Đã ghi nhận hoàn thành buổi học. Làm tốt lắm!" };
}

export async function startQuizAction(moduleId: ModuleId) {
  const actor = await requireActor();
  try {
    return { ok: true as const, quiz: await startQuiz(actor, moduleId) };
  } catch (error) {
    return { ok: false as const, message: toMessage(error) };
  }
}

export async function submitQuizAction(attemptId: string, answers: Record<string, number>) {
  const actor = await requireActor();
  try {
    const result = await submitQuiz(actor, attemptId, answers);
    revalidatePath("/hoc", "layout");
    return { ok: true as const, result };
  } catch (error) {
    return { ok: false as const, message: toMessage(error) };
  }
}

export async function submitReportAction(_prev: LessonFormState, formData: FormData): Promise<LessonFormState> {
  const actor = await requireActor();
  const moduleId = String(formData.get("moduleId")) as ReportModuleId;
  const fields = Object.fromEntries([...formData.entries()].filter(([key]) => key.startsWith("rf_")).map(([key, value]) => [key.slice(3), String(value)]));
  try {
    await submitReport(actor, moduleId, fields);
  } catch (error) {
    return { status: "error", message: toMessage(error) };
  }
  revalidatePath("/hoc", "layout");
  return { status: "success", message: "Đã nộp báo cáo. Module tiếp theo đã mở. Mentor sẽ phản hồi trong 3 ngày." };
}
