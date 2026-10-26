"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/form/action-form";
import { toFormState } from "@/lib/action-result";
import { requireActor } from "@/modules/identity/session";
import { createActivationCode, createClass, createEvent, createFaculty, createSchool, mergeSchools, updateSchool } from "./service";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function createSchoolAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const result = await toFormState(
    () => createSchool(actor, { name: text(formData, "name"), shortName: text(formData, "shortName") || null, connected: formData.get("connected") === "on" }),
    "Đã thêm trường.",
  );
  revalidatePath("/admin/truong");
  return result;
}

export async function updateSchoolAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const schoolId = text(formData, "schoolId");
  const result = await toFormState(
    () =>
      updateSchool(actor, schoolId, {
        name: text(formData, "name"),
        shortName: text(formData, "shortName") || null,
        connected: formData.get("connected") === "on",
        status: formData.get("verified") === "on" ? "verified" : "pending",
      }),
    "Đã lưu.",
  );
  revalidatePath("/admin/truong", "layout");
  return result;
}

export async function createFacultyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const result = await toFormState(() => createFaculty(actor, { schoolId: text(formData, "schoolId"), name: text(formData, "name") }), "Đã thêm khoa.");
  revalidatePath("/admin/truong", "layout");
  return result;
}

export async function createClassAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const result = await toFormState(() => createClass(actor, { facultyId: text(formData, "facultyId"), name: text(formData, "name") }), "Đã thêm lớp.");
  revalidatePath("/admin/truong", "layout");
  return result;
}

export async function mergeSchoolAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const result = await toFormState(
    () => mergeSchools(actor, { keepId: text(formData, "keepId"), removeId: text(formData, "removeId") }),
    "Đã gộp trường.",
  );
  revalidatePath("/admin/truong", "layout");
  return result;
}

export async function createEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const result = await toFormState(
    () => createEvent(actor, { schoolId: text(formData, "schoolId"), name: text(formData, "name"), heldOn: text(formData, "heldOn") }),
    "Đã tạo sự kiện.",
  );
  revalidatePath("/admin/su-kien");
  return result;
}

export async function createCodeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor();
  const result = await toFormState(
    () =>
      createActivationCode(actor, {
        eventId: text(formData, "eventId"),
        maxUses: Number(formData.get("maxUses")),
        validDays: Number(formData.get("validDays")),
      }),
    "Đã tạo mã kích hoạt.",
  );
  revalidatePath("/admin/su-kien");
  return result;
}
