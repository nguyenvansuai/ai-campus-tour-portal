import { ZodError } from "zod";
import type { FormState } from "@/components/form/action-form";
import { ForbiddenError } from "@/modules/identity/policy";

/** Chạy một thao tác trong server action và đổi lỗi thường gặp thành thông báo tiếng Việt. */
export async function toFormState(task: () => Promise<unknown>, success: string): Promise<FormState> {
  try {
    await task();
    return { status: "success", message: success };
  } catch (error) {
    if (error instanceof ForbiddenError) return { status: "error", message: "Bạn không có quyền thực hiện thao tác này." };
    if (error instanceof ZodError) return { status: "error", message: error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
    if (error instanceof Error && !/^(error|internal)/i.test(error.message)) return { status: "error", message: error.message };
    throw error;
  }
}
