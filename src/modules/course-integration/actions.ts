"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/form/action-form";
import { getOpenEnrollment } from "@/modules/enrollment/service";
import { ForbiddenError } from "@/modules/identity/policy";
import { requireActor } from "@/modules/identity/session";
import { VOUCHER_KINDS, type VoucherKind } from "./schema";
import { claimVoucher, CourseError, importVouchers, recordManualCredits, revokeCredit } from "./service";

async function run(task: () => Promise<string>, path: string): Promise<FormState> {
  let message: string;
  try {
    message = await task();
  } catch (error) {
    if (error instanceof CourseError) return { status: "error", message: error.message };
    if (error instanceof ForbiddenError) return { status: "error", message: "Bạn không có quyền thực hiện thao tác này." };
    throw error;
  }
  revalidatePath(path, "layout");
  return { status: "success", message };
}

const kindOf = (value: FormDataEntryValue | null): VoucherKind => (VOUCHER_KINDS.includes(value as VoucherKind) ? (value as VoucherKind) : "discount");

export async function recordManualAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  return run(async () => {
    const total = await recordManualCredits(actor, { emails: String(formData.get("emails") ?? ""), modules: formData.getAll("modules").map(String), note: String(formData.get("note") ?? "") });
    return `Đã ghi nhận ${total} SV.`;
  }, "/admin/khoa-hoc");
}

export async function revokeCreditAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  return run(async () => {
    await revokeCredit(actor, String(formData.get("creditId")), String(formData.get("reason") ?? ""));
    return "Đã thu hồi ghi nhận.";
  }, "/admin/khoa-hoc");
}

export async function importVouchersAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  return run(async () => {
    const { added, skipped } = await importVouchers(actor, kindOf(formData.get("kind")), String(formData.get("codes") ?? ""));
    return `Đã thêm ${added} mã${skipped ? `, bỏ qua ${skipped} mã trùng` : ""}.`;
  }, "/admin/khoa-hoc");
}

export async function claimVoucherAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const row = await getOpenEnrollment(actor.userId);
  return run(async () => {
    const code = await claimVoucher(actor, kindOf(formData.get("kind")), { hasOpenEnrollment: Boolean(row), fromWorkshop: Boolean(row?.eventId) });
    return `Mã của bạn: ${code}`;
  }, "/hoc/khoa-su-ai");
}
