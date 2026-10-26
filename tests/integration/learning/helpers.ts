import { loadActor } from "@/modules/identity/actor";
import type { ConsentKey } from "@/modules/identity/consent-keys";
import { createEnrollment, getOpenEnrollment } from "@/modules/enrollment/service";
import { lessonByNumber, lessonContentFor } from "@/modules/curriculum/content/program";
import type { Track } from "@/modules/curriculum/types";
import { completeLesson } from "@/modules/learning/service";
import { signIn } from "../identity/helpers";

export async function enrolledStudent(email = "sv@example.com", track: Track = "A") {
  const { userId, cookie } = await signIn(email);
  const actor = (await loadActor(userId))!;
  await createEnrollment(actor, {
    name: "Sinh Viên Thử",
    newSchoolName: "ĐH Thử Nghiệm",
    newFacultyName: "Kế toán",
    track,
    targetPosition: "Nhân viên kế toán",
    tools: ["free_chat"],
    selfAssessment: { delegate: 1, verify: 1, office: 1, jobHunt: 1, automation: 1 },
    consents: ["data_processing", "share_with_school"] as ConsentKey[],
  });
  return { actor, cookie, enrollment: (await getOpenEnrollment(userId))! };
}

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

/** Minh chứng hợp lệ cho mọi trường của buổi học. */
export function validSubmission(lessonNumber: number, track: Track = "A") {
  const content = lessonContentFor(lessonByNumber(lessonNumber)!, track);
  const values: Record<string, string> = {};
  const files: Record<string, File> = {};
  for (const field of content.evidence) {
    if (field.type === "file") {
      files[field.key] = field.accept.includes("pdf") ? new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "cv.pdf", { type: "application/pdf" }) : new File([PNG], "anh.png", { type: "image/png" });
    } else if (field.type === "link") values[field.key] = "https://docs.google.com/document/d/abc";
    else if (field.type === "number") values[field.key] = "30";
    else values[field.key] = "Nội dung minh chứng đủ dài. ".repeat(20);
  }
  return {
    lessonNumber,
    values,
    files,
    reflectionMistake: "AI đưa ra số liệu sai về quy định nghỉ phép.",
    reflectionVerify: "Tôi đối chiếu với văn bản luật gốc và sửa lại.",
    sourceCodes: ["N2"],
  };
}

export async function completeModuleLessons(actor: Awaited<ReturnType<typeof enrolledStudent>>["actor"], lessons: number[], track: Track = "A") {
  for (const n of lessons) await completeLesson(actor, validSubmission(n, track));
}
