"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { SELF_ASSESSMENT } from "@/modules/curriculum/content/program";
import { requireActor } from "@/modules/identity/session";
import { createEnrollment } from "./service";

export type EnrollState = { message: string };

const text = (formData: FormData, key: string) => {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
};

export async function enrollAction(_prev: EnrollState, formData: FormData): Promise<EnrollState> {
  const actor = await requireActor();
  const schoolChoice = text(formData, "schoolId");
  const facultyChoice = text(formData, "facultyId");
  let codeError: string | null = null;
  try {
    const result = await createEnrollment(actor, {
      name: text(formData, "name") ?? "",
      phone: text(formData, "phone"),
      studentCode: text(formData, "studentCode"),
      schoolId: schoolChoice && schoolChoice !== "other" ? schoolChoice : undefined,
      newSchoolName: schoolChoice === "other" ? text(formData, "newSchoolName") : undefined,
      facultyId: facultyChoice && facultyChoice !== "other" ? facultyChoice : undefined,
      newFacultyName: !facultyChoice || facultyChoice === "other" ? text(formData, "newFacultyName") : undefined,
      className: text(formData, "className"),
      track: String(formData.get("track") ?? "") as "A",
      targetPosition: text(formData, "targetPosition") ?? "",
      tools: formData.getAll("tools").map(String),
      selfAssessment: Object.fromEntries(SELF_ASSESSMENT.map((q) => [q.key, Number(formData.get(`sa_${q.key}`))])),
      consents: formData.getAll("consents").map(String) as never,
      activationCode: text(formData, "activationCode"),
    });
    codeError = result.codeError;
  } catch (error) {
    if (error instanceof ZodError) return { message: error.issues[0]?.message ?? "Vui lòng kiểm tra lại thông tin." };
    if (error instanceof Error) return { message: error.message };
    throw error;
  }
  redirect(codeError ? `/hoc?chao=1&loi-ma=${encodeURIComponent(codeError)}` : "/hoc?chao=1");
}
