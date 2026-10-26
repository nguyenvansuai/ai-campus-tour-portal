"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActor } from "./session";
import { inviteStaff, InviteStaffInput, revokeRole, setUserStatus } from "./service";
import { ForbiddenError } from "./policy";

export type InviteStaffState = { status: "idle" | "success" | "error"; message: string; fieldErrors?: Record<string, string> };

export async function inviteStaffAction(_prev: InviteStaffState, formData: FormData): Promise<InviteStaffState> {
  const actor = await requireActor();
  const scopeType = String(formData.get("scopeType") ?? "global");
  const parsed = InviteStaffInput.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    scopeType,
    scopeId: scopeType === "global" ? null : String(formData.get("scopeId") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(z.flattenError(parsed.error).fieldErrors).map(([key, messages]) => [key, messages?.[0] ?? ""]),
    );
    return { status: "error", message: "Vui lòng kiểm tra lại thông tin.", fieldErrors };
  }
  try {
    const invitation = await inviteStaff(actor, parsed.data);
    return { status: "success", message: `Đã gửi lời mời tới ${invitation.email}.` };
  } catch (error) {
    if (error instanceof ForbiddenError) return { status: "error", message: "Bạn không có quyền mời vai trò này." };
    throw error;
  }
}

export type ManageState = { status: "idle" | "success" | "error"; message: string };

async function runManage(task: () => Promise<void>, success: string): Promise<ManageState> {
  try {
    await task();
    revalidatePath("/admin/nguoi-dung", "layout");
    return { status: "success", message: success };
  } catch (error) {
    if (error instanceof ForbiddenError) return { status: "error", message: "Bạn không có quyền thực hiện thao tác này." };
    if (error instanceof Error) return { status: "error", message: error.message };
    throw error;
  }
}

export async function setUserStatusAction(_prev: ManageState, formData: FormData): Promise<ManageState> {
  const actor = await requireActor();
  const input = z
    .object({ userId: z.string().min(1), status: z.enum(["active", "suspended"]) })
    .parse({ userId: formData.get("userId"), status: formData.get("status") });
  return runManage(
    () => setUserStatus(actor, input.userId, input.status),
    input.status === "suspended" ? "Đã khóa tài khoản và đăng xuất mọi thiết bị." : "Đã mở khóa tài khoản.",
  );
}

export async function revokeRoleAction(_prev: ManageState, formData: FormData): Promise<ManageState> {
  const actor = await requireActor();
  const assignmentId = z.uuid().parse(formData.get("assignmentId"));
  return runManage(() => revokeRole(actor, assignmentId), "Đã thu hồi vai trò.");
}
