"use server";

import { z } from "zod";
import { requireActor } from "./session";
import { inviteStaff, InviteStaffInput } from "./service";
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
